import os
import json
import re
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from openai import OpenAI
from concurrent.futures import ThreadPoolExecutor, as_completed

# ================= 新增引入 =================
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ===========================================

# ================= 配置区域 =================
# API 配置
API_KEY = "sk-D7OWUqvBcM500TgnC4UBixNKHiiguyppWdSw11xgVjKVDdFU"
BASE_URL = "https://hk-api.gptbest.vip/v1"

# 知识图谱写入服务（MCP 服务对应的 HTTP 接口，由 地图生成/server.js 或 MCP 桥接提供）
# 脚本只向该服务传入由 LLM 提取生成的参数，不直接写数据库
GRAPH_WRITE_SERVICE_URL = os.environ.get(
    "KNOWLEDGE_GRAPH_API_URL",
    "http://localhost:3000/api/graph/add"
)
NEO4J_DATABASE = "chunk2"  # 写入时使用的数据库名（可随请求传入）

# 模型配置
CHAT_MODEL_NAME = "gemini-3-flash-preview-thinking-*"

# 目标文件
SOURCE_FILE = "../static/白鸟遥角色设计.md"


# ===========================================

def send_graph_data_to_service(
    nodes: List[Dict],
    relationships: List[Dict],
    chunk_index: int,
    database: Optional[str] = None,
    service_url: Optional[str] = None,
) -> Dict[str, Any]:

    url = service_url or GRAPH_WRITE_SERVICE_URL
    body = {
        "nodes": nodes,
        "relationships": relationships,
        "chunk_index": chunk_index,
    }
    if database is not None:
        body["database"] = database

    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8")
            err_data = json.loads(err_body)
            raise RuntimeError(err_data.get("error", err_body))
        except (ValueError, json.JSONDecodeError):
            raise RuntimeError(f"HTTP {e.code}: {e.reason}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"请求失败: {e.reason}")


def load_file(filepath):
    """文件读取"""
    if not os.path.exists(filepath):
        print(f"文件不存在: {filepath}")
        return ""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def build_system_prompt():
    """构建 System Prompt"""
    return """
你是一个专家级的数据科学家，专门负责从文本中构建知识图谱。
你必须使用【思维链】模式进行严谨的逻辑推理，然后输出最终结果。
"""


def extract_graph_from_chunk(client: OpenAI, text_chunk: str):
    """调用 OpenAI 接口提取图谱"""
    user_content = f"""请分析以下文本片段，提取关键主题和它们之间的关系。

你必须使用【思维链】模式进行严谨的逻辑推理，然后输出最终结果。

==============================================================
                    【思维链推理框架 Chain of Thought】
==============================================================

推理时要按照思维链框架，一步一步分析，最后生成高质量的知识图谱：

【STEP 1: 文档理解 Document Understanding】
分析文档的整体内容和结构：
- 文档的主题是什么？主要讨论什么内容？
- 文档的结构如何？（章节、段落、重点）
- 文档的核心概念和关键信息有哪些？

【STEP 2: 主题识别 Theme Identification】
识别文档中的关键主题：
- 基于固定的节点类型（人物信息、背景故事、能力设定、装备礼装），识别文档中的关键主题和关键词
- 针对每种类型，识别其中的关键主题：
  * 人物信息类型：如姓名、年龄、身份、职位、外貌等
  * 背景故事类型：如出身、经历、重要事件等
  * 能力设定类型：如技能、魔术、特殊能力等
  * 装备礼装类型：如武器、道具、礼装等
  * 魔术术式类型：如果遇到了具体的魔术术式，则一定要对每一个魔术术式进行提取

【STEP 3: 节点类型确定 Node Type Determination】
为每个识别出的主题确定其类型（type）：
- 节点类型只能从以下4种固定类型中选择，必须严格匹配：
  * "人物信息" - 如果主题描述人物的基本信息（姓名、年龄、身份、职位、外貌等）
  * "背景故事" - 如果主题描述人物的背景、经历、重要事件、历史等
  * "能力设定" - 如果主题描述人物的技能、魔术、特殊能力、战斗方式等
  * "装备礼装" - 如果主题描述武器、道具、礼装、装备等
- 根据主题的内容和特征，将其归类到最合适的类型
- 确保每个节点的type准确反映其所属的类型
- type必须使用中文，且只能是上述4种类型之一

【STEP 4: 内容提取 Content Extraction】
为每个识别出的主题提取相关内容：
- 从文档中找到与每个主题最相关的段落、句子或描述
- 确保 content 字段包含该主题的核心信息
- 内容要准确、完整，能够充分说明该主题
- 避免重复或冗余的内容

【STEP 5: 关系提取与分析 Relationship Extraction and Analysis】
综合分析主题之间的关系，提取最准确、最合理的关系：

- 如果两个主题在文档中只是简单提及但没有明确的关联描述，**不要创建关系**
- **允许空关系**：如果整个chunk中都没有明确的关系，relationships数组可以为空 []

**关系准确性要求**：
- 为每对节点选择最准确、最具体的关系类型，避免使用过于宽泛或容易混淆的关系类型
- 优先使用语义明确、含义清晰的关系类型，用中文回答
- 避免使用过于通用或容易产生歧义的关系类型

**关系描述要求**：
- 每个关系必须包含清晰、准确的context描述，说明这个关系是如何在文档中体现的
- context描述应该：
  * 引用文档中的具体内容或描述
  * 说明关系的具体含义和表现形式
  * 避免使用模糊、笼统的描述（如"有关联"、"相关"等）
  * 使用具体、明确的描述（如"角色拥有该能力，在文档中描述了能力的具体效果和使用方式"）
- 确保context描述与关系类型一致，避免描述与类型不匹配

**逻辑正确性要求**：
- 验证每个关系的合理性：是否符合文档内容、是否符合逻辑常识
- 确保关系的方向正确：source和target的语义关系要符合逻辑
- 避免创建逻辑矛盾或不符合常识的关系
- 如果关系存在歧义或不确定，优先选择最符合文档原意的解释

**关系提取原则**：
- 只提取文档中确实存在的关系，不要为了连通性而强制创建关系
- **允许孤立节点**：如果某个主题在文档中没有与其他主题建立明确的关系，可以保留为孤立节点（没有关系的节点）
- **禁止行为**：绝对不要为了"让图谱看起来完整"而创建不存在的关系
- 确保关系反映实质性的关联，而不是简单的共现或偶然提及

【STEP 6: 图谱构建 Graph Construction】
构建最终的知识图谱结构：
- 组织节点和关系，形成知识图谱（**不要求所有节点都连接**）
- 确保所有节点的 id 唯一且有意义
- 确保所有关系的 source 和 target 都对应存在的节点
- 验证图谱的逻辑一致性（**不要求完整性，允许非连通图**）
- **图谱不要求连通**：生成的图谱可以是非连通图，允许存在：
  * 孤立的节点（没有任何关系的节点）- **这是完全正常和允许的**
  * 多个独立的子图（相互之间没有连接的节点组）
  * 只包含节点没有关系的图谱也是有效的（relationships可以为空数组）
- **重要**：如果文档片段中确实没有明确的关系，可以只返回节点，不返回任何关系

【STEP 7: 质量验证 Quality Verification】
验证提取的质量和完整性：
- ✅ 每个节点是否都有 type 和 content 字段？
- ✅ 关系是否反映实质性关联？
- ✅ 是否有遗漏的重要主题？
- ✅ 图谱结构是否合理？
- ✅ 孤立节点是允许的，不需要强制连接所有节点

==============================================================
                    【输出格式 - 严格JSON】
==============================================================

必须严格遵守 JSON 格式输出，包含 thinking（思维链推理过程）和最终结果。

JSON 结构：
{{
  "thinking": {{
    "step1_document_understanding": "【文档理解】分析文档的主题、结构、核心概念...",
    "step2_theme_identification": "【主题识别】基于固定类型（人物信息、背景故事、能力设定、装备礼装）识别出X个关键主题：主题1、主题2...",
    "step3_node_type_determination": "【节点类型确定】为每个主题确定type：主题1属于"人物信息"类型，主题2属于"能力设定"类型...",
    "step4_content_extraction": "【内容提取】为每个主题提取相关内容...",
    "step5_relationship_extraction": "【关系提取与分析】分析主题之间的关系，提取最准确、最合理的关系，确保关系类型准确、描述清晰、逻辑正确。如果文档中没有明确的关系，可以识别出0条关系，这是完全允许的...",
    "step6_graph_construction": "【图谱构建】构建包含X个节点、Y条关系的知识图谱（Y可以为0，允许非连通图）...",
    "step7_quality_verification": "【质量验证】验证节点数量、内容完整性、关系准确性和合理性..."
  }},
  "nodes": [
    {{
      "id": "主题标识",
      "type": "节点类型（中文，必须是：人物信息、背景故事、能力设定、装备礼装之一）",
      "content": "文档中与该主题相关的具体内容"
    }}
  ],
  "relationships": [
    {{
      "source": "源主题的id",
      "target": "目标主题的id",
      "type": "关系类型（英文大写加下划线）",
      "context": "关系的描述或上下文信息，说明这个关系是如何在文档中体现的"
    }}
  ]
}}

**节点 (Nodes)** - 每个节点代表一个关键主题或关键词：
   - `id`: 主题的唯一标识名称（保持简洁，通常是一个词或短语）
   - `type`: 节点的类型（中文，必须是以下4种之一："人物信息"、"背景故事"、"能力设定"、"装备礼装"）。这是必填字段
   - `content`: 文档中与该主题相关的具体内容（可以是段落、句子或关键描述）。这是必填字段

**关系 (Relationships)** - 表示主题之间的关联：
   - `source`: 源主题的 id
   - `target`: 目标主题的 id
   - `type`: 关系的类型（例如：HAS_ABILITY, OWNS, USES, BELONGS_TO, DEPENDS_ON等）。必须使用英文大写加下划线格式。优先使用语义明确、含义清晰的关系类型，避免使用过于宽泛的RELATED_TO（仅在确实无法找到更具体关系时使用）
   - `context`: 关系的描述或上下文信息（必填字段），必须清晰、准确地说明这个关系是如何在文档中体现的。应该引用文档中的具体内容，说明关系的具体含义和表现形式，避免使用模糊、笼统的描述（如"有关联"、"相关"等），使用具体、明确的描述

**重要提示**：
- 每个节点的 content 应该包含文档中与该主题最相关的具体内容
- 关系应该反映主题之间的实质性关联，而不是简单的共现
- **图谱不要求连通**：允许存在孤立节点（没有关系的节点）和多个独立的子图，不要为了连通性而强制创建不存在的关系
- **允许空关系数组**：如果文档片段中没有明确的关系，relationships字段可以返回空数组 []，这是完全正常和有效的
- **禁止强制连通**：绝对不要为了"让所有节点都连接"而创建不存在的关系
- thinking 字段必须完整记录7步推理过程
- 必须且只能返回纯 JSON 格式，不要包含Markdown代码块或其他文字

JSON 结构示例：
{{
  "thinking": {{
    "step1_document_understanding": "文档讨论角色设计相关主题...",
    "step2_theme_identification": "基于固定类型（人物信息、背景故事、能力设定、装备礼装）识别出2个关键主题：角色姓名、特殊能力",
    "step3_node_type_determination": "角色姓名属于"人物信息"类型，特殊能力属于"能力设定"类型",
    "step4_content_extraction": "为每个主题提取相关内容...",
    "step5_relationship_type_summary": "总结关系类型：拥有关系适用于当前文档",
    "step6_relationship_analysis": "角色姓名拥有特殊能力，使用拥有关系",
    "step7_graph_construction": "构建包含2个节点、1条关系的图谱",
    "step8_quality_verification": "节点数量适中，内容完整，关系合理"
  }},
  "nodes": [
    {{
      "id": "角色姓名",
      "type": "人物信息",
      "content": "角色的姓名和基本信息。"
    }},
    {{
      "id": "特殊能力",
      "type": "能力设定",
      "content": "角色拥有的特殊能力和技能描述。"
    }}
  ],
  "relationships": [
    {{
      "source": "角色姓名",
      "target": "特殊能力",
      "type": "HAS_ABILITY",
      "context": "角色拥有特殊能力，在文档中明确描述了角色如何使用这些能力的具体效果和使用方式，包括能力的名称、作用机制和实际应用场景"
    }}
  ]
}}

JSON 结构示例（包含孤立节点的情况 - 这是完全允许的）：
{{
  "thinking": {{
    "step1_document_understanding": "文档讨论角色设计相关主题...",
    "step2_theme_identification": "基于固定类型（人物信息、背景故事、能力设定、装备礼装）识别出3个关键主题：角色姓名、技能描述、装备信息",
    "step3_node_type_determination": "角色姓名属于"人物信息"类型，技能描述属于"能力设定"类型，装备信息属于"装备礼装"类型",
    "step4_content_extraction": "为每个主题提取相关内容...",
    "step5_relationship_extraction": "分析文档内容，发现这些主题在文档中只是分别描述，没有明确的关联关系，因此不创建关系",
    "step6_graph_construction": "构建包含3个节点、0条关系的图谱，所有节点都是孤立的，这是正常的",
    "step7_quality_verification": "节点数量适中，内容完整，虽然没有关系但这是符合文档实际情况的"
  }},
  "nodes": [
    {{
      "id": "角色姓名",
      "type": "人物信息",
      "content": "角色的姓名和基本信息。"
    }},
    {{
      "id": "技能描述",
      "type": "能力设定",
      "content": "角色拥有的技能描述。"
    }},
    {{
      "id": "装备信息",
      "type": "装备礼装",
      "content": "角色使用的装备信息。"
    }}
  ],
  "relationships": []  // 空数组是完全允许的，表示没有关系
}}

文本片段内容：
{text_chunk}"""

    try:
        response = client.chat.completions.create(
            model=CHAT_MODEL_NAME,
            messages=[
                {"role": "system", "content": build_system_prompt()},
                {"role": "user", "content": user_content}
            ],
            temperature=0.4,
        )

        content = response.choices[0].message.content.strip()

        # 清洗数据
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            return json.loads(json_str)
        else:
            print("  ! 警告：未能从模型返回中找到 JSON 对象。")
            return None

    except json.JSONDecodeError:
        print("  ! 错误：模型返回的不是有效的 JSON。")
        return None
    except Exception as e:
        print(f"  ! API 调用错误: {e}")
        return None


def main():
    # 1. 知识图谱写入服务（MCP 对应 HTTP 接口）
    print(f"图谱写入服务: {GRAPH_WRITE_SERVICE_URL} (数据库: {NEO4J_DATABASE})")
    print("脚本只向该服务传入由 LLM 提取生成的参数，不直接写数据库。")

    # 2. 初始化 OpenAI 客户端
    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

    # 3. 加载并切分文件
    print("正在加载文档...")
    full_text = load_file(SOURCE_FILE)
    if not full_text:
        with open(SOURCE_FILE, "w", encoding="utf-8") as f:
            f.write("# 示例\nGeoffrey Hinton 是深度学习之父，他在 Google 工作。")
        full_text = load_file(SOURCE_FILE)

    # ================= 修改开始：使用 RecursiveCharacterTextSplitter =================
    print("正在使用 RecursiveCharacterTextSplitter 切分文档...")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=3000,
        chunk_overlap=600,
        separators=["\n\n", "\n", "。", "！", "？", " ", ""]
    )

    # 注意：split_text 返回的是字符串列表 (List[str])，这正是我们需要的
    chunks = text_splitter.split_text(full_text)
    # ================= 修改结束 =================

    print(f"文档已切分为 {len(chunks)} 个片段。")

    # 4. 并行处理每个片段
    def process_chunk(chunk_data):
        """处理单个chunk的函数"""
        chunk_index, chunk = chunk_data
        preview = chunk[:50].replace('\n', ' ')

        try:
            # 为每个线程创建独立的OpenAI客户端
            thread_client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

            # 抽取图谱数据
            graph_data = extract_graph_from_chunk(thread_client, chunk)

            if graph_data:
                nodes = graph_data.get("nodes", [])
                relationships = graph_data.get("relationships", [])
                return {
                    "chunk_index": chunk_index,
                    "nodes": nodes,
                    "relationships": relationships,
                    "preview": preview,
                    "success": True
                }
            else:
                return {
                    "chunk_index": chunk_index,
                    "nodes": [],
                    "relationships": [],
                    "preview": preview,
                    "success": False,
                    "message": "未提取到有效数据"
                }
        except Exception as e:
            return {
                "chunk_index": chunk_index,
                "nodes": [],
                "relationships": [],
                "preview": preview,
                "success": False,
                "message": f"处理出错: {str(e)}"
            }

    # 使用线程池并行处理
    max_workers = min(5, len(chunks))  # 最多5个并发线程，避免过多并发
    print(f"使用 {max_workers} 个线程并行处理 {len(chunks)} 个片段...")

    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # 提交所有任务
        future_to_chunk = {
            executor.submit(process_chunk, (i, chunk)): i
            for i, chunk in enumerate(chunks)
        }

        # 收集结果（按完成顺序）
        completed_count = 0
        for future in as_completed(future_to_chunk):
            chunk_index = future_to_chunk[future]
            completed_count += 1
            try:
                result = future.result()
                results.append(result)

                if result["success"]:
                    print(f"[{completed_count}/{len(chunks)}] 片段 {chunk_index + 1} 完成: "
                          f"识别到 {len(result['nodes'])} 个节点, {len(result['relationships'])} 条关系")
                else:
                    print(
                        f"[{completed_count}/{len(chunks)}] 片段 {chunk_index + 1} 完成: {result.get('message', '未提取到数据')}")
            except Exception as e:
                print(f"[{completed_count}/{len(chunks)}] 片段 {chunk_index + 1} 处理失败: {e}")
                results.append({
                    "chunk_index": chunk_index,
                    "nodes": [],
                    "relationships": [],
                    "success": False,
                    "message": f"异常: {str(e)}"
                })

    # 5. 按 chunk_index 排序结果，然后向知识图谱写入服务传参（不直接写库）
    results.sort(key=lambda x: x["chunk_index"])
    print(f"\n开始将提取结果发送到知识图谱写入服务...")

    for result in results:
        if result["success"]:
            try:
                resp = send_graph_data_to_service(
                    result["nodes"],
                    result["relationships"],
                    chunk_index=result["chunk_index"],
                    database=NEO4J_DATABASE,
                )
                n_created = resp.get("nodesCreated", 0)
                r_created = resp.get("relationshipsCreated", 0)
                print(f"  - chunk {result['chunk_index']}: 已写入 {n_created} 节点, {r_created} 关系")
            except Exception as e:
                print(f"  ! chunk {result['chunk_index']} 写入失败: {e}")

    print(f"\n任务完成！数据已通过服务写入 '{NEO4J_DATABASE}' 数据库。")
    print("请在 Neo4j Browser 中使用数据库 '{NEO4J_DATABASE}' 并运行 'MATCH (n) RETURN n LIMIT 25' 查看结果。")


if __name__ == "__main__":
    main()
import json
import re
from openai import OpenAI


def build_system_prompt():
    """构建 System Prompt"""
    return """
你是一个专家级的数据科学家，专门负责从文本中构建知识图谱。
你必须使用【思维链】模式进行严谨的逻辑推理，然后输出最终结果。
"""


def extract_graph_from_document(client: OpenAI, full_text: str, model_name: str):
    """从整篇文档中提取主题图谱
    
    Args:
        client: OpenAI客户端
        full_text: 完整文档内容
        model_name: 使用的模型名称
        
    Returns:
        包含nodes和relationships的字典，如果失败则返回None
    """
    user_content = f"""请分析以下完整文档，提取关键主题和它们之间的关系。

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

【STEP 5: 关系类型总结 Relationship Type Summary】
首先总结文档中可能涉及的关系类型：
- 分析文档中主题之间可能存在的各种关系类型
- 常见关系类型包括但不限于：
- 根据文档内容和实体类型，确定哪些关系类型最适用于当前文档
- 为每种关系类型准备合适的命名（使用中文）

【STEP 6: 关系分析 Relationship Analysis】
基于总结的关系类型，分析主题之间的具体关系：
- 识别主题之间的语义关联，使用STEP 4中总结的关系类型
- 判断关系的类型和方向（source → target）
- 确保关系反映实质性的关联，而不是简单的共现
- 验证每个关系的合理性（是否符合文档内容、是否符合逻辑）

【STEP 7: 图谱构建 Graph Construction】
构建最终的知识图谱结构：
- 组织节点和关系，形成完整的图谱
- 确保所有节点的 id 唯一且有意义
- 确保所有关系的 source 和 target 都对应存在的节点
- 验证图谱的逻辑一致性和完整性

【STEP 8: 质量验证 Quality Verification】
验证提取的质量和完整性：
- ✅ 每个节点是否都有 type 和 content 字段？
- ✅ 关系是否反映实质性关联？
- ✅ 是否有遗漏的重要主题？
- ✅ 是否有重复或冗余的节点？
- ✅ 图谱结构是否合理？

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
    "step5_relationship_type_summary": "【关系类型总结】总结文档中可能涉及的关系类型...",
    "step6_relationship_analysis": "【关系分析】基于总结的关系类型，分析主题之间的具体关系，识别出Y条关系...",
    "step7_graph_construction": "【图谱构建】构建包含X个节点、Y条关系的知识图谱...",
    "step8_quality_verification": "【质量验证】验证节点数量、内容完整性、关系合理性..."
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
      "type": "关系类型（英文大写加下划线）"
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
   - `type`: 关系的类型（例如：RELATED_TO, CONTAINS, DEPENDS_ON, SIMILAR_TO）。必须使用英文大写加下划线格式

**重要提示**：
- 每个节点的 content 应该包含文档中与该主题最相关的具体内容
- 关系应该反映主题之间的实质性关联，而不是简单的共现
- thinking 字段必须完整记录8步推理过程
- 必须且只能返回纯 JSON 格式，不要包含Markdown代码块或其他文字

JSON 结构示例：
{{
  "thinking": {{
    "step1_document_understanding": "文档讨论深度学习相关主题...",
    "step2_theme_identification": "基于固定类型（人物信息、背景故事、能力设定、装备礼装）识别出2个关键主题：主题1、主题2",
    "step3_node_type_determination": "主题1属于"人物信息"类型，主题2属于"能力设定"类型",
    "step4_content_extraction": "为每个主题提取相关内容...",
    "step5_relationship_type_summary": "总结关系类型：包含关系适用于当前文档",
    "step6_relationship_analysis": "深度学习包含神经网络，使用包含关系",
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
      "type": "HAS_ABILITY"
    }}
  ]
}}

文档内容：
{full_text}"""

    try:
        response = client.chat.completions.create(
            model=model_name,
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


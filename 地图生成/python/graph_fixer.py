import json
import re
from typing import Dict, Any
from openai import OpenAI


class GraphFixer:
    """知识图谱修正者 - 使用思维链模式修正图谱问题"""
    
    def __init__(self, client: OpenAI, model_name: str):
        self.client = client
        self.model_name = model_name
    
    def build_system_prompt(self):
        """构建系统提示词"""
        return """
你是一个专家级的知识图谱修正者，专门负责根据评价结果分析需要修正的内容。
你必须使用【思维链】模式进行严谨的逻辑推理，然后输出需要修改的部分（不输出完整图谱）。
"""
    
    def fix_graph(self, full_text: str, graph_data: Dict[str, Any], evaluation_result) -> Dict[str, Any]:
        """修正知识图谱
        
        Args:
            full_text: 完整文档内容
            graph_data: 当前图谱数据
            evaluation_result: 评价结果（可以是字符串或字典）
        """
        nodes = graph_data.get("nodes", [])
        relationships = graph_data.get("relationships", [])
        
        # 将 evaluation_result 转换为字符串格式
        if isinstance(evaluation_result, dict):
            if "raw_result" in evaluation_result:
                eval_result_str = evaluation_result["raw_result"]
            else:
                eval_result_str = json.dumps(evaluation_result, ensure_ascii=False, indent=2)
        else:
            eval_result_str = str(evaluation_result)
        
        user_content = f"""请根据评价结果分析需要修正的内容，输出需要修改的部分（不要输出完整图谱）。

你必须使用【思维链】模式进行严谨的逻辑推理，然后输出需要修改的内容清单。

==============================================================
                    【思维链推理框架 Chain of Thought】
==============================================================

推理时要按照思维链框架，一步一步分析，最后输出修正后的图谱：

【STEP 1: 问题理解 Problem Understanding】
理解评价结果中发现的问题：
- 仔细阅读评价结果，理解所有发现的问题
- 识别需要修正的问题类型：
  * 缺失的节点（missing_nodes）
  * 内容不完整的节点（incomplete_nodes）
  * 错误的关系（incorrect_relationships）
  * 缺失的关系（missing_relationships）
- 理解每个问题的具体内容和修正建议
- 评估问题的优先级和修正顺序

【STEP 2: 现有图谱分析 Current Graph Analysis】
分析当前图谱结构：
- 当前图谱包含哪些节点？每个节点的id、type、content是什么？
- 当前图谱包含哪些关系？每条关系的source、target、type是什么？
- 理解图谱的整体结构和逻辑
- 识别需要保留的正确部分

【STEP 3: 节点修正计划 Node Fix Plan】
规划节点修正方案：
- **增加缺失的节点**：
  * 根据评价结果中的missing_nodes，创建新的节点
  * 确保新节点的id、type、content完整且准确
  * 新节点的内容要基于文档中的相关信息
- **修正内容不完整的节点**：
  * 根据评价结果中的incomplete_nodes，补充缺失的内容
  * 将suggested_addition添加到对应节点的content中
  * 确保节点内容完整且准确
- **保留正确的节点**：
  * 对于没有问题的节点，保持原样
  * 确保不删除或修改正确的节点

【STEP 4: 关系修正计划 Relationship Fix Plan】
规划关系修正方案：
- **删除错误的关系**：
  * 根据评价结果中的incorrect_relationships，删除错误的关系
  * 如果suggestion为null，则删除该关系
  * 如果suggestion不为null，则用建议的关系替换
- **增加缺失的关系**：
  * 根据评价结果中的missing_relationships，创建新的关系
  * 确保新关系的source、target、type准确
  * 验证关系的source和target节点是否存在
- **修正错误的关系**：
  * 根据评价结果修正关系类型、方向等错误
  * 确保修正后的关系符合文档描述
- **保留正确的关系**：
  * 对于没有问题的关系，保持原样
  * 确保不删除或修改正确的关系

【STEP 5: 修改清单生成 Modification List Generation】
生成需要修改的内容清单：
- **需要增加的节点**：列出所有需要新增的节点（基于missing_nodes和颗粒度细化要求）
- **需要补充内容的节点**：列出需要补充内容的现有节点及其需要添加的内容
- **需要删除的关系**：列出需要删除的错误关系
- **需要修改的关系**：列出需要修改的关系（包括修改类型、方向等）
- **需要新增的关系**：列出需要新增的关系
- **确保新增节点的连接性**：必须保证新增的节点也有正确的关系连接
  * 对于每个新增的节点，检查它应该与哪些现有节点或新增节点建立关系
  * 根据文档内容，为新增节点创建必要的关系连接
  * 确保图谱是连接图，没有孤立的节点（除非文档中明确说明该节点是独立的）
  * 如果新增节点在文档中与其他节点有关联，必须在relationships_to_add中创建相应的关系
- 确保所有修改都基于文档内容和评价建议
- 验证修改清单的完整性和准确性

【STEP 6: 修改验证 Modification Verification】
验证修改清单：
- ✅ 是否包含了所有需要增加的节点？
- ✅ 是否包含了所有需要补充内容的节点？
- ✅ 是否包含了所有需要删除的关系？
- ✅ 是否包含了所有需要修改的关系？
- ✅ 是否包含了所有需要新增的关系？
- ✅ **新增节点是否都有正确的关系连接？**
  * 检查每个新增节点是否在relationships_to_add中有对应的关系
  * 验证新增节点与现有节点或新增节点之间的连接是否完整
  * 确保图谱是连接图，没有孤立的节点（除非文档中明确说明该节点是独立的）
  * 如果发现新增节点缺少连接，必须在relationships_to_add中补充
- ✅ 修改清单是否完整且准确？

==============================================================
                    【输出格式 - 严格JSON】
==============================================================

必须严格遵守 JSON 格式输出，包含 thinking（思维链推理过程）和需要修改的内容清单。

JSON 结构：
{{
  "thinking": {{
    "step1_problem_understanding": "【问题理解】理解评价结果中发现的问题...",
    "step2_current_graph_analysis": "【现有图谱分析】分析当前图谱结构...",
    "step3_node_fix_plan": "【节点修正计划】规划节点修正方案...",
    "step4_relationship_fix_plan": "【关系修正计划】规划关系修正方案...",
    "step5_modification_list": "【修改清单生成】生成需要修改的内容清单...",
    "step6_modification_verification": "【修改验证】验证修改清单..."
  }},
  "nodes_to_add": [
    {{
      "id": "新节点标识",
      "type": "节点类型（中文）",
      "content": "节点内容"
    }}
  ],
  "nodes_to_update": [
    {{
      "node_id": "现有节点的id",
      "content_to_add": "需要补充的内容（追加到现有content后面）"
    }}
  ],
  "relationships_to_delete": [
    {{
      "source": "源节点id",
      "target": "目标节点id",
      "type": "关系类型"
    }}
  ],
  "relationships_to_modify": [
    {{
      "old_relationship": {{
        "source": "原源节点id",
        "target": "原目标节点id",
        "type": "原关系类型"
      }},
      "new_relationship": {{
        "source": "新源节点id",
        "target": "新目标节点id",
        "type": "新关系类型"
      }},
      "modification_type": "修改类型（如：修改类型、修改方向、修改两端节点等）"
    }}
  ],
  "relationships_to_add": [
    {{
      "source": "源节点id",
      "target": "目标节点id",
      "type": "关系类型（中文）"
    }}
  ],
  "modification_summary": "修改总结：说明了需要进行哪些修改操作"
}}

**重要提示**：
- **只输出需要修改的部分，不要输出完整图谱**
- nodes_to_add: 需要新增的节点列表（如果评价结果中没有缺失节点，则为空数组）
- nodes_to_update: 需要补充内容的现有节点列表（如果评价结果中没有内容不完整的节点，则为空数组）
- relationships_to_delete: 需要删除的错误关系列表（如果评价结果中没有错误关系，则为空数组）
- relationships_to_modify: 需要修改的关系列表（如果评价结果中没有需要修改的关系，则为空数组）
- relationships_to_add: 需要新增的关系列表（如果评价结果中没有缺失关系，则为空数组）
- thinking 字段必须完整记录6步推理过程
- 必须且只能返回纯 JSON 格式，不要包含Markdown代码块或其他文字
- 所有节点必须有id、type、content三个字段
- 所有关系必须有source、target、type三个字段

原始文档内容：
{full_text}

当前知识图谱：
{json.dumps(graph_data, ensure_ascii=False, indent=2)}

评价结果：
{eval_result_str}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": self.build_system_prompt()},
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
                print("  ! 警告：修正者未能从模型返回中找到 JSON 对象。")
                return None

        except json.JSONDecodeError:
            print("  ! 错误：修正者返回的不是有效的 JSON。")
            return None
        except Exception as e:
            print(f"  ! 修正者 API 调用错误: {e}")
            return None


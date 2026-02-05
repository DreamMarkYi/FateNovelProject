import os
from typing import List, Dict, Any
from openai import OpenAI
from neo4j_handler import Neo4jHandler
from evaluator import GraphEvaluator
from graph_fixer import GraphFixer
from graph_extractor import extract_graph_from_document

# ===========================================

# ================= 配置区域 =================
# API 配置
API_KEY = "sk-D7OWUqvBcM500TgnC4UBixNKHiiguyppWdSw11xgVjKVDdFU"
BASE_URL = "https://hk-api.gptbest.vip/v1"

# Neo4j 数据库配置
NEO4J_URI = "bolt://127.0.0.1:7687"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "aa8455460"

# 模型配置
CHAT_MODEL_NAME = "gemini-3-flash-preview-thinking-*"

# 目标文件
SOURCE_FILE = "../static/白鸟遥角色设计.md"


# ===========================================


def apply_modifications(neo4j_handler: Neo4jHandler, modification_list: Dict[str, Any], 
                        target_database: str = "graph1"):
    """应用修改清单到数据库中的图谱（按顺序：添加节点 -> 补充节点内容 -> 创建新关系）
    
    Args:
        neo4j_handler: Neo4j处理器
        modification_list: 修改清单
        target_database: 目标数据库名称
    """
    session = neo4j_handler.driver.session(database=target_database)
    
    try:
        # 1. 添加新节点
        nodes_to_add = modification_list.get("nodes_to_add", [])
        if nodes_to_add:
            print(f"  > 步骤1：添加 {len(nodes_to_add)} 个新节点")
            neo4j_handler.add_graph_data(nodes_to_add, [], database=target_database)
        
        # 2. 补充现有节点的内容
        nodes_to_update = modification_list.get("nodes_to_update", [])
        if nodes_to_update:
            print(f"  > 步骤2：更新 {len(nodes_to_update)} 个节点的内容")
            for update in nodes_to_update:
                node_id = update.get("node_id")
                content_to_add = update.get("content_to_add", "")
                
                # 查找节点并更新content（处理content可能为null的情况）
                query = """
                MATCH (n {id: $node_id})
                SET n.content = COALESCE(n.content, '') + ' ' + $content_to_add
                """
                try:
                    session.run(query, node_id=node_id, content_to_add=content_to_add)
                except Exception as e:
                    print(f"    ! 警告：更新节点 {node_id} 内容失败: {e}")
        
        # 3. 删除错误的关系
        relationships_to_delete = modification_list.get("relationships_to_delete", [])
        if relationships_to_delete:
            print(f"  > 步骤3：删除 {len(relationships_to_delete)} 条错误关系")
            for rel_to_del in relationships_to_delete:
                source = rel_to_del.get("source")
                target = rel_to_del.get("target")
                rel_type = rel_to_del.get("type")
                
                # 删除关系
                query = """
                MATCH (source {id: $source})-[r]->(target {id: $target})
                WHERE type(r) = $rel_type
                DELETE r
                """
                try:
                    session.run(query, source=source, target=target, rel_type=rel_type)
                except Exception as e:
                    print(f"    ! 警告：删除关系失败: {e}")
        
        # 4. 修改关系
        relationships_to_modify = modification_list.get("relationships_to_modify", [])
        if relationships_to_modify:
            print(f"  > 步骤4：修改 {len(relationships_to_modify)} 条关系")
            for mod in relationships_to_modify:
                old_rel = mod.get("old_relationship", {})
                new_rel = mod.get("new_relationship", {})
                
                # 删除旧关系
                delete_query = """
                MATCH (source {id: $old_source})-[r]->(target {id: $old_target})
                WHERE type(r) = $old_type
                DELETE r
                """
                try:
                    session.run(delete_query, 
                              old_source=old_rel.get("source"),
                              old_target=old_rel.get("target"),
                              old_type=old_rel.get("type"))
                except Exception as e:
                    print(f"    ! 警告：删除旧关系失败: {e}")
                
                # 创建新关系（使用与add_graph_data相同的安全处理）
                new_rel_type = new_rel.get("type", "RELATED_TO")
                safe_type = "".join([c for c in new_rel_type if c.isalnum() or c == '_']).upper()
                if not safe_type: safe_type = "RELATED_TO"
                
                create_query = (
                    f"MATCH (source {{id: $new_source}}), (target {{id: $new_target}}) "
                    f"MERGE (source)-[r:`{safe_type}`]->(target)"
                )
                try:
                    session.run(create_query,
                              new_source=new_rel.get("source"),
                              new_target=new_rel.get("target"))
                except Exception as e:
                    print(f"    ! 警告：创建新关系失败: {e}")
        
        # 5. 创建新关系（最后一步）
        relationships_to_add = modification_list.get("relationships_to_add", [])
        if relationships_to_add:
            print(f"  > 步骤5：创建 {len(relationships_to_add)} 条新关系")
            neo4j_handler.add_graph_data([], relationships_to_add, database=target_database)
    finally:
        session.close()


def load_file(filepath):
    """文件读取"""
    if not os.path.exists(filepath):
        print(f"文件不存在: {filepath}")
        return ""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()




def main():
    # 1. 初始化 Neo4j
    print(f"正在连接 Neo4j: {NEO4J_URI}...")
    neo4j_handler = None
    try:
        neo4j_handler = Neo4jHandler(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD)
        with neo4j_handler.driver.session() as session:
            session.run("RETURN 1")
        print("Neo4j 连接成功。")
    except Exception as e:
        print(f"Neo4j 连接失败: {e}")
        return

    # 2. 初始化 OpenAI 客户端
    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

    # 3. 加载完整文档
    print("正在加载文档...")
    full_text = load_file(SOURCE_FILE)
    if not full_text:
        with open(SOURCE_FILE, "w", encoding="utf-8") as f:
            f.write("# 示例\nGeoffrey Hinton 是深度学习之父，他在 Google 工作。")
        full_text = load_file(SOURCE_FILE)
    
    print(f"文档长度: {len(full_text)} 字符")

    # 4. 从整篇文档提取主题图谱
    print("\n正在分析文档并提取主题图谱...")
    graph_data = extract_graph_from_document(client, full_text, CHAT_MODEL_NAME)

    if graph_data:
        nodes = graph_data.get("nodes", [])
        relationships = graph_data.get("relationships", [])
        print(f"\n提取结果：")
        print(f"  > 识别到 {len(nodes)} 个主题节点")
        print(f"  > 识别到 {len(relationships)} 条主题关系")
        
        # 显示节点预览
        print(f"\n主题节点预览：")
        for i, node in enumerate(nodes[:5], 1):  # 只显示前5个
            content_preview = node.get("content", "")[:50] + "..." if len(node.get("content", "")) > 50 else node.get("content", "")
            print(f"  {i}. {node.get('id', 'Unknown')}: {content_preview}")
        if len(nodes) > 5:
            print(f"  ... 还有 {len(nodes) - 5} 个节点")

        # 4.5. 存入初始图谱到 Neo4j（默认数据库）
        print(f"\n正在将初始图谱写入 Neo4j 默认数据库...")
        neo4j_handler.add_graph_data(nodes, relationships, database=None)

        # 5. 循环修正流程（最多5次，graph1-graph5）
        evaluator = GraphEvaluator(client, CHAT_MODEL_NAME)
        fixer = GraphFixer(client, CHAT_MODEL_NAME)
        
        # 初始图谱从默认数据库开始
        current_source_db = None
        max_iterations = 5
        
        for iteration in range(1, max_iterations + 1):
            target_db = f"graph{iteration}"
            print(f"\n{'='*60}")
            print(f"第 {iteration} 轮修正流程 (目标数据库: {target_db})")
            print(f"{'='*60}")
            
            # 5.1. 先将当前图谱拷贝到目标数据库
            print(f"\n[步骤1] 正在将图谱拷贝到 {target_db} 数据库...")
            if current_source_db is None:
                neo4j_handler.copy_graph_to_database(source_database=None, target_database=target_db)
            else:
                neo4j_handler.copy_graph_to_database(source_database=current_source_db, target_database=target_db)
            
            # 5.2. 从目标数据库读取图谱用于评价
            print(f"\n[步骤2] 正在从 {target_db} 数据库读取图谱...")
            graph_data_from_target = neo4j_handler.get_graph_data(database=target_db)
            print(f"  > 读取到 {len(graph_data_from_target.get('nodes', []))} 个节点, {len(graph_data_from_target.get('relationships', []))} 条关系")
            
            # 5.3. 评价图谱质量
            print(f"\n[步骤3] 正在评价图谱质量...")
            evaluation_result = evaluator.evaluate_graph(full_text, graph_data_from_target)
            
            if not evaluation_result:
                print(f"  ! 评价失败，终止循环")
                break
            
            # 检查是否有问题
            has_issues = evaluation_result.get("has_issues", True)
            
            print(f"\n评价结果：")
            if "raw_result" in evaluation_result:
                print(evaluation_result["raw_result"])
            else:
                print(f"  > has_issues: {has_issues}")
                if has_issues:
                    issues = evaluation_result.get("issues", {})
                    missing_nodes = len(issues.get("missing_nodes", []))
                    incomplete_nodes = len(issues.get("incomplete_nodes", []))
                    incorrect_rels = len(issues.get("incorrect_relationships", []))
                    missing_rels = len(issues.get("missing_relationships", []))
                    print(f"  > 发现问题：缺失节点 {missing_nodes} 个，不完整节点 {incomplete_nodes} 个，错误关系 {incorrect_rels} 条，缺失关系 {missing_rels} 条")
                else:
                    print(f"  > 未发现问题，图谱质量良好")
            
            # 如果没有问题，结束循环
            if not has_issues:
                print(f"\n✓ 图谱质量已达标，结束修正流程")
                break
            
            # 5.4. 修正图谱（生成修改清单）
            print(f"\n[步骤4] 正在分析需要修改的内容...")
            modification_list = fixer.fix_graph(full_text, graph_data_from_target, evaluation_result)
            
            if not modification_list:
                print(f"  ! 修改分析失败，终止循环")
                break
            
            # 5.5. 应用修改到目标数据库
            print(f"\n[步骤5] 正在应用修改到 {target_db} 数据库...")
            apply_modifications(neo4j_handler, modification_list, target_database=target_db)
            
            modification_summary = modification_list.get("modification_summary", "")
            if modification_summary:
                print(f"  > 修改总结: {modification_summary}")
            
            # 更新源数据库为当前目标数据库，用于下一轮
            current_source_db = target_db
            
            # 读取修改后的图谱统计
            updated_graph_data = neo4j_handler.get_graph_data(database=target_db)
            updated_nodes = updated_graph_data.get("nodes", [])
            updated_relationships = updated_graph_data.get("relationships", [])
            print(f"\n  > {target_db} 数据库更新后：{len(updated_nodes)} 个节点, {len(updated_relationships)} 条关系")
        
        # 6. 显示最终结果
        print(f"\n{'='*60}")
        print(f"修正流程完成")
        print(f"{'='*60}")
        
        # 读取最终图谱（最后一轮使用的数据库）
        if current_source_db:
            final_graph_data = neo4j_handler.get_graph_data(database=current_source_db)
            final_nodes = final_graph_data.get("nodes", [])
            final_relationships = final_graph_data.get("relationships", [])
            
            print(f"\n最终图谱统计（数据库: {current_source_db}）：")
            print(f"  > 最终节点数: {len(final_nodes)} (原: {len(nodes)})")
            print(f"  > 最终关系数: {len(final_relationships)} (原: {len(relationships)})")
        else:
            print(f"\n  ! 未完成任何修正，使用原始图谱")
    else:
        print("  ! 未提取到有效数据。")

    # 5. 收尾
    neo4j_handler.close()
    print("\n任务完成！请在 Neo4j Browser 中运行 'MATCH (n) RETURN n LIMIT 25' 查看结果。")


if __name__ == "__main__":
    main()
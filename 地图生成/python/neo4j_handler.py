from typing import List, Dict, Any
from neo4j import GraphDatabase


class Neo4jHandler:
    """处理 Neo4j 连接和写入"""

    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()
    
    def get_graph_data(self, database: str = None) -> Dict[str, Any]:
        """从 Neo4j 数据库读取完整的图谱数据
        
        Args:
            database: 数据库名称，None表示使用默认数据库
            
        Returns:
            包含nodes和relationships的字典
        """
        if database:
            session = self.driver.session(database=database)
        else:
            session = self.driver.session()
        
        try:
            # 读取所有节点
            node_query = "MATCH (n) RETURN n.id AS id, labels(n) AS labels, properties(n) AS properties"
            node_result = session.run(node_query)
            nodes = []
            for record in node_result:
                labels = record["labels"]
                node_type = labels[0] if labels else "Entity"
                properties = record["properties"] or {}
                # 构建节点对象，包含所有属性
                node = {
                    "id": record["id"],
                    "type": node_type
                }
                # 添加所有属性（id已经在上面，不需要重复）
                for key, value in properties.items():
                    if key != "id":  # id已经作为顶层字段
                        node[key] = value
                nodes.append(node)
            
            # 读取所有关系
            rel_query = """
            MATCH (source)-[r]->(target)
            RETURN source.id AS source, target.id AS target, type(r) AS type
            """
            rel_result = session.run(rel_query)
            relationships = []
            for record in rel_result:
                relationships.append({
                    "source": record["source"],
                    "target": record["target"],
                    "type": record["type"]
                })
            
            return {"nodes": nodes, "relationships": relationships}
        finally:
            session.close()
    
    def copy_graph_to_database(self, source_database: str = None, target_database: str = "graph1"):
        """将源数据库的图谱拷贝到目标数据库
        
        Args:
            source_database: 源数据库名称，None表示默认数据库
            target_database: 目标数据库名称
        """
        print(f"\n正在从 {source_database or '默认数据库'} 拷贝图谱到 {target_database}...")
        
        # 从源数据库读取图谱
        source_graph = self.get_graph_data(database=source_database)
        source_nodes = source_graph.get("nodes", [])
        source_relationships = source_graph.get("relationships", [])
        
        print(f"  > 读取到 {len(source_nodes)} 个节点, {len(source_relationships)} 条关系")
        
        # 写入目标数据库
        self.add_graph_data(source_nodes, source_relationships, database=target_database)
        print(f"  > 拷贝完成")

    def add_graph_data(self, nodes: List[Dict], relationships: List[Dict], database: str = None):
        """将提取的数据写入 Neo4j
        
        Args:
            nodes: 节点列表
            relationships: 关系列表
            database: 数据库名称，None表示使用默认数据库，指定名称则使用该数据库
        """
        if not nodes and not relationships:
            return

        # 根据database参数创建session
        if database:
            session = self.driver.session(database=database)
        else:
            session = self.driver.session()
        
        try:
            # 1. 写入节点 (按 Label 分组以优化 Cypher)
            nodes_by_label = {}
            for node in nodes:
                label = node.get("type", "Entity")
                safe_label = "".join([c for c in label if c.isalnum()])
                if not safe_label: safe_label = "Entity"

                if safe_label not in nodes_by_label:
                    nodes_by_label[safe_label] = []
                nodes_by_label[safe_label].append(node)

            for label, entity_list in nodes_by_label.items():
                # 转换节点数据格式：提取 id，其余字段作为 properties
                batch_data = []
                for node in entity_list:
                    node_id = node.get("id")
                    # 创建 properties，排除 id 和 type（type 已作为 label）
                    properties = {k: v for k, v in node.items() if k not in ["id", "type"]}
                    batch_data.append({"id": node_id, "properties": properties if properties else {}})
                
                query = (
                    f"UNWIND $batch AS row "
                    f"MERGE (n:`{label}` {{id: row.id}}) "
                    f"SET n += row.properties"
                )
                try:
                    session.run(query, batch=batch_data)
                    db_name = database if database else "默认数据库"
                    print(f"  - 已合并 {len(batch_data)} 个 '{label}' 节点 (数据库: {db_name})")
                except Exception as e:
                    print(f"  ! 写入节点出错 ({label}): {e}")

            # 2. 写入关系 (按 Type 分组)
            rels_by_type = {}
            for rel in relationships:
                r_type = rel.get("type", "RELATED_TO")
                safe_type = "".join([c for c in r_type if c.isalnum() or c == '_']).upper()
                if not safe_type: safe_type = "RELATED_TO"

                if safe_type not in rels_by_type:
                    rels_by_type[safe_type] = []
                rels_by_type[safe_type].append(rel)

            for r_type, rel_list in rels_by_type.items():
                query = (
                    f"UNWIND $batch AS row "
                    f"MATCH (source {{id: row.source}}) "
                    f"MATCH (target {{id: row.target}}) "
                    f"MERGE (source)-[r:`{r_type}`]->(target) "
                )
                try:
                    session.run(query, batch=rel_list)
                    db_name = database if database else "默认数据库"
                    print(f"  - 已合并 {len(rel_list)} 条 '{r_type}' 关系 (数据库: {db_name})")
                except Exception as e:
                    print(f"  ! 写入关系出错 ({r_type}): {e}")
        finally:
            session.close()



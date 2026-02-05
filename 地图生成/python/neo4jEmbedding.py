import os
from neo4j import GraphDatabase
from openai import OpenAI

# ================= 配置区域 =================

# OpenAI / GPTBest 配置
API_KEY = "sk-D7OWUqvBcM500TgnC4UBixNKHiiguyppWdSw11xgVjKVDdFU"
BASE_URL = "https://hk-api.gptbest.vip/v1"
EMBEDDING_MODEL = "text-embedding-3-large"

# Neo4j 数据库配置
NEO4J_URI = "bolt://localhost:7687"  # 请根据实际情况修改
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "aa8455460"  # 请在此处填写你的密码

# *** 指定目标数据库 ***
NEO4J_DATABASE = "chunk1"

# 批处理大小
BATCH_SIZE = 50

# ===========================================

# 初始化 OpenAI 客户端
client = OpenAI(
    api_key=API_KEY,
    base_url=BASE_URL
)


def get_embeddings(texts):
    """
    调用 OpenAI API 获取向量
    """
    try:
        # 移除换行符以获得更好的向量效果
        clean_texts = [str(text).replace("\n", " ") for text in texts]

        response = client.embeddings.create(
            input=clean_texts,
            model=EMBEDDING_MODEL
        )
        return [data.embedding for data in response.data]
    except Exception as e:
        print(f"Error getting embeddings: {e}")
        return []


def process_nodes(driver):
    """
    读取节点的可向量化属性（content 或 context），向量化并写入 embedding。
    与 knowledgeGraph 一致：节点使用 content，若无则退化为 context。
    """
    print(f"--- 开始处理节点 (数据库: {NEO4J_DATABASE}) ---")

    # 查询有内容且尚未有 embedding 的节点，优先用 content，否则用 context
    # 使用 NOT 'embedding' IN keys(n) 避免引用未存在属性时的 schema 警告
    query_read = """
    MATCH (n)
    WHERE (n.content IS NOT NULL OR n.context IS NOT NULL)
    AND (NOT 'embedding' IN keys(n))
    RETURN elementId(n) AS id, COALESCE(n.content, n.context) AS text
    LIMIT $limit
    """

    # 先为尚无 embedding 的节点创建空列表占位，避免 schema 中无此属性导致的警告
    query_create_if_missing = """
    UNWIND $batch AS row
    MATCH (n)
    WHERE elementId(n) = row.id AND (NOT 'embedding' IN keys(n))
    SET n.embedding = []
    """
    query_write = """
    UNWIND $batch AS row
    MATCH (n)
    WHERE elementId(n) = row.id
    SET n.embedding = row.vector
    """

    total_processed = 0

    # *** 关键修改：在这里指定 database="chunk1" ***
    with driver.session(database=NEO4J_DATABASE) as session:
        while True:
            # 1. 读取数据
            result = session.run(query_read, limit=BATCH_SIZE)
            records = list(result)

            if not records:
                break

            batch_data = []
            texts_to_embed = []
            ids = []

            for record in records:
                ids.append(record["id"])
                texts_to_embed.append(record["text"])

            # 2. 调用 API
            print(f"正在向量化 {len(texts_to_embed)} 个节点...")
            vectors = get_embeddings(texts_to_embed)

            if not vectors:
                print("向量化失败，跳过当前批次")
                continue

            # 3. 组装数据
            for i, vector in enumerate(vectors):
                batch_data.append({
                    "id": ids[i],
                    "vector": vector
                })

            # 4. 先创建 embedding 属性（若不存在），再写入向量
            session.run(query_create_if_missing, batch=batch_data)
            session.run(query_write, batch=batch_data)
            total_processed += len(batch_data)
            print(f"已保存 {len(batch_data)} 个节点的向量。总计: {total_processed}")


def process_relationships(driver):
    """
    读取边 context，向量化并存回
    """
    print(f"\n--- 开始处理关系 (数据库: {NEO4J_DATABASE}) ---")

    # 使用 NOT 'embedding' IN keys(r) 避免引用未存在属性时的 schema 警告
    query_read = """
    MATCH ()-[r]->()
    WHERE r.context IS NOT NULL 
    AND (NOT 'embedding' IN keys(r))
    RETURN elementId(r) AS id, r.context AS text
    LIMIT $limit
    """

    # 先为尚无 embedding 的关系创建空列表占位
    query_create_if_missing = """
    UNWIND $batch AS row
    MATCH ()-[r]->()
    WHERE elementId(r) = row.id AND (NOT 'embedding' IN keys(r))
    SET r.embedding = []
    """
    query_write = """
    UNWIND $batch AS row
    MATCH ()-[r]->()
    WHERE elementId(r) = row.id
    SET r.embedding = row.vector
    """

    total_processed = 0

    # *** 关键修改：在这里指定 database="chunk1" ***
    with driver.session(database=NEO4J_DATABASE) as session:
        while True:
            # 1. 读取数据
            result = session.run(query_read, limit=BATCH_SIZE)
            records = list(result)

            if not records:
                break

            batch_data = []
            texts_to_embed = []
            ids = []

            for record in records:
                ids.append(record["id"])
                texts_to_embed.append(record["text"])

            # 2. 调用 API
            print(f"正在向量化 {len(texts_to_embed)} 条边...")
            vectors = get_embeddings(texts_to_embed)

            if not vectors:
                print("向量化失败，跳过当前批次")
                continue

            # 3. 组装数据
            for i, vector in enumerate(vectors):
                batch_data.append({
                    "id": ids[i],
                    "vector": vector
                })

            # 4. 先创建 embedding 属性（若不存在），再写入向量
            session.run(query_create_if_missing, batch=batch_data)
            session.run(query_write, batch=batch_data)
            total_processed += len(batch_data)
            print(f"已保存 {len(batch_data)} 条边的向量。总计: {total_processed}")


def main():
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    try:
        driver.verify_connectivity()
        print(f"连接成功！目标数据库: {NEO4J_DATABASE}")

        process_nodes(driver)
        process_relationships(driver)

        print("\n所有任务完成！")

    except Exception as e:
        print(f"发生错误: {e}")
        print("提示：请检查 'chunk1' 数据库是否已创建并处于 Online 状态。")
    finally:
        driver.close()


if __name__ == "__main__":
    main()
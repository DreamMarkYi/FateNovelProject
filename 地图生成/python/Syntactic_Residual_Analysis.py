import os
import csv
import spacy
import numpy as np
from neo4j import GraphDatabase
from typing import Set, List, Dict
from langchain_openai import OpenAIEmbeddings
# 引入 faiss 库替代 sklearn 进行加速
import faiss

# ================= 配置区域 =================
# API 配置
API_KEY = "sk-D7OWUqvBcM500TgnC4UBixNKHiiguyppWdSw11xgVjKVDdFU"
BASE_URL = "https://hk-api.gptbest.vip/v1"
EMBEDDING_MODEL = "text-embedding-3-large"

# 语义匹配阈值 (0-1)
# 句子/事实级别的匹配通常比词汇匹配要求更宽松一点，因为句式可能多变
# 但为了保证事实准确性，建议保持在 0.75 - 0.85 之间
SIMILARITY_THRESHOLD = 0.7

# Neo4j 配置
NEO4J_URI = "bolt://127.0.0.1:7687"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "aa8455460"
NEO4J_DATABASE = "graph4"  # 数据库名称
NEO4J_GRAPH_ID = "graph4"  # 具体的图ID或表名

# 本地原始文件路径
SOURCE_FILE = "../static/白鸟遥角色设计.md"


# ===========================================

class Neo4jResidualAnalyzer:
    def __init__(self, uri, user, password, database, graph_id=None):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.database = database
        self.graph_id = graph_id

        print("正在加载 NLP 模型 (zh_core_web_sm)...")
        try:
            self.nlp = spacy.load("zh_core_web_sm")
        except OSError:
            print("❌ 错误: 未找到模型。请运行: python -m spacy download zh_core_web_sm")
            exit(1)

        print("正在初始化 Embedding 模型...")
        self.embeddings = OpenAIEmbeddings(
            model=EMBEDDING_MODEL,
            openai_api_key=API_KEY,
            openai_api_base=BASE_URL,
            check_embedding_ctx_length=False
        )

    def close(self):
        self.driver.close()

    def fetch_graph_triples_as_text(self, filename: str) -> List[str]:
        """
        【关键修改】从 Neo4j 中获取所有三元组，并序列化为文本事实 (Fact Strings)
        格式示例: "Geoffrey Hinton WORKS_AT Google"
        """
        serialized_facts = set()

        # 针对 graph4 数据库的特殊处理逻辑
        if self.database == "graph4":
            print(f"检测到数据库为 {self.database}，执行三元组查询...")
            query = """
            MATCH (n)-[r]->(m)
            RETURN n.id, type(r), m.id
            """
            query_params = {}
        else:
            print(f"检测到通用数据库，执行带 source 过滤的三元组查询...")
            # 注意：这里假设 n.source 足够过滤，或者你可以加上 r.source
            where_conditions = ["n.source = $filename"]
            query_params = {"filename": filename}

            if self.graph_id:
                where_conditions.append("n.graph = $graph")
                query_params["graph"] = self.graph_id

            query = f"""
            MATCH (n)-[r]->(m) WHERE {' AND '.join(where_conditions)}
            RETURN n.id, type(r), m.id
            """

        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(query, **query_params)
                count = 0
                for record in result:
                    # 将三元组拼接成自然语言风格的字符串
                    # 格式: 主语 关系 宾语
                    fact_str = f"{record['n.id']} {record['type(r)']} {record['m.id']}"
                    serialized_facts.add(fact_str)
                    count += 1

                print(f"  -> 从图谱中加载并序列化了 {len(serialized_facts)} 条独立事实 (Triples)。")

        except Exception as e:
            print(f"❌ Neo4j 查询出错: {e}")

        return list(serialized_facts)

    def extract_sentences(self, text: str) -> List[str]:
        """提取原文中的句子作为比对单元"""
        doc = self.nlp(text)
        # 过滤掉过短的句子（如标题或换行符）
        sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 5]
        return sentences

    def compute_similarity_batch(self, source_texts: List[str], target_texts: List[str]) -> Dict[str, float]:
        """
        批量计算 source_texts (句子) 与 target_texts (图谱事实) 的最大相似度
        """
        if not source_texts or not target_texts:
            return {t: 0.0 for t in source_texts}

        print(f"  -> 正在计算向量: 原文句子 {len(source_texts)} 条, 图谱事实 {len(target_texts)} 条...")

        try:
            src_embs = self.embeddings.embed_documents(source_texts)
            tgt_embs = self.embeddings.embed_documents(target_texts)
        except Exception as e:
            print(f"❌ 向量化 API 调用失败: {e}")
            return {t: 0.0 for t in source_texts}

        # 转 Numpy
        src_np = np.array(src_embs).astype('float32')
        tgt_np = np.array(tgt_embs).astype('float32')

        # L2 归一化
        faiss.normalize_L2(src_np)
        faiss.normalize_L2(tgt_np)

        # 构建索引 (IndexFlatIP 计算内积，归一化后即为余弦相似度)
        d = tgt_np.shape[1]
        index = faiss.IndexFlatIP(d)
        index.add(tgt_np)

        # 搜索每个句子最相似的1个事实
        D, I = index.search(src_np, 1)
        max_scores = D.flatten()

        # 获取每个句子匹配到的最佳事实文本 (用于调试)
        best_matches = [target_texts[i] for i in I.flatten()]

        # 返回 {句子: (分数, 匹配到的事实)}
        result = {}
        for i, sent in enumerate(source_texts):
            result[sent] = (max_scores[i], best_matches[i])

        return result

    def calculate(self, filepath: str):
        filename = os.path.basename(filepath)
        print(f"\n--- 开始【句子-事实】级语义残差分析 ---")
        print(f"目标文件: {filename}")

        if not os.path.exists(filepath):
            print(f"❌ 错误: 找不到本地文件 {filepath}")
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            text_content = f.read()

        # 1. 提取原文句子 (分母)
        sentences = self.extract_sentences(text_content)
        print(f"原文提取到 {len(sentences)} 个有效句子。")

        if not sentences:
            print("原文没有提取到有效句子。")
            return

        # 2. 获取图谱事实 (分子)
        graph_facts = self.fetch_graph_triples_as_text(filename)

        if not graph_facts:
            print("❌ 图谱为空或未提取到三元组，残差率 100%。")
            return

        # 3. 语义匹配计算
        similarity_result = self.compute_similarity_batch(sentences, graph_facts)

        # 4. 统计分析
        covered_count = 0
        uncovered_sentences = []

        print("\n📊 === 事实覆盖详情 ===")
        print(f"{'相似度':<8} | {'状态':<6} | {'原文句子 (截取)':<40} | {'匹配到的图谱事实 (截取)'}")
        print("-" * 100)

        for sent, (score, match_fact) in similarity_result.items():
            is_covered = score > SIMILARITY_THRESHOLD
            status = "✅" if is_covered else "❌"

            if is_covered:
                covered_count += 1
            else:
                uncovered_sentences.append((sent, score, match_fact))

            # 打印部分日志
            print(f"{score:.4f}   | {status}     | {sent[:40]:<40} | {match_fact[:30]}...")

        coverage_ratio = covered_count / len(sentences)
        residual_ratio = 1.0 - coverage_ratio

        print("\n📈 === 最终分析报告 ===")
        print(f"模型: {EMBEDDING_MODEL} | 阈值: {SIMILARITY_THRESHOLD}")
        print(f"---------------------------")
        print(f"原文句子总数: {len(sentences)}")
        print(f"已覆盖句子数: {covered_count}")
        print(f"未覆盖句子数: {len(uncovered_sentences)}")
        print(f"---------------------------")
        print(f"事实覆盖率 (Fact Coverage): {coverage_ratio:.2%}")
        print(f"信息残差率 (Info Residual): {residual_ratio:.2%}")
        print(f"---------------------------")

        if uncovered_sentences:
            print(f"\n🔍 重点遗漏内容示例 (Top 3):")
            # 按相似度从低到高排序，展示最不相关的（最彻底遗漏的）
            uncovered_sentences.sort(key=lambda x: x[1])
            for item in uncovered_sentences[:3]:
                print(f"  - [sim={item[1]:.2f}] {item[0]}")
                print(f"    (最接近的事实仅为: {item[2]})")

        # 结论判定
        if residual_ratio < 0.2:
            print("\n✅ 结论: 图谱已覆盖文档中的绝大多数事实。")
        else:
            print("\n⚠️ 结论: 存在较高信息残差。这表示文档中有许多完整句子所描述的事实，在图谱中找不到对应的三元组。")

        # 5. 导出 CSV 文件
        csv_filename = os.path.splitext(filepath)[0] + "_residual_analysis.csv"
        csv_path = os.path.join(os.path.dirname(filepath), os.path.basename(csv_filename))
        
        try:
            with open(csv_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                writer = csv.writer(csvfile)
                # 写入表头
                writer.writerow(['数据库语句', '原文句子', '相似度', '状态'])
                
                # 写入数据行
                for sent, (score, match_fact) in similarity_result.items():
                    is_covered = score > SIMILARITY_THRESHOLD
                    status = "已覆盖" if is_covered else "未覆盖"
                    writer.writerow([match_fact, sent, f"{score:.4f}", status])
            
            print(f"\n💾 CSV 文件已保存: {csv_path}")
        except Exception as e:
            print(f"\n❌ 保存 CSV 文件时出错: {e}")


def main():
    if not os.path.exists(SOURCE_FILE):
        print(f"请确保文件存在: {SOURCE_FILE}")
        with open(SOURCE_FILE, "w", encoding="utf-8") as f:
            f.write("# 白鸟遥\n白鸟遥是一名优秀的学生。她喜欢阅读古籍。她加入了文学社。")

    analyzer = Neo4jResidualAnalyzer(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE, NEO4J_GRAPH_ID)
    try:
        analyzer.calculate(SOURCE_FILE)
    finally:
        analyzer.close()


if __name__ == "__main__":
    main()
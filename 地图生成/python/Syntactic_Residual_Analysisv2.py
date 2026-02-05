import os
import spacy
import numpy as np
from neo4j import GraphDatabase
from typing import Set, List, Dict, Tuple
from sentence_transformers import SentenceTransformer, util
import torch

# ================= 配置区域 =================
# 模型配置
# 1. Bi-Encoder: 用于段落和子图文本的向量化
BI_ENCODER_MODEL_NAME = "BAAI/bge-base-zh-v1.5"

# 2. 语义匹配阈值 (0-1)
# 段落级的匹配，由于包含噪音，阈值不宜过高。0.65 表示主要语义重合。
SIMILARITY_THRESHOLD = 0.65

# Neo4j 配置
NEO4J_URI = "bolt://127.0.0.1:7687"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "aa8455460"
NEO4J_DATABASE = "graph4"
NEO4J_GRAPH_ID = "graph4"

# 本地原始文件路径
SOURCE_FILE = "../static/白鸟遥角色设计.md"


# ===========================================

class ParagraphResidualAnalyzer:
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

        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"运行设备: {self.device}")

        print(f"正在加载 Embedding 模型 ({BI_ENCODER_MODEL_NAME})...")
        try:
            self.model = SentenceTransformer(BI_ENCODER_MODEL_NAME, device=self.device)
        except Exception as e:
            print(f"❌ 模型加载失败: {e}")
            exit(1)

    def close(self):
        self.driver.close()

    def split_into_paragraphs(self, text: str) -> List[str]:
        """
        将文本切分为段落。
        策略：按双换行符切分，且过滤掉过短的段落。
        """
        # 初步切分
        raw_paras = text.split('\n\n')
        paragraphs = []
        for p in raw_paras:
            clean_p = p.strip()
            # 过滤掉标题（通常很短且没有句号）或空行
            # 这里简单判断长度 > 10
            if len(clean_p) > 10:
                paragraphs.append(clean_p)
        return paragraphs

    def extract_entities_from_text(self, text: str) -> List[str]:
        """
        从段落中提取关键实体 (名词/专有名词)
        用于去图谱中捞取相关子图
        """
        doc = self.nlp(text)
        entities = set()
        for token in doc:
            # 保留专有名词 (PROPN) 和 名词 (NOUN)
            if token.pos_ in ["PROPN", "NOUN"] and len(token.text) > 1:
                entities.add(token.text)
        return list(entities)

    def fetch_subgraph_context(self, entities: List[str], filename: str) -> str:
        """
        【核心逻辑】
        根据段落中的实体，去 Neo4j 查询它们参与的所有三元组。
        将查询结果拼接成一段文本。
        """
        if not entities:
            return ""

        # 构造 Cypher 查询：查找涉及这些实体的关系
        # 我们查找 1-hop 关系： 实体 -> 关系 -> 邻居
        query = f"""
        MATCH (n)-[r]->(m)
        WHERE (n.id IN $entities OR m.id IN $entities)
        """

        # 添加 source 过滤 (如果数据库支持)
        if self.database != "graph4":
            query += " AND n.source = $filename "

        query += " RETURN n.id, type(r), m.id LIMIT 50"

        facts = set()
        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(query, entities=entities, filename=filename)
                for record in result:
                    # 序列化为自然语言风格: "Subject Predicate Object"
                    fact = f"{record['n.id']} {record['type(r)']} {record['m.id']}"
                    facts.add(fact)
        except Exception as e:
            print(f"Neo4j 查询警告: {e}")
            return ""

        # 将所有事实拼接成一个长字符串，作为该段落的"图谱投影"
        return "。 ".join(facts)

    def calculate(self, filepath: str):
        filename = os.path.basename(filepath)
        print(f"\n--- 开始段落级语义覆盖分析 ---")
        print(f"目标文件: {filename}")

        if not os.path.exists(filepath):
            print("文件不存在")
            return
        with open(filepath, 'r', encoding='utf-8') as f:
            text_content = f.read()

        # 1. 切分段落
        paragraphs = self.split_into_paragraphs(text_content)
        print(f"原文共切分为 {len(paragraphs)} 个语义段落。")

        if not paragraphs:
            return

        covered_count = 0
        results = []

        print("\n正在分析每个段落的图谱覆盖情况...")

        for i, para in enumerate(paragraphs):
            # A. 提取段落实体
            para_entities = self.extract_entities_from_text(para)

            # B. 获取图谱上下文 (Subgraph Context)
            # 这是一个由三元组组成的字符串，代表图谱对该段落的认知
            graph_context_text = self.fetch_subgraph_context(para_entities, filename)

            # 如果图谱里根本没有这些实体，直接相似度为 0
            if not graph_context_text:
                score = 0.0
                status = "❌"
                match_content = "(无相关子图)"
            else:
                # C. 计算语义相似度 (段落 vs 图谱上下文)
                emb1 = self.model.encode(para, convert_to_tensor=True)
                emb2 = self.model.encode(graph_context_text, convert_to_tensor=True)
                score = util.cos_sim(emb1, emb2).item()

                status = "✅" if score > SIMILARITY_THRESHOLD else "❌"
                match_content = graph_context_text

            if score > SIMILARITY_THRESHOLD:
                covered_count += 1

            results.append({
                "paragraph": para,
                "score": score,
                "status": status,
                "graph_data": match_content
            })

            # 实时打印简报
            print(f"段落 {i + 1}: [{status}] Sim: {score:.4f} | 原文: {para[:20]}...")

        # 2. 统计报告
        coverage_rate = covered_count / len(paragraphs)
        residual_rate = 1.0 - coverage_rate

        print("\n" + "=" * 60)
        print(f"📊 最终段落级残差报告")
        print(f"模型: {BI_ENCODER_MODEL_NAME} | 阈值: {SIMILARITY_THRESHOLD}")
        print("-" * 30)
        print(f"段落总数: {len(paragraphs)}")
        print(f"已覆盖段落: {covered_count}")
        print(f"覆盖率 (Coverage): {coverage_rate:.2%}")
        print(f"残差率 (Residual): {residual_rate:.2%}")
        print("=" * 60)

        # 3. 展示未覆盖的段落 (帮助定位缺失信息)
        print("\n🔍 重点遗漏段落分析 (Top 3 最低分):")
        # 按分数升序排列
        sorted_results = sorted(results, key=lambda x: x['score'])

        for res in sorted_results[:3]:
            # 只展示未达标的
            if res['score'] < SIMILARITY_THRESHOLD:
                print(f"\n❌ [Sim={res['score']:.2f}] 原文段落:")
                print(f"   \"{res['paragraph']}\"")
                print(f"   ℹ️ 检索到的图谱信息: {res['graph_data'][:100]}...")
                print(f"   👉 建议: 该段落包含的信息似乎未被转化为关系，建议针对此段落重新提取。")


def main():
    if not os.path.exists(SOURCE_FILE):
        with open(SOURCE_FILE, "w", encoding="utf-8") as f:
            f.write("# 白鸟遥\n\n白鸟遥是一名优秀的学生。她喜欢阅读古籍。\n\n她加入了文学社，并在那里结识了很多朋友。")

    analyzer = ParagraphResidualAnalyzer(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE, NEO4J_GRAPH_ID)
    try:
        analyzer.calculate(SOURCE_FILE)
    finally:
        analyzer.close()


if __name__ == "__main__":
    main()
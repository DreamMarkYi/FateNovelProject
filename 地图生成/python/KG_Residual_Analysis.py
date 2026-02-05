import os
import spacy
import numpy as np
from neo4j import GraphDatabase
from typing import Set, List, Dict
from langchain_openai import OpenAIEmbeddings
# 引入 faiss 库替代 sklearn
import faiss

# ================= 配置区域 =================
# API 配置
API_KEY = "sk-D7OWUqvBcM500TgnC4UBixNKHiiguyppWdSw11xgVjKVDdFU"
BASE_URL = "https://hk-api.gptbest.vip/v1"
EMBEDDING_MODEL = "text-embedding-3-large"

# 语义匹配阈值 (0-1)
# text-embedding-3-large 的相似度通常较高，建议 0.82 以上视为语义相近
SIMILARITY_THRESHOLD = 0.82

# Neo4j 配置 (请修改为你实际的配置)
NEO4J_URI = "bolt://127.0.0.1:7687"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "aa8455460"
NEO4J_DATABASE = "graph4"  # 使用 graphTest 实例
NEO4J_GRAPH = "graph4"  # 使用 graph4 表

# 本地原始文件路径 (用于和数据库里的图谱做对比)
SOURCE_FILE = "../static/白鸟遥角色设计.md"


# ===========================================

class Neo4jResidualAnalyzer:
    def __init__(self, uri, user, password, database, graph=None):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.database = database
        self.graph = graph

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

        # 定义我们关心的实词词性
        self.target_pos = {"NOUN", "VERB", "PROPN", "ADJ"}
        # 定义停用词补充
        self.stop_words = {"的", "了", "在", "是", "和", "被", "有", "一种", "个", "这个", "那个", "进行", "位于"}

    def close(self):
        self.driver.close()

    def fetch_graph_content(self, filename: str) -> Set[str]:
        """从 Neo4j 中获取指定源文件的所有知识点"""
        graph_terms = set()
        # 如果数据库是 graph4，直接查询所有节点和关系（不需要 source/graph 过滤）
        # 否则使用 source 属性过滤
        if self.database == "graph4":
            query = """
            MATCH (n)
            WITH collect(n.id) as node_ids
            MATCH ()-[r]->()
            WITH node_ids, collect(type(r)) as rel_types
            RETURN node_ids, rel_types
            """
            query_params = {}
        else:
            # 构建查询条件：如果指定了 graph，则添加 graph 过滤
            where_conditions = ["n.source = $filename"]
            rel_where_conditions = ["r.source = $filename"]
            query_params = {"filename": filename}
            
            if self.graph:
                where_conditions.append("n.graph = $graph")
                rel_where_conditions.append("r.graph = $graph")
                query_params["graph"] = self.graph
            
            query = f"""
            MATCH (n) WHERE {' AND '.join(where_conditions)}
            WITH collect(n.id) as node_ids
            MATCH ()-[r]->() WHERE {' AND '.join(rel_where_conditions)}
            WITH node_ids, collect(type(r)) as rel_types
            RETURN node_ids, rel_types
            """
        
        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(query, **query_params)
                record = result.single()
                if not record:
                    print(f"⚠️ 警告: Neo4j 数据库 '{self.database}' 中未找到数据。")
                    return set()

                for item in record["node_ids"]:
                    if item: graph_terms.add(str(item))
                for item in record["rel_types"]:
                    if item: graph_terms.add(str(item))
        except Exception as e:
            print(f"❌ Neo4j 查询出错: {e}")

        return graph_terms

    def get_text_significant_tokens(self, text: str) -> List[str]:
        """分析本地文本，提取实词"""
        doc = self.nlp(text)
        tokens = []
        for token in doc:
            if token.is_stop or token.is_punct or token.is_space or token.text in self.stop_words:
                continue
            if token.pos_ in self.target_pos:
                tokens.append(token.text)
        return tokens

    def compute_similarity_batch(self, source_words: List[str], target_words: List[str]) -> Dict[str, float]:
        """
        批量计算 source_words 中每个词与 target_words 中最相似词的相似度分数
        使用 Faiss 库进行加速计算
        返回: { "source_word": max_score, ... }
        """
        if not source_words or not target_words:
            return {w: 0.0 for w in source_words}

        print(f"  -> 正在计算向量: 原文词汇 {len(source_words)} 个, 图谱词汇 {len(target_words)} 个...")

        # 1. 批量获取向量
        try:
            src_embs = self.embeddings.embed_documents(source_words)
            tgt_embs = self.embeddings.embed_documents(target_words)
        except Exception as e:
            print(f"❌ 向量化 API 调用失败: {e}")
            return {w: 0.0 for w in source_words}

        # 2. 准备 Faiss 数据 (必须是 float32)
        src_np = np.array(src_embs).astype('float32')
        tgt_np = np.array(tgt_embs).astype('float32')

        # 3. L2 归一化 (Faiss 的 InnerProduct 索引需要归一化后才等同于余弦相似度)
        faiss.normalize_L2(src_np)
        faiss.normalize_L2(tgt_np)

        # 4. 构建索引并搜索
        d = tgt_np.shape[1]  # 向量维度
        # IndexFlatIP = Exact Search for Inner Product (点积)
        index = faiss.IndexFlatIP(d)
        index.add(tgt_np)

        # 搜索 src_np 中每个向量在 tgt_np 中的最近邻 (k=1)
        # D 是相似度矩阵 (Distances), I 是索引矩阵 (Indices)
        D, I = index.search(src_np, 1)

        # D 的形状是 (n_source, 1)，展平为一维数组
        max_scores = D.flatten()

        return dict(zip(source_words, max_scores))

    def calculate(self, filepath: str):
        filename = os.path.basename(filepath)
        print(f"\n--- 开始语义残差分析: {filename} ---")

        # 1. 读取本地原文
        if not os.path.exists(filepath):
            print(f"❌ 错误: 找不到本地文件 {filepath}")
            return
        with open(filepath, 'r', encoding='utf-8') as f:
            text_content = f.read()

        # 2. 获取原文实词 (分母)
        original_tokens = self.get_text_significant_tokens(text_content)
        total_tokens_count = len(original_tokens)
        if total_tokens_count == 0:
            print("原文没有提取到有效实词。")
            return

        # 3. 获取图谱内容 (分子来源)
        graph_terms = self.fetch_graph_content(filename)
        print(f"Neo4j 图谱词汇量: {len(graph_terms)}")

        if not graph_terms:
            print("图谱为空，残差率 100%。")
            return

        # 4. 语义匹配计算
        # 对原文 token 去重，减少 embedding 次数
        unique_original_tokens = list(set(original_tokens))
        graph_terms_list = list(graph_terms)

        # 获取 {token: max_similarity_score}
        similarity_map = self.compute_similarity_batch(unique_original_tokens, graph_terms_list)

        # 5. 统计覆盖率
        covered_count = 0
        uncovered_tokens = []

        # 详细日志记录器 (仅记录前几个)
        debug_logs = []

        for token in original_tokens:
            score = similarity_map.get(token, 0.0)

            # 判定：如果相似度 > 阈值，或者 字符串直接包含，都算覆盖
            is_literal_match = False
            for g_term in graph_terms:
                if token in g_term or g_term in token:
                    is_literal_match = True
                    break

            if score > SIMILARITY_THRESHOLD or is_literal_match:
                covered_count += 1
            else:
                uncovered_tokens.append(f"{token}(sim={score:.2f})")
                if len(debug_logs) < 5:
                    debug_logs.append(f"'{token}' 未匹配 (最高相似度: {score:.2f})")

        residual_ratio = len(uncovered_tokens) / total_tokens_count
        coverage_ratio = covered_count / total_tokens_count

        # 6. 输出报告
        print("\n📊 === 语义残差报告 ===")
        print(f"模型: {EMBEDDING_MODEL} | 阈值: {SIMILARITY_THRESHOLD}")
        print(f"---------------------------")
        print(f"原文实词总数: {total_tokens_count}")
        print(f"语义覆盖实词: {covered_count}")
        print(f"未覆盖实词数: {len(uncovered_tokens)}")
        print(f"---------------------------")
        print(f"覆盖率 (Coverage): {coverage_ratio:.2%}")
        print(f"残差率 (Residual): {residual_ratio:.2%}")
        print(f"---------------------------")

        unique_missing = list(set(uncovered_tokens))
        print(f"🔍 遗漏的关键词示例 (Top 20):\n{unique_missing[:20]}")

        if residual_ratio < 0.2:
            print("✅ 结论: 图谱提取颗粒度已足够细致。")
        else:
            print("⚠️ 结论: 仍有大量语义未覆盖，建议增加提取粒度。")


def main():
    if not os.path.exists(SOURCE_FILE):
        with open(SOURCE_FILE, "w", encoding="utf-8") as f:
            f.write(
                "# 人工智能\n\n人工智能（AI）是计算机科学的一个分支。Geoffrey Hinton 被称为深度学习之父。他在 Google 工作过。")

    analyzer = Neo4jResidualAnalyzer(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE)
    try:
        analyzer.calculate(SOURCE_FILE)
    finally:
        analyzer.close()


if __name__ == "__main__":
    main()
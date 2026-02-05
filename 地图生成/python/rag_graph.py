import os
import yaml
import subprocess
import shutil
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import glob
from datetime import datetime

# ================= 配置区域 =================
# 项目根目录名称
PROJECT_DIR = "./my_graphrag_project"
INPUT_DIR = os.path.join(PROJECT_DIR, "input")

# API 配置
API_KEY = "sk-D7OWUqvBcM500TgnC4UBixNKHiiguyppWdSw11xgVjKVDdFU"
BASE_URL = "https://hk-api.gptbest.vip/v1"

# 模型配置
CHAT_MODEL = "gemini-3-flash-preview-thinking-*"
EMBEDDING_MODEL = "text-embedding-3-large"


# ===========================================

def create_directory_structure(uploaded_file_path=None):
    """创建 GraphRAG 所需的文件夹结构，使用上传的文件"""
    if not os.path.exists(INPUT_DIR):
        os.makedirs(INPUT_DIR)
        print(f"已创建目录: {INPUT_DIR}")

    # 如果提供了上传的文件，将其复制到输入目录
    if uploaded_file_path and os.path.exists(uploaded_file_path):
        # 获取原始文件名
        original_filename = os.path.basename(uploaded_file_path)
        # 确保是 .md 文件
        if not original_filename.endswith('.md'):
            original_filename = original_filename.rsplit('.', 1)[0] + '.md'
        
        md_file_path = os.path.join(INPUT_DIR, original_filename)
        shutil.copy2(uploaded_file_path, md_file_path)
        print(f"已复制上传文件到: {md_file_path}")
        return md_file_path
    else:
        print("警告：未提供上传文件路径")
        return None


def generate_settings_yaml():
    """生成包含自定义 API 地址的 settings.yaml"""

    # GraphRAG 的标准配置模板
    settings = {
        "encoding_model": "cl100k_base",
        "skip_workflows": [],
        "llm": {
            "api_key": API_KEY,
            "type": "openai_chat",  # 即使是第三方接口，只要兼容 OpenAI 协议也选这个
            "model": CHAT_MODEL,
            "model_supports_json": True,
            "api_base": BASE_URL,
            # 这里的 tokens 参数根据具体模型调整
            "max_tokens": 4000,
            "request_timeout": 180.0,
            "tokens_per_minute": 50000,
            "requests_per_minute": 500,
            "max_retries": 3,
            "concurrent_requests": 5,
        },
        "parallelization": {
            "stagger": 0.3,
            "num_threads": 50
        },
        "async_mode": "threaded",
        "embeddings": {
            "async_mode": "threaded",
            "llm": {
                "api_key": API_KEY,
                "type": "openai_embedding",
                "model": EMBEDDING_MODEL,
                "api_base": BASE_URL,
                "max_retries": 3,
                "concurrent_requests": 10,
            }
        },
        "chunks": {
            "size": 300,
            "overlap": 100,
            "group_by_columns": ["id"]
        },
        "input": {
            "type": "file",
            "file_type": "text",
            "base_dir": "input",
            "file_encoding": "utf-8",
            "file_pattern": ".*\\.md$"
        },
        "cache": {
            "type": "file",
            "base_dir": "cache"
        },
        "storage": {
            "type": "file",
            "base_dir": "output/${timestamp}/artifacts"
        },
        "reporting": {
            "type": "file",
            "base_dir": "output/${timestamp}/reports"
        },
        "entity_extraction": {
            "prompt": "prompts/entity_extraction.txt",
            "entity_types": ["organization", "person", "geo", "event"],
            "max_gleanings": 0
        },
        "summarize_descriptions": {
            "prompt": "prompts/summarize_descriptions.txt",
            "max_length": 500
        },
        "claim_extraction": {
            "enabled": False,
            "prompt": "prompts/claim_extraction.txt",
            "description": "Any claims or facts that could be relevant to information seekers.",
            "max_gleanings": 0
        },
        "community_reports": {
            "prompt": "prompts/community_report.txt",
            "max_length": 2000,
            "max_input_length": 8000
        },
        "cluster_graph": {
            "max_cluster_size": 10
        },
        "embed_graph": {
            "enabled": False  # 为了节省 token，默认关闭图嵌入
        },
        "umap": {
            "enabled": False
        },
        "snapshots": {
            "graphml": False,
            "raw_entities": False,
            "top_level_nodes": False
        },
        "local_search": {
            "text_unit_prop": 0.5,
            "community_prop": 0.1,
            "conversation_history_max_turns": 5,
            "top_k_mapped_entities": 10,
            "top_k_relationships": 10,
            "llm_temperature": 0,
            "llm_top_p": 1,
            "llm_n": 1,
            "max_tokens": 12000
        },
        "global_search": {
            "llm_temperature": 0,
            "llm_top_p": 1,
            "llm_n": 1,
            "max_tokens": 12000,
            "data_max_tokens": 12000,
            "map_max_tokens": 1000,
            "reduce_max_tokens": 2000,
            "concurrency": 32
        }
    }

    yaml_path = os.path.join(PROJECT_DIR, "settings.yaml")
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(settings, f, default_flow_style=False)
    print(f"配置文件已生成: {yaml_path}")


def run_indexing():
    """调用 GraphRAG CLI 开始构建图谱"""
    print("\n--- 开始构建图谱 (GraphRAG Indexing) ---")
    print("注意：这可能需要几分钟，取决于文件大小。")

    # 相当于在命令行执行: python -m graphrag.index --root ./my_graphrag_project
    cmd = [
        "python", "-m", "graphrag.index",
        "--root", PROJECT_DIR
    ]

    try:
        # 实时输出日志
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            env={**os.environ, "GRAPHRAG_API_KEY": API_KEY}  # 确保环境变量里也有Key
        )

        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())

        rc = process.poll()
        if rc == 0:
            print(f"\n✅ 图谱构建成功！输出位于 {PROJECT_DIR}/output 目录下。")
            print(f"你可以查看 parquet 文件，或使用 graphrag.query 进行查询。")
        else:
            print("\n❌ 构建失败。请检查上方的错误日志。")
            stderr = process.stderr.read()
            print(stderr)

    except Exception as e:
        print(f"执行出错: {e}")


# ================= Flask 应用 =================
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 上传文件保存目录
UPLOAD_FOLDER = "./uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """处理文件上传"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件被上传'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '文件名为空'}), 400
        
        # 保存上传的文件
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        return jsonify({
            'message': '文件上传成功',
            'filename': filename,
            'filepath': filepath
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/process', methods=['POST'])
def process_file():
    """处理上传的文件并构建图谱"""
    try:
        data = request.json
        filepath = data.get('filepath')
        
        if not filepath or not os.path.exists(filepath):
            return jsonify({'error': '文件不存在'}), 400
        
        # 1. 准备目录并复制文件
        create_directory_structure(filepath)
        
        # 2. 生成配置文件
        generate_settings_yaml()
        
        # 3. 运行索引（在后台线程中运行）
        import threading
        thread = threading.Thread(target=run_indexing)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'message': '图谱构建已开始，请稍候...',
            'status': 'processing'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/graph-data', methods=['GET'])
def get_graph_data():
    """获取图谱数据用于可视化"""
    try:
        # 查找最新的输出目录
        output_base = os.path.join(PROJECT_DIR, "output")
        if not os.path.exists(output_base):
            return jsonify({'error': '输出目录不存在，图谱可能还在构建中'}), 404
        
        # 查找最新的时间戳目录
        timestamp_dirs = [d for d in os.listdir(output_base) if os.path.isdir(os.path.join(output_base, d))]
        if not timestamp_dirs:
            return jsonify({'error': '没有找到输出数据'}), 404
        
        latest_dir = max(timestamp_dirs)
        artifacts_dir = os.path.join(output_base, latest_dir, "artifacts")
        
        # 查找 entities.parquet 和 relationships.parquet
        entities_file = os.path.join(artifacts_dir, "entities.parquet")
        relationships_file = os.path.join(artifacts_dir, "relationships.parquet")
        
        if not os.path.exists(entities_file) or not os.path.exists(relationships_file):
            return jsonify({'error': '图谱数据文件不存在，可能还在构建中'}), 404
        
        # 读取 parquet 文件并转换为 JSON
        try:
            import pandas as pd
            entities_df = pd.read_parquet(entities_file)
            relationships_df = pd.read_parquet(relationships_file)
            
            # 转换为前端需要的格式
            nodes = []
            for _, row in entities_df.iterrows():
                nodes.append({
                    'id': str(row.get('id', '')),
                    'label': str(row.get('title', '')),
                    'type': str(row.get('type', 'entity')),
                    'description': str(row.get('description', ''))[:200]  # 限制长度
                })
            
            edges = []
            for _, row in relationships_df.iterrows():
                edges.append({
                    'source': str(row.get('source', '')),
                    'target': str(row.get('target', '')),
                    'type': str(row.get('type', '')),
                    'description': str(row.get('description', ''))[:200]
                })
            
            return jsonify({
                'nodes': nodes,
                'edges': edges,
                'status': 'completed'
            }), 200
        except ImportError:
            return jsonify({'error': '需要安装 pandas 和 pyarrow 库'}), 500
        except Exception as e:
            return jsonify({'error': f'读取数据时出错: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/status', methods=['GET'])
def get_status():
    """获取处理状态"""
    try:
        output_base = os.path.join(PROJECT_DIR, "output")
        if os.path.exists(output_base):
            timestamp_dirs = [d for d in os.listdir(output_base) if os.path.isdir(os.path.join(output_base, d))]
            if timestamp_dirs:
                latest_dir = max(timestamp_dirs)
                artifacts_dir = os.path.join(output_base, latest_dir, "artifacts")
                entities_file = os.path.join(artifacts_dir, "entities.parquet")
                if os.path.exists(entities_file):
                    return jsonify({'status': 'completed'}), 200
        
        return jsonify({'status': 'processing'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/')
def index():
    """返回前端页面"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(script_dir, 'graphrag_visualization.html')


if __name__ == "__main__":
    # 如果直接运行，启动 Flask 服务器
    print("启动 GraphRAG 可视化服务器...")
    print("访问 http://localhost:5000 查看界面")
    app.run(host='0.0.0.0', port=5000, debug=True)
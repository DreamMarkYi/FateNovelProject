# GraphRAG 知识图谱可视化系统

这是一个基于 GraphRAG 的知识图谱构建和可视化系统，支持文件上传、自动构建图谱和交互式可视化。

## 功能特性

- 📁 **文件上传**：支持上传 Markdown 格式文档
- 🔄 **自动构建**：自动调用 GraphRAG 构建知识图谱
- 📊 **可视化展示**：使用 D3.js 进行交互式图谱可视化
- 🎨 **美观界面**：现代化的 UI 设计

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 1. 启动服务器

```bash
python rag_graph.py
```

服务器将在 `http://localhost:5000` 启动。

### 2. 访问界面

在浏览器中打开 `http://localhost:5000`

### 3. 使用流程

1. **上传文件**：点击"选择文件"按钮，选择一个 Markdown (.md) 格式的文件
2. **构建图谱**：点击"开始构建图谱"按钮，系统将自动处理文件并构建知识图谱
3. **查看可视化**：构建完成后，图谱将自动显示在页面上
4. **交互操作**：
   - 拖拽节点可以重新布局
   - 鼠标悬停在节点上可以查看详细信息
   - 点击"刷新图谱"可以重新加载数据

## API 接口

### POST /api/upload
上传文件到服务器

**请求**：multipart/form-data
- `file`: 要上传的文件

**响应**：
```json
{
  "message": "文件上传成功",
  "filename": "example.md",
  "filepath": "./uploads/example.md"
}
```

### POST /api/process
处理上传的文件并构建图谱

**请求**：
```json
{
  "filepath": "./uploads/example.md"
}
```

**响应**：
```json
{
  "message": "图谱构建已开始，请稍候...",
  "status": "processing"
}
```

### GET /api/status
获取处理状态

**响应**：
```json
{
  "status": "completed"  // 或 "processing"
}
```

### GET /api/graph-data
获取图谱数据用于可视化

**响应**：
```json
{
  "nodes": [
    {
      "id": "entity1",
      "label": "实体名称",
      "type": "entity",
      "description": "实体描述"
    }
  ],
  "edges": [
    {
      "source": "entity1",
      "target": "entity2",
      "type": "relationship",
      "description": "关系描述"
    }
  ],
  "status": "completed"
}
```

## 配置说明

在 `rag_graph.py` 中可以修改以下配置：

- `API_KEY`: API 密钥
- `BASE_URL`: API 基础地址
- `CHAT_MODEL`: 聊天模型名称
- `EMBEDDING_MODEL`: 嵌入模型名称
- `PROJECT_DIR`: GraphRAG 项目目录

## 注意事项

1. 确保已安装 GraphRAG 和相关依赖
2. 首次运行可能需要较长时间来构建图谱
3. 大文件处理可能需要几分钟时间
4. 确保有足够的磁盘空间存储输出文件

## 技术栈

- **后端**：Python + Flask
- **前端**：HTML + JavaScript + D3.js
- **图谱构建**：GraphRAG
- **数据格式**：Parquet

## 许可证

MIT License

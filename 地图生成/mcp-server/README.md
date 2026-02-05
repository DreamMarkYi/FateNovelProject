# 知识图谱 MCP 服务 (knowledge-graph-mcp)

参考 Google Drive MCP 等设计：将「写入 Neo4j」抽象为 MCP 工具，脚本（如 `knowledgeGraph.py`）只向本服务传入由 LLM 提取生成的参数，不直接写数据库。

## 功能

- **工具** `add_graph_data`：接收 `nodes`、`relationships`、`chunk_index`（及可选 `database`），将数据写入 Neo4j。
- 实际写入通过调用 地图生成 `server.js` 的 **HTTP 接口** `POST /api/graph/add` 完成，与 Python 脚本共用同一套写入逻辑。

## 运行前准备

1. 启动 地图生成 HTTP 服务（提供 `/api/graph/add`）：
   ```bash
   npm run start:graph
   ```
   或从项目根目录：`node 地图生成/server.js`（默认 `http://localhost:3000`）。

2. 可选：通过环境变量指定写入接口地址（默认 `http://localhost:3000/api/graph/add`）：
   ```bash
   set KNOWLEDGE_GRAPH_API_URL=http://localhost:3000/api/graph/add
   ```

## 运行 MCP 服务（stdio，供 Cursor 等客户端调用）

```bash
cd 地图生成/mcp-server
npm install   # 无额外依赖时可跳过
node index.js
```

客户端需以 stdio 方式启动本进程，通过 JSON-RPC 调用 `tools/list`、`tools/call`。

## 在 Cursor 中启用

在 Cursor 的 MCP 配置（如 `.cursor/mcp.json` 或设置中的 MCP 列表）中添加：

```json
{
  "mcpServers": {
    "knowledge-graph": {
      "command": "node",
      "args": ["地图生成/mcp-server/index.js"],
      "cwd": "项目根目录绝对路径",
      "env": {
        "KNOWLEDGE_GRAPH_API_URL": "http://localhost:3000/api/graph/add"
      }
    }
  }
}
```

确保先启动 `server.js`，再在 Cursor 中调用 `add_graph_data` 工具。

## Python 脚本用法

`knowledgeGraph.py` 已改为只向写入服务传参，不再直接连接 Neo4j：

- 默认请求：`GRAPH_WRITE_SERVICE_URL = "http://localhost:3000/api/graph/add"`
- 可通过环境变量覆盖：`KNOWLEDGE_GRAPH_API_URL`

运行前请先启动 地图生成 `server.js`，再执行：

```bash
cd 地图生成/python
python knowledgeGraph.py
```

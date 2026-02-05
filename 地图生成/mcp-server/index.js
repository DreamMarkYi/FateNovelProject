#!/usr/bin/env node
/**
 * 知识图谱 MCP 服务（参考 Google Drive MCP 等）
 * 暴露工具 add_graph_data：将 LLM 提取的 nodes/relationships 写入 Neo4j。
 * 实际写入通过调用 地图生成 server.js 的 HTTP 接口 POST /api/graph/add 完成。
 * 脚本（如 knowledgeGraph.py）只向本服务传入参数，参数由提取 LLM 输出生成。
 */

const GRAPH_API_URL = process.env.KNOWLEDGE_GRAPH_API_URL || 'http://localhost:3000/api/graph/add';

const TOOLS = [
  {
    name: 'add_graph_data',
    description: '将知识图谱数据写入 Neo4j。传入由 LLM 提取的 nodes、relationships 和 chunk_index，可选 database。',
    inputSchema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          description: '节点列表，每项含 id, type, content 等',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: '主题唯一标识' },
              type: { type: 'string', description: '节点类型：人物信息/背景故事/能力设定/装备礼装' },
              content: { type: 'string', description: '与该主题相关的具体内容' }
            }
          }
        },
        relationships: {
          type: 'array',
          description: '关系列表，每项含 source, target, type, context',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              target: { type: 'string' },
              type: { type: 'string' },
              context: { type: 'string' }
            }
          }
        },
        chunk_index: {
          type: 'number',
          description: 'chunk 索引，用于标识节点来源'
        },
        database: {
          type: 'string',
          description: 'Neo4j 数据库名，可选，默认 chunk1'
        }
      },
      required: ['nodes', 'relationships', 'chunk_index']
    }
  }
];

async function callGraphApi(nodes, relationships, chunk_index, database) {
  const res = await fetch(GRAPH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodes: nodes || [],
      relationships: relationships || [],
      chunk_index,
      database: database || undefined
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText || `HTTP ${res.status}`);
  }
  return data;
}

function send(msg) {
  console.log(JSON.stringify(msg));
}

async function handleMessage(msg) {
  const { id, method, params } = msg;
  if (!id && !method) return;

  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'knowledge-graph-mcp', version: '1.0.0' }
        }
      });
      return;
    }
    if (method === 'notifications/initialized') return;

    if (method === 'tools/list') {
      send({
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS }
      });
      return;
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      if (name !== 'add_graph_data') {
        send({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Unknown tool: ${name}` }
        });
        return;
      }
      const nodes = args?.nodes ?? [];
      const relationships = args?.relationships ?? [];
      const chunk_index = args?.chunk_index;
      const database = args?.database;
      if (typeof chunk_index !== 'number') {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: '错误：chunk_index 必须为数字。' }],
            isError: true
          }
        });
        return;
      }
      const result = await callGraphApi(nodes, relationships, chunk_index, database);
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: `已写入 Neo4j：${result.nodesCreated ?? 0} 个节点，${result.relationshipsCreated ?? 0} 条关系。数据库：${result.database ?? 'chunk1'}。`
          }],
          isError: false
        }
      });
      return;
    }

    send({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    });
  } catch (err) {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: `调用失败: ${err.message}` }],
        isError: true
      }
    });
  }
}

async function main() {
  const rl = await import('readline').then(m => m.createInterface({ input: process.stdin }));
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const msg = JSON.parse(trimmed);
      await handleMessage(msg);
    } catch (_) {}
  }
}

main().catch((err) => {
  process.stderr.write(`knowledge-graph-mcp error: ${err.message}\n`);
  process.exit(1);
});

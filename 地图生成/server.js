const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志中间件（仅用于调试）
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`${req.method} ${req.path}`);
    }
    next();
});

// 注意：API 路由需要在静态文件服务之前定义

// Neo4j 配置（从main.py中获取）
const NEO4J_URI = "bolt://127.0.0.1:7687";
const NEO4J_USERNAME = "neo4j";
const NEO4J_PASSWORD = "aa8455460";

// 创建Neo4j驱动
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));

// 测试Neo4j连接
async function testConnection() {
    try {
        const session = driver.session();
        await session.run('RETURN 1');
        await session.close();
        console.log('✅ Neo4j 连接成功');
        return true;
    } catch (error) {
        console.error('❌ Neo4j 连接失败:', error.message);
        return false;
    }
}

// 默认写入数据库（与 knowledgeGraph.py 一致）
const DEFAULT_GRAPH_DATABASE = 'chunk1';

/**
 * 将提取的图谱数据写入 Neo4j（与 knowledgeGraph.py Neo4jHandler.add_graph_data 逻辑一致）
 * @param {Array} nodes - 节点列表，每项含 id, type, content 等
 * @param {Array} relationships - 关系列表，每项含 source, target, type, context
 * @param {number} chunkIndex - chunk 索引
 * @param {string|null} database - 数据库名，默认 chunk1
 */
async function addGraphData(nodes, relationships, chunkIndex, database = DEFAULT_GRAPH_DATABASE) {
    if ((!nodes || nodes.length === 0) && (!relationships || relationships.length === 0)) {
        return { nodesCreated: 0, relationshipsCreated: 0 };
    }

    const sessionConfig = database ? { database } : {};
    const session = driver.session(sessionConfig);
    const nodeIdMap = {}; // original_id -> internal_id
    let nodesCreated = 0;
    let relationshipsCreated = 0;

    try {
        // 1. 按 Label 分组节点，并建立 original_id -> internal_id 映射
        const nodesByLabel = {};
        nodes.forEach((node, idx) => {
            const label = (node.type || 'Entity').replace(/\W/g, '') || 'Entity';
            if (!nodesByLabel[label]) nodesByLabel[label] = [];
            const originalId = node.id;
            const internalId = `chunk${chunkIndex}_node${idx}`;
            nodeIdMap[originalId] = internalId;
            const properties = { ...node };
            delete properties.id;
            delete properties.type;
            const nodeData = {
                node_id: internalId,
                properties: {
                    id: originalId,
                    chunk_index: chunkIndex,
                    ...properties
                }
            };
            nodesByLabel[label].push(nodeData);
        });

        // 创建节点（CREATE）
        for (const [label, entityList] of Object.entries(nodesByLabel)) {
            const query = `
                UNWIND $batch AS row
                CREATE (n:\`${label}\`)
                SET n.node_id = row.node_id, n += row.properties
            `;
            await session.run(query, { batch: entityList });
            nodesCreated += entityList.length;
        }

        // 2. 写入关系（按 type 分组，使用 internal_id，统一方向，MERGE）
        if (relationships && relationships.length > 0) {
            const relsByType = {};
            for (const rel of relationships) {
                const rType = (rel.type || 'RELATED_TO').replace(/[^a-zA-Z0-9_]/g, '').toUpperCase() || 'RELATED_TO';
                if (!relsByType[rType]) relsByType[rType] = [];
                const sourceId = nodeIdMap[rel.source];
                const targetId = nodeIdMap[rel.target];
                if (!sourceId || !targetId) continue;
                const [fromId, toId] = sourceId < targetId ? [sourceId, targetId] : [targetId, sourceId];
                relsByType[rType].push({
                    source: fromId,
                    target: toId,
                    context: rel.context || ''
                });
            }
            for (const [rType, relList] of Object.entries(relsByType)) {
                const query = `
                    UNWIND $batch AS row
                    MATCH (source {node_id: row.source})
                    MATCH (target {node_id: row.target})
                    MERGE (source)-[r:\`${rType}\`]->(target)
                    ON CREATE SET r.context = COALESCE(row.context, '')
                `;
                await session.run(query, { batch: relList });
                relationshipsCreated += relList.length;
            }
        }

        return { nodesCreated, relationshipsCreated };
    } finally {
        await session.close();
    }
}

// API：写入图谱数据（供 Python 脚本或 MCP 调用）
app.post('/api/graph/add', async (req, res) => {
    try {
        const { nodes = [], relationships = [], chunk_index: chunkIndex, database } = req.body;
        if (typeof chunkIndex !== 'number') {
            return res.status(400).json({
                success: false,
                error: '缺少或无效的 chunk_index（必须为数字）'
            });
        }
        const result = await addGraphData(nodes, relationships, chunkIndex, database || DEFAULT_GRAPH_DATABASE);
        res.json({
            success: true,
            database: database || DEFAULT_GRAPH_DATABASE,
            ...result
        });
    } catch (error) {
        console.error('写入图谱失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 从数据库获取图谱数据
async function getGraphData(databaseName = null) {
    const session = databaseName 
        ? driver.session({ database: databaseName })
        : driver.session();
    
    try {
        // 获取所有节点
        const nodesResult = await session.run(`
            MATCH (n)
            RETURN n.id as id, 
                   n.content as content,
                   n.chunk_index as chunk_index,
                   labels(n) as labels,
                   properties(n) as properties
            LIMIT 1000
        `);
        
        // 获取所有关系（无向图，忽略方向，避免重复）
        // 使用 id() 函数比较节点内部ID，确保每条关系只返回一次
        const relationshipsResult = await session.run(`
            MATCH (source)-[r]-(target)
            WHERE id(source) < id(target)
            RETURN source.id as source,
                   source.chunk_index as source_chunk_index,
                   target.id as target,
                   target.chunk_index as target_chunk_index,
                   type(r) as type,
                   properties(r) as properties
            LIMIT 1000
        `);
        
        // 处理节点数据 - 使用 chunk_index + id 组合生成唯一ID
        const nodeIdSet = new Set(); // 用于检测重复ID
        const nodes = nodesResult.records.map((record, index) => {
            const props = record.get('properties');
            const nodeId = record.get('id') || props.id || `node_${Math.random().toString(36).substr(2, 9)}`;
            const chunkIndex = record.get('chunk_index') !== null && record.get('chunk_index') !== undefined 
                ? record.get('chunk_index') 
                : (props.chunk_index !== null && props.chunk_index !== undefined ? props.chunk_index : null);
            
            // 始终使用 chunk_index + id 组合生成唯一ID
            // 如果chunk_index为null，使用索引作为后缀确保唯一性
            const chunkSuffix = chunkIndex !== null && chunkIndex !== undefined 
                ? chunkIndex 
                : `null_${index}`;
            let uniqueId = `${nodeId}_chunk${chunkSuffix}`;
            
            // 如果仍然有重复（理论上不应该），添加索引后缀
            let counter = 0;
            while (nodeIdSet.has(uniqueId)) {
                uniqueId = `${nodeId}_chunk${chunkSuffix}_${counter}`;
                counter++;
            }
            nodeIdSet.add(uniqueId);
            
            return {
                id: uniqueId,
                original_id: nodeId,
                chunk_index: chunkIndex,
                label: nodeId,
                content: record.get('content') || '',
                labels: record.get('labels') || [],
                properties: props
            };
        });
        
        // 处理关系数据 - 使用相同的ID生成规则
        const relationships = relationshipsResult.records.map((record, index) => {
            const sourceId = record.get('source');
            const targetId = record.get('target');
            const sourceChunkIndex = record.get('source_chunk_index');
            const targetChunkIndex = record.get('target_chunk_index');
            
            // 使用相同的逻辑生成唯一ID
            const sourceChunkSuffix = sourceChunkIndex !== null && sourceChunkIndex !== undefined 
                ? sourceChunkIndex 
                : `null_${index}_src`;
            const targetChunkSuffix = targetChunkIndex !== null && targetChunkIndex !== undefined 
                ? targetChunkIndex 
                : `null_${index}_tgt`;
            
            const fromId = `${sourceId}_chunk${sourceChunkSuffix}`;
            const toId = `${targetId}_chunk${targetChunkSuffix}`;
            
            return {
                from: fromId,
                to: toId,
                type: record.get('type') || 'RELATED_TO',
                properties: record.get('properties') || {}
            };
        });
        
        return { nodes, relationships };
    } catch (error) {
        console.error(`获取数据库 ${databaseName || 'default'} 数据失败:`, error);
        throw error;
    } finally {
        await session.close();
    }
}

// API路由：获取默认数据库的图谱数据
app.get('/api/graph/default', async (req, res) => {
    try {
        const data = await getGraphData(null);
        res.json({
            success: true,
            database: 'neo4j',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：获取graph1数据库的图谱数据
app.get('/api/graph/graph1', async (req, res) => {
    try {
        const data = await getGraphData('graph1');
        res.json({
            success: true,
            database: 'graph1',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：获取graph2数据库的图谱数据
app.get('/api/graph/graph2', async (req, res) => {
    try {
        const data = await getGraphData('graph2');
        res.json({
            success: true,
            database: 'graph2',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：获取graph3数据库的图谱数据
app.get('/api/graph/graph3', async (req, res) => {
    try {
        const data = await getGraphData('graph3');
        res.json({
            success: true,
            database: 'graph3',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：获取graph4数据库的图谱数据
app.get('/api/graph/graph4', async (req, res) => {
    try {
        const data = await getGraphData('graph4');
        res.json({
            success: true,
            database: 'graph4',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：获取chunk1数据库的图谱数据
app.get('/api/graph/chunk1', async (req, res) => {
    try {
        const data = await getGraphData('chunk1');
        res.json({
            success: true,
            database: 'chunk1',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取所有数据库的节点ID集合（用于对比）
async function getAllNodeIds() {
    const databases = [null, 'graph1', 'graph2', 'graph3', 'graph4'];
    const nodeIdMap = {};
    
    for (const dbName of databases) {
        const session = dbName 
            ? driver.session({ database: dbName })
            : driver.session();
        
        try {
            const result = await session.run(`
                MATCH (n)
                RETURN DISTINCT n.id as id
            `);
            
            const dbKey = dbName || 'default';
            nodeIdMap[dbKey] = new Set();
            
            result.records.forEach(record => {
                const nodeId = record.get('id');
                if (nodeId) {
                    nodeIdMap[dbKey].add(nodeId);
                }
            });
        } catch (error) {
            console.error(`获取数据库 ${dbKey || 'default'} 节点ID失败:`, error);
            nodeIdMap[dbKey] = new Set();
        } finally {
            await session.close();
        }
    }
    
    return nodeIdMap;
}

// API路由：获取节点对比信息
app.get('/api/graph/compare', async (req, res) => {
    try {
        const nodeIdMap = await getAllNodeIds();
        
        // 分类节点
        const allNodeIds = new Set();
        Object.values(nodeIdMap).forEach(nodeSet => {
            nodeSet.forEach(id => allNodeIds.add(id));
        });
        
        const comparison = {
            all5: [],      // 5个数据库都有
            graph1to4: [], // graph1-graph4都有（不包括default）
            graph2to4: [], // graph2-graph4都有（不包括default和graph1）
            graph3to4: [], // graph3-graph4都有（不包括default、graph1、graph2）
            onlyGraph4: [] // 只在graph4中
        };
        
        allNodeIds.forEach(nodeId => {
            const inDefault = nodeIdMap['default'].has(nodeId);
            const inGraph1 = nodeIdMap['graph1'].has(nodeId);
            const inGraph2 = nodeIdMap['graph2'].has(nodeId);
            const inGraph3 = nodeIdMap['graph3'].has(nodeId);
            const inGraph4 = nodeIdMap['graph4'].has(nodeId);
            
            // 5个数据库都有
            if (inDefault && inGraph1 && inGraph2 && inGraph3 && inGraph4) {
                comparison.all5.push(nodeId);
            }
            // graph1-graph4都有（不包括default）
            else if (!inDefault && inGraph1 && inGraph2 && inGraph3 && inGraph4) {
                comparison.graph1to4.push(nodeId);
            }
            // graph2-graph4都有（不包括default和graph1）
            else if (!inDefault && !inGraph1 && inGraph2 && inGraph3 && inGraph4) {
                comparison.graph2to4.push(nodeId);
            }
            // graph3-graph4都有（不包括default、graph1、graph2）
            else if (!inDefault && !inGraph1 && !inGraph2 && inGraph3 && inGraph4) {
                comparison.graph3to4.push(nodeId);
            }
            // 只在graph4中
            else if (!inDefault && !inGraph1 && !inGraph2 && !inGraph3 && inGraph4) {
                comparison.onlyGraph4.push(nodeId);
            }
        });
        
        res.json({
            success: true,
            comparison: comparison,
            stats: {
                all5: comparison.all5.length,
                graph1to4: comparison.graph1to4.length,
                graph2to4: comparison.graph2to4.length,
                graph3to4: comparison.graph3to4.length,
                onlyGraph4: comparison.onlyGraph4.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：获取所有数据库的数据
app.get('/api/graph/all', async (req, res) => {
    try {
        const [defaultData, graph1Data, graph2Data, graph3Data, graph4Data] = await Promise.all([
            getGraphData(null).catch(err => {
                console.error('获取默认数据库数据失败:', err);
                return { nodes: [], relationships: [] };
            }),
            getGraphData('graph1').catch(err => {
                console.error('获取graph1数据库数据失败:', err);
                return { nodes: [], relationships: [] };
            }),
            getGraphData('graph2').catch(err => {
                console.error('获取graph2数据库数据失败:', err);
                return { nodes: [], relationships: [] };
            }),
            getGraphData('graph3').catch(err => {
                console.error('获取graph3数据库数据失败:', err);
                return { nodes: [], relationships: [] };
            }),
            getGraphData('graph4').catch(err => {
                console.error('获取graph4数据库数据失败:', err);
                return { nodes: [], relationships: [] };
            })
        ]);
        
        res.json({
            success: true,
            default: {
                database: 'neo4j',
                data: defaultData
            },
            graph1: {
                database: 'graph1',
                data: graph1Data
            },
            graph2: {
                database: 'graph2',
                data: graph2Data
            },
            graph3: {
                database: 'graph3',
                data: graph3Data
            },
            graph4: {
                database: 'graph4',
                data: graph4Data
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 清空数据库
async function clearDatabase(databaseName = null) {
    const session = databaseName 
        ? driver.session({ database: databaseName })
        : driver.session();
    
    try {
        // 删除所有节点和关系
        const result = await session.run(`
            MATCH (n)
            DETACH DELETE n
        `);
        
        return {
            success: true,
            deletedCount: result.summary.counters.updates().nodesDeleted || 0
        };
    } catch (error) {
        console.error(`清空数据库 ${databaseName || 'default'} 失败:`, error);
        throw error;
    } finally {
        await session.close();
    }
}

// API路由：清空默认数据库
app.delete('/api/graph/default', async (req, res) => {
    try {
        const result = await clearDatabase(null);
        res.json({
            success: true,
            database: 'neo4j',
            message: `已清空默认数据库，删除了 ${result.deletedCount} 个节点`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：清空graph1数据库
app.delete('/api/graph/graph1', async (req, res) => {
    try {
        const result = await clearDatabase('graph1');
        res.json({
            success: true,
            database: 'graph1',
            message: `已清空graph1数据库，删除了 ${result.deletedCount} 个节点`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：清空graph2数据库
app.delete('/api/graph/graph2', async (req, res) => {
    try {
        const result = await clearDatabase('graph2');
        res.json({
            success: true,
            database: 'graph2',
            message: `已清空graph2数据库，删除了 ${result.deletedCount} 个节点`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：清空graph3数据库
app.delete('/api/graph/graph3', async (req, res) => {
    try {
        const result = await clearDatabase('graph3');
        res.json({
            success: true,
            database: 'graph3',
            message: `已清空graph3数据库，删除了 ${result.deletedCount} 个节点`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：清空graph4数据库
app.delete('/api/graph/graph4', async (req, res) => {
    try {
        const result = await clearDatabase('graph4');
        res.json({
            success: true,
            database: 'graph4',
            message: `已清空graph4数据库，删除了 ${result.deletedCount} 个节点`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：清空chunk1数据库
app.delete('/api/graph/chunk1', async (req, res) => {
    try {
        const result = await clearDatabase('chunk1');
        res.json({
            success: true,
            database: 'chunk1',
            message: `已清空chunk1数据库，删除了 ${result.deletedCount} 个节点`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API路由：清空所有数据库
app.delete('/api/graph/all', async (req, res) => {
    console.log('收到 DELETE /api/graph/all 请求');
    try {
        const [defaultResult, graph1Result, graph2Result, graph3Result, graph4Result] = await Promise.all([
            clearDatabase(null).catch(err => {
                console.error('清空默认数据库失败:', err);
                return { success: false, deletedCount: 0, error: err.message };
            }),
            clearDatabase('graph1').catch(err => {
                console.error('清空graph1数据库失败:', err);
                return { success: false, deletedCount: 0, error: err.message };
            }),
            clearDatabase('graph2').catch(err => {
                console.error('清空graph2数据库失败:', err);
                return { success: false, deletedCount: 0, error: err.message };
            }),
            clearDatabase('graph3').catch(err => {
                console.error('清空graph3数据库失败:', err);
                return { success: false, deletedCount: 0, error: err.message };
            }),
            clearDatabase('graph4').catch(err => {
                console.error('清空graph4数据库失败:', err);
                return { success: false, deletedCount: 0, error: err.message };
            })
        ]);
        
        res.json({
            success: true,
            default: {
                database: 'neo4j',
                deletedCount: defaultResult.deletedCount || 0,
                success: defaultResult.success !== false
            },
            graph1: {
                database: 'graph1',
                deletedCount: graph1Result.deletedCount || 0,
                success: graph1Result.success !== false
            },
            graph2: {
                database: 'graph2',
                deletedCount: graph2Result.deletedCount || 0,
                success: graph2Result.success !== false
            },
            graph3: {
                database: 'graph3',
                deletedCount: graph3Result.deletedCount || 0,
                success: graph3Result.success !== false
            },
            graph4: {
                database: 'graph4',
                deletedCount: graph4Result.deletedCount || 0,
                success: graph4Result.success !== false
            },
            message: `已清空所有数据库。默认数据库: ${defaultResult.deletedCount || 0} 个节点，graph1数据库: ${graph1Result.deletedCount || 0} 个节点，graph2数据库: ${graph2Result.deletedCount || 0} 个节点，graph3数据库: ${graph3Result.deletedCount || 0} 个节点，graph4数据库: ${graph4Result.deletedCount || 0} 个节点`
        });
    } catch (error) {
        console.error('清空所有数据库时出错:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 执行main.py脚本
app.post('/api/execute/main', async (req, res) => {
    const pythonScriptPath = path.join(__dirname, 'python', 'main.py');
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    console.log(`正在执行: ${pythonCommand} ${pythonScriptPath}`);
    
    // 设置响应头，启用流式传输
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const pythonProcess = spawn(pythonCommand, [pythonScriptPath], {
        cwd: path.join(__dirname, 'python'),
        shell: true
    });
    
    let stdout = '';
    let stderr = '';
    
    // 捕获标准输出
    pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // 实时发送输出到客户端
        res.write(`data: ${JSON.stringify({ type: 'stdout', data: output })}\n\n`);
    });
    
    // 捕获错误输出
    pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        // 实时发送错误到客户端
        res.write(`data: ${JSON.stringify({ type: 'stderr', data: output })}\n\n`);
    });
    
    // 进程结束
    pythonProcess.on('close', (code) => {
        const result = {
            type: 'close',
            code: code,
            success: code === 0,
            stdout: stdout,
            stderr: stderr,
            message: code === 0 ? '脚本执行成功' : `脚本执行失败，退出码: ${code}`
        };
        res.write(`data: ${JSON.stringify(result)}\n\n`);
        res.end();
    });
    
    // 进程错误
    pythonProcess.on('error', (error) => {
        const result = {
            type: 'error',
            success: false,
            error: error.message,
            message: `无法启动Python进程: ${error.message}`
        };
        res.write(`data: ${JSON.stringify(result)}\n\n`);
        res.end();
    });
    
    // 客户端断开连接时终止进程
    req.on('close', () => {
        if (!pythonProcess.killed) {
            pythonProcess.kill();
            console.log('客户端断开，已终止Python进程');
        }
    });
});

// 健康检查
app.get('/api/health', async (req, res) => {
    const isConnected = await testConnection();
    res.json({
        success: isConnected,
        message: isConnected ? 'Neo4j连接正常' : 'Neo4j连接失败'
    });
});

// 静态文件服务（必须在所有 API 路由之后）
app.use(express.static(path.join(__dirname)));

// 启动服务器
async function startServer() {
    // 测试连接
    await testConnection();
    
    // 打印所有注册的路由（用于调试）
    console.log('\n📋 已注册的 API 路由:');
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
            console.log(`  ${methods} ${middleware.route.path}`);
        }
    });
    
    app.listen(PORT, () => {
        console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
        console.log(`📊 图谱可视化页面: http://localhost:${PORT}/graph-visualization.html`);
        console.log(`\n✅ 确保 DELETE /api/graph/all 路由已注册\n`);
    });
}

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n正在关闭服务器...');
    await driver.close();
    process.exit(0);
});

startServer().catch(console.error);


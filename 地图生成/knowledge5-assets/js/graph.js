// 5. Vis.js 初始化与图操作
function initOneGraph(containerId, optionsOverride = {}) {
    const nodes = new vis.DataSet([]);
    const edges = new vis.DataSet([]);
    const container = document.getElementById(containerId);

    // 如果容器不存在，返回 null
    if (!container) {
        console.warn(`[INIT GRAPH] 容器元素 "${containerId}" 不存在，无法初始化图`);
        return null;
    }

    const defaultOptions = {
        nodes: {
            shape: 'hexagon',  // 六边形 - 冻京NECRO风格
            size: 20,
            font: { 
                color: '#d0d7de', 
                size: 11, 
                face: 'Share Tech Mono, monospace',
                align: 'center'
            },
            borderWidth: 3,
            borderColor: '#00ffcc',  // 默认荧光青边框
            color: {
                background: '#1a1a1a',  // 深灰黑背景
                border: '#00ffcc',      // 荧光青边框
                highlight: {
                    background: '#0a0a0a',
                    border: '#00ffcc'
                },
                hover: {
                    background: '#0f0f0f',
                    border: '#00ff33'  // 悬停时电路绿
                }
            },
            shadow: {
                enabled: true,
                color: 'rgba(0, 255, 204, 0.3)',
                size: 10,
                x: 0,
                y: 0
            },
            chosen: {
                node: function(values, id, selected, hovering) {
                    if (hovering) {
                        values.borderWidth = 4;
                        values.shadow = {
                            enabled: true,
                            color: 'rgba(0, 255, 204, 0.6)',
                            size: 15
                        };
                    }
                }
            }
        },
        edges: {
            width: 2,
            color: { 
                color: '#333333',  // 默认深灰
                highlight: '#00ffcc',  // 高亮时荧光青
                hover: '#00ff33'  // 悬停时电路绿
            },
            smooth: { type: 'dynamic' },
            shadow: {
                enabled: true,
                color: 'rgba(0, 255, 204, 0.2)',
                size: 3
            }
        },
        physics: {
            enabled: true,
            stabilization: {
                enabled: true,
                iterations: 100,
                updateInterval: 25
            },
            barnesHut: { 
                gravitationalConstant: -2000, 
                springConstant: 0.04,
                springLength: 200
            }
        },
        interaction: { 
            hover: true, 
            zoomView: true,
            dragNodes: true,  // 明确启用节点拖拽
            dragView: true    // 启用视图拖拽
        }
    };

    const options = { ...defaultOptions, ...optionsOverride };
    if(optionsOverride.edges) options.edges = { ...defaultOptions.edges, ...optionsOverride.edges };

    const network = new vis.Network(container, { nodes, edges }, options);
    return { nodes, edges, network };
}

function initAllGraphs() {
    // 1. Location Map:
    // 错误修复: arrows 不能写字符串 "to, from"，必须写成对象格式 { to: true, from: true }
    const locationGraph = initOneGraph('viz-location', {
        nodes: {
            shape: 'hexagon',  // 六边形战术节点
            font: {
                color: '#ffffff',  // 地点文字使用白色
                size: 16,  // 增大输出的文字
                face: 'Share Tech Mono, monospace',
                align: 'center'
            },
            color: {
                background: '#1a1a1a',
                border: '#4a9eff',  // 位置节点默认蓝色
                highlight: {
                    background: '#0a0a0a',
                    border: '#00ffcc'
                }
            }
        },
        edges: {
            arrows: { to: { enabled: true }, from: { enabled: true } },
            color: {
                color: '#4a9eff',  // 位置连接线使用蓝色
                highlight: '#00ffcc',
                hover: '#00ff33'
            },
            shadow: {
                enabled: true,
                color: 'rgba(74, 158, 255, 0.3)',
                size: 4
            },
            font: {
                size: 0  // 隐藏edge的label
            }
        }
    });
    GRAPH_STORE.location = locationGraph;

    // 2. Inventory:
    // 错误修复: 不能传 undefined，需要明确设置为 false 对象来表示无箭头
    const inventoryGraph = initOneGraph('viz-inventory', {
        nodes: {
            shape: 'box',  // 装备使用方形
            margin: 10,
            color: {
                background: '#1a1a1a',
                border: '#d2a8ff',  // 物品节点紫色
                highlight: {
                    background: '#0a0a0a',
                    border: '#00ffcc'
                }
            },
            font: {
                size: 10
            }
        },
        edges: {
            arrows: { to: { enabled: false }, from: { enabled: false } },
            color: {
                color: '#d2a8ff',  // 物品连接线使用紫色
                highlight: '#00ffcc',
                hover: '#00ff33'
            },
            shadow: {
                enabled: true,
                color: 'rgba(210, 168, 255, 0.3)',
                size: 3
            }
        }
    });
    GRAPH_STORE.inventory = inventoryGraph;

    // 3. Narrative:
    // 错误修复: 没有 "style" 这个属性，实现虚线应该用 "dashes: true"
    const narrativeGraph = initOneGraph('viz-narrative', {
        nodes: {
            shape: 'diamond',  // 剧情节点使用菱形
            color: {
                background: '#1a1a1a',
                border: '#ffcc00',  // 剧情节点警示黄
                highlight: {
                    background: '#0a0a0a',
                    border: '#00ffcc'
                }
            }
        },
        edges: {
            arrows: 'to',
            color: {
                color: '#ffcc00',  // 剧情连接线使用警示黄
                highlight: '#00ffcc',
                hover: '#00ff33'
            },
            dashes: true,  // 虚线表示数据流
            shadow: {
                enabled: true,
                color: 'rgba(255, 204, 0, 0.3)',
                size: 3
            }
        },
        layout: { hierarchical: { direction: 'UD', sortMethod: 'directed', levelSeparation: 60 } }
    });
    GRAPH_STORE.narrative = narrativeGraph;

    // 交互监听：点击地图节点显示详情
    if (GRAPH_STORE.location && GRAPH_STORE.location.network) {
        GRAPH_STORE.location.network.on("click", function (params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = GRAPH_STORE.location.nodes.get(nodeId);
                // 确保 showMapNodeInfo 函数存在（在 ui.js 中定义）
                if (typeof window.showMapNodeInfo === 'function') {
                    window.showMapNodeInfo(node);
                }
            }
        });

        // 存储拖拽前的节点固定状态，用于拖拽后恢复
        let dragStartNodeStates = new Map();
        
        // 拖拽开始：临时禁用物理引擎，确保拖拽流畅
        GRAPH_STORE.location.network.on("dragStart", function (params) {
            if (params.nodes && params.nodes.length > 0) {
                const network = GRAPH_STORE.location.network;
                const nodes = GRAPH_STORE.location.nodes;
                
                // 禁用物理引擎
                network.setOptions({
                    physics: { enabled: false }
                });
                
                // 保存拖拽前节点的固定状态，并临时解除固定以允许拖拽
                dragStartNodeStates.clear();
                const updates = params.nodes.map(nodeId => {
                    const node = nodes.get(nodeId);
                    if (node) {
                        // 保存原始固定状态
                        dragStartNodeStates.set(nodeId, {
                            fixed: node.fixed || { x: false, y: false }
                        });
                        
                        // 临时解除固定，允许自由拖拽
                        return {
                            id: nodeId,
                            fixed: { x: false, y: false }
                        };
                    }
                    return null;
                }).filter(update => update !== null);
                
                if (updates.length > 0) {
                    nodes.update(updates);
                }
            }
        });

        // 拖拽结束：固定节点位置，然后重新启用物理引擎
        GRAPH_STORE.location.network.on("dragEnd", function (params) {
            if (params.nodes && params.nodes.length > 0) {
                const network = GRAPH_STORE.location.network;
                const nodes = GRAPH_STORE.location.nodes;
                
                // 获取拖拽后的节点位置
                const positions = network.getPositions(params.nodes);
                
                // 更新节点位置并固定
                const updates = params.nodes.map(nodeId => {
                    const pos = positions[nodeId];
                    if (!pos) {
                        console.warn(`[DRAG] 无法获取节点 ${nodeId} 的位置`);
                        return null;
                    }
                    
                    // 固定节点位置，防止物理引擎移动
                    return {
                        id: nodeId,
                        x: pos.x,
                        y: pos.y,
                        fixed: { x: true, y: true }
                    };
                }).filter(update => update !== null);
                
                if (updates.length > 0) {
                    nodes.update(updates);
                }
                
                // 清除保存的状态
                dragStartNodeStates.clear();
                
                // 延迟重新启用物理引擎，确保节点位置已更新
                setTimeout(() => {
                    // 重新启用物理引擎（但已固定的节点不会被移动）
                    network.setOptions({
                        physics: { enabled: true }
                    });
                    
                    // 触发重绘，确保节点位置正确显示
                    network.redraw();
                }, 50);
            }
        });
    }
}

function executeOp(op) {
    const domain = op.domain;
    if (!GRAPH_STORE[domain]) return;
    const { nodes, edges } = GRAPH_STORE[domain];

    try {
        if (op.op === 'add_node') {
            if (!nodes.get(op.id)) {
                const isVisible = op.is_visible !== undefined ? Boolean(op.is_visible) : true;
                const clueId = op.clue_id || null;
                const normalizedClueMap = op.clue_map || (clueId ? { [clueId]: 'noNPC' } : {});
                const hasClue = op.has_clue !== undefined
                    ? Boolean(op.has_clue)
                    : (Boolean(clueId) || Object.keys(normalizedClueMap).length > 0);
                // 处理NPC数组，保留所有字段（包括knows、occupation、personality等）
                const processedNpcs = op.npcs ? op.npcs.map(npc => ({
                    id: npc.id,
                    name: npc.name || npc.id,
                    desc: npc.desc || '',
                    occupation: npc.occupation || '',
                    personality: npc.personality || '',
                    knows: npc.knows || [],  // NPC知道的线索ID列表
                    spawn_narrative: npc.spawn_narrative || '',
                    is_main_npc: npc.is_main_npc !== undefined ? Boolean(npc.is_main_npc) : false,
                    specialty: (npc.is_main_npc === true && npc.specialty) ? npc.specialty : null,
                    background_story: (npc.is_main_npc === true && npc.background_story) ? npc.background_story : null
                })) : (op.npc_ids ? op.npc_ids.map((id, i) => ({
                    id: id,
                    name: op.npc_names ? op.npc_names[i] : id,
                    desc: op.npc_descs ? op.npc_descs[i] : '',
                    occupation: '',
                    personality: '',
                    knows: [],
                    spawn_narrative: '',
                    is_main_npc: false,
                    specialty: null,
                    background_story: null
                })) : []);
                
                // 处理节点颜色：支持字符串或对象格式
                let nodeColor = op.color || getColorByDomain(domain);
                // 如果传入的是字符串，转换为对象格式
                if (typeof nodeColor === 'string') {
                    nodeColor = {
                        background: '#1a1a1a',
                        border: nodeColor
                    };
                }
                
                const newNode = {
                    id: op.id,
                    label: op.label,
                    title: op.desc,
                    color: nodeColor,
                    // 位置节点扩展元数据（允许LLM写入或由系统更新）
                    // 统一使用 npcs 数组存储完整NPC信息
                    npcs: processedNpcs,
                    has_clue: hasClue,
                    // map: { clueId: holderId|"noNPC" }
                    clue_map: normalizedClueMap,
                    clue_id: clueId,
                    is_visible: isVisible,
                    hidden: !isVisible
                };
                
                // 如果节点有预设位置，固定它（防止物理引擎移动）
                if (op.x !== undefined && op.y !== undefined) {
                    newNode.x = op.x;
                    newNode.y = op.y;
                    newNode.fixed = { x: true, y: true };
                }
                
                nodes.add(newNode);
                
                // 如果是位置图的新节点，确保物理引擎和交互正常工作
                if (domain === 'location' && GRAPH_STORE.location && GRAPH_STORE.location.network) {
                    const network = GRAPH_STORE.location.network;
                    
                    // 确保物理引擎已启用（如果新节点没有固定位置，需要物理引擎布局）
                    if (!newNode.fixed) {
                        network.setOptions({
                            physics: { enabled: true }
                        });
                        
                        // 等待物理引擎稳定化后再确保交互正常
                        // 使用 stabilizationIterationsDone 事件来确保稳定化完成
                        const stabilizationHandler = function() {
                            network.off('stabilizationIterationsDone', stabilizationHandler);
                            
                            // 稳定化完成后，确保节点可以正常交互
                            // 获取节点当前位置（物理引擎已布局完成）
                            const positions = network.getPositions([op.id]);
                            if (positions[op.id]) {
                                const pos = positions[op.id];
                                // 更新节点位置，但不固定（允许后续拖拽）
                                nodes.update({
                                    id: op.id,
                                    x: pos.x,
                                    y: pos.y,
                                    fixed: { x: false, y: false }  // 不固定，允许拖拽
                                });
                            }
                            
                            // 触发网络重绘，确保新节点可见
                            network.redraw();
                        };
                        
                        // 监听稳定化完成事件
                        network.once('stabilizationIterationsDone', stabilizationHandler);
                        
                        // 如果稳定化已经完成（可能很快），设置一个备用超时
                        setTimeout(() => {
                            // 检查节点是否已经有位置
                            const positions = network.getPositions([op.id]);
                            if (positions[op.id]) {
                                const pos = positions[op.id];
                                const node = nodes.get(op.id);
                                // 如果节点还没有被更新过位置，更新它
                                if (!node.fixed || (node.fixed.x === false && node.fixed.y === false)) {
                                    nodes.update({
                                        id: op.id,
                                        x: pos.x,
                                        y: pos.y,
                                        fixed: { x: false, y: false }
                                    });
                                }
                            }
                            network.redraw();
                        }, 200);
                    } else {
                        // 如果节点已有固定位置，直接触发重绘
                        network.redraw();
                    }
                }
            }
        } else if (op.op === 'add_edge') {
            const exists = edges.get({ filter: e => e.from === op.from && e.to === op.to });
            if (exists.length === 0) {
                // 如果是位置图的edge，不显示label
                const edgeConfig = { from: op.from, to: op.to };
                if (domain === 'location') {
                    edgeConfig.label = '';  // 位置图不显示edge label
                } else {
                    edgeConfig.label = op.label;
                }
                edges.add(edgeConfig);
            }
        } else if (op.op === 'remove_node') {
            nodes.remove(op.id);
        }
    } catch (e) { console.warn("Op error", e); }
}

function getColorByDomain(domain) {
    // 冻京NECRO配色方案
    if (domain === 'location') {
        return {
            background: '#1a1a1a',
            border: '#4a9eff'  // 位置节点蓝色
        };
    }
    if (domain === 'inventory') {
        return {
            background: '#1a1a1a',
            border: '#d2a8ff'  // 物品节点紫色
        };
    }
    if (domain === 'narrative') {
        return {
            background: '#1a1a1a',
            border: '#ffcc00'  // 剧情节点警示黄
        };
    }
    return {
        background: '#1a1a1a',
        border: '#00ffcc'  // 默认荧光青
    };
}

// 更新位置节点的NPC信息（支持完整NPC数据）
// npcData 可以是对象，包含 {id, name, desc, occupation, personality, knows, spawn_narrative}
function updateLocationNpcMeta(locationId, npcId, npcName, npcDesc, spawnNarrative, npcData = null) {
    const node = GRAPH_STORE.location.nodes.get(locationId);
    if (!node) return;

    // 获取现有的 npcs 列表（优先使用标准化字段）
    let currentNpcs = node.npcs || [];
    
    // 向下兼容检查（如果旧数据存在但新数据不存在，则迁移）
    if (currentNpcs.length === 0 && node.npc_ids && node.npc_ids.length > 0) {
        currentNpcs = node.npc_ids.map((id, i) => ({
            id: id,
            name: (node.npc_names && node.npc_names[i]) || id,
            desc: (node.npc_descs && node.npc_descs[i]) || '',
            occupation: '',
            personality: '',
            knows: [],
            spawn_narrative: '',
            is_main_npc: false,
            specialty: null,
            background_story: null
        }));
    }

    // 检查是否已存在
    const existingIndex = currentNpcs.findIndex(n => n.id === npcId);
    
    if (existingIndex >= 0) {
        // 更新现有 NPC 信息
        if (npcName) currentNpcs[existingIndex].name = npcName;
        if (npcDesc) currentNpcs[existingIndex].desc = npcDesc;
        if (spawnNarrative) currentNpcs[existingIndex].spawn_narrative = spawnNarrative;
        // 如果提供了完整的npcData，更新额外字段
        if (npcData) {
            if (npcData.occupation) currentNpcs[existingIndex].occupation = npcData.occupation;
            if (npcData.personality) currentNpcs[existingIndex].personality = npcData.personality;
            if (npcData.knows) currentNpcs[existingIndex].knows = npcData.knows;
            if (npcData.is_main_npc !== undefined) currentNpcs[existingIndex].is_main_npc = Boolean(npcData.is_main_npc);
            if (npcData.specialty !== undefined) currentNpcs[existingIndex].specialty = npcData.specialty;
            if (npcData.background_story !== undefined) currentNpcs[existingIndex].background_story = npcData.background_story;
        }
    } else {
        // 添加新 NPC
        const newNpc = {
            id: npcId,
            name: npcName || npcId,
            desc: npcDesc || '',
            occupation: npcData?.occupation || '',
            personality: npcData?.personality || '',
            knows: npcData?.knows || [],
            spawn_narrative: spawnNarrative || '',
            is_main_npc: npcData?.is_main_npc !== undefined ? Boolean(npcData.is_main_npc) : false,
            specialty: (npcData?.is_main_npc === true && npcData?.specialty) ? npcData.specialty : null,
            background_story: (npcData?.is_main_npc === true && npcData?.background_story) ? npcData.background_story : null
        };
        currentNpcs.push(newNpc);
    }

    // 仅更新标准化的 npcs 字段，彻底移除旧字段
    GRAPH_STORE.location.nodes.update({
        id: locationId,
        npcs: currentNpcs,
        npc_ids: undefined,     // 清除旧字段
        npc_names: undefined,   // 清除旧字段
        npc_descs: undefined    // 清除旧字段
    });
}

function updateLocationClueMeta(locationId, clueId, holderType, holderId) {
    const node = GRAPH_STORE.location.nodes.get(locationId);
    if (!node || !clueId) return;

    const clueMap = { ...(node.clue_map || {}) };
    clueMap[clueId] = holderType === 'npc' && holderId ? holderId : 'noNPC';

    GRAPH_STORE.location.nodes.update({
        id: locationId,
        has_clue: true,
        clue_map: clueMap
    });
}

function highlightNodes() {
    const nodes = GRAPH_STORE.location.nodes;
    const updates = [];

    nodes.getIds().forEach(id => {
        // 冻京NECRO风格节点高亮
        let nodeColor = {
            background: '#1a1a1a',
            border: '#4a9eff'  // 默认位置节点蓝色
        };
        let size = 20;
        let borderWidth = 3;
        let shadowConfig = {
            enabled: true,
            color: 'rgba(74, 158, 255, 0.3)',
            size: 8
        };

        // 当前玩家位置 - 荧光青高亮
        if (id === gameState.currentLocationId) {
            nodeColor = {
                background: '#0a0a0a',
                border: '#00ffcc'  // 荧光青
            };
            size = 28;
            borderWidth = 4;
            shadowConfig = {
                enabled: true,
                color: 'rgba(0, 255, 204, 0.6)',
                size: 15
            };
        }
        
        // Boss位置 - 热粉色警告
        // Boss LLM已停用
        // if (id === bossAgent.locationId) {
        if (false && id === bossAgent.locationId) {
            if (id === gameState.currentLocationId) {
                // 玩家和Boss在同一位置 - 极度危险！
                nodeColor = {
                    background: '#1a0000',
                    border: '#ff0055'  // 热粉色
                };
                borderWidth = 6;
                size = 32;
                shadowConfig = {
                    enabled: true,
                    color: 'rgba(255, 0, 85, 0.8)',
                    size: 20
                };
            } else {
                // Boss在其他位置
                nodeColor = {
                    background: '#1a0a0a',
                    border: '#ff0055'  // 热粉色
                };
                size = 24;
                borderWidth = 4;
                shadowConfig = {
                    enabled: true,
                    color: 'rgba(255, 0, 85, 0.5)',
                    size: 12
                };
            }
        }

        updates.push({ 
            id, 
            color: nodeColor, 
            size, 
            borderWidth,
            shadow: shadowConfig
        });
    });
    nodes.update(updates);

    if (gameState.currentLocationId) {
        GRAPH_STORE.location.network.fit({ nodes: [gameState.currentLocationId], animation: true });
    }
}

// 输出当前地图图（Location）完整信息
function logCurrentMapGraph() {
    const nodes = GRAPH_STORE.location.nodes.get();
    const edges = GRAPH_STORE.location.edges.get();
    console.log("[MAP GRAPH] Location", { nodes, edges });
}



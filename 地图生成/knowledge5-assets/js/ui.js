// 10. UI 更新
function appendLog(html, type) {
    const box = document.getElementById('chat-history');
    if (!box) {
        console.warn('[UI] chat-history 元素不存在，无法添加日志');
        return;
    }
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerHTML = html;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// 更新玩家状态UI（包括信用点）
function updatePlayerStatusUI() {
    // 更新玩家状态文本
    const playerStatusEl = document.getElementById('player-status');
    if (playerStatusEl && gameState && gameState.playerStatus) {
        const physical = gameState.playerStatus.physical || ['健康'];
        const social = gameState.playerStatus.social || ['普通'];
        playerStatusEl.innerHTML = `
            身体: ${Array.isArray(physical) ? physical.join('、') : physical}<br>
            社会: ${Array.isArray(social) ? social.join('、') : social}
        `;
    }
    
    // 更新玩家信用点
    const playerMoneyValueEl = document.getElementById('player-money-value');
    if (playerMoneyValueEl && gameState && gameState.playerStatus) {
        const money = gameState.playerStatus.money || 0;
        playerMoneyValueEl.textContent = money.toLocaleString('zh-CN');
    }
}

// 更新可购买物品UI
function updateShopInventoryUI() {
    const container = document.getElementById('shop-inventory-container');
    if (!container) {
        console.log('[UI UPDATE] shop-inventory-container 不存在，跳过更新');
        return;
    }
    
    container.innerHTML = '';
    
    // 获取所有已保存的NPC商店数据
    const allShopData = gameState.npcShopInventory || {};
    const shopEntries = Object.entries(allShopData);
    
    if (shopEntries.length === 0) {
        container.innerHTML = '<div style="color:#666; font-style:italic; font-size:13px;">暂无可购买物品<br><span style="font-size:11px; color:#555;">与NPC交互并询问商品后，商品列表会显示在这里</span></div>';
        return;
    }
    
    // 优先显示当前位置NPC的商品，如果没有则显示所有NPC的商品
    let displayShops = [];
    const currentLocationNode = GRAPH_STORE.location.nodes.get().find(n => n.id === gameState.currentLocationId);
    
    if (currentLocationNode && currentLocationNode.npcs && currentLocationNode.npcs.length > 0) {
        // 优先显示当前位置NPC的商品
        const currentNPCIds = currentLocationNode.npcs.map(npc => npc.id);
        const currentShops = shopEntries.filter(([npcId]) => currentNPCIds.includes(npcId));
        const otherShops = shopEntries.filter(([npcId]) => !currentNPCIds.includes(npcId));
        displayShops = [...currentShops, ...otherShops];
    } else {
        // 如果没有当前位置NPC，显示所有商店
        displayShops = shopEntries;
    }
    
    // 遍历所有商店数据
    displayShops.forEach(([npcId, shopData], shopIndex) => {
        if (!shopData || !shopData.items || shopData.items.length === 0) {
            return; // 跳过没有商品的商店
        }
        
        // 显示NPC信息
        const npcInfoDiv = document.createElement('div');
        npcInfoDiv.style.cssText = `margin-top:${shopIndex > 0 ? '15px' : '0'}; margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #333;`;
        npcInfoDiv.innerHTML = `
            <div style="color:var(--primary-cyan, #00ffcc); font-weight:bold; font-size:14px;">${shopData.npc_info.name || npcId}</div>
            <div style="color:#888; font-size:12px; margin-top:2px;">${shopData.npc_info.occupation || '商人'}</div>
        `;
        container.appendChild(npcInfoDiv);
        
        // 显示可购买物品列表
        const itemsList = document.createElement('div');
        itemsList.style.cssText = 'display:flex; flex-direction:column; gap:4px;';
        
        shopData.items.forEach(item => {
            const itemDiv = document.createElement('div');
            
            // 获取当前游戏状态
            const gState = (typeof window !== 'undefined' && window.gameState) ? window.gameState : 
                          (typeof gameState !== 'undefined' ? gameState : null);
            
            // 根据should_sell决定样式和可点击性
            const sellStatus = item.should_sell ? '可购买' : '不可购买';
            const sellColor = item.should_sell ? 'var(--primary-cyan, #00ffcc)' : '#666';
            const priceColor = item.should_sell ? '#fff' : '#666';
            const currentMoney = gState && gState.playerStatus ? (gState.playerStatus.money || 0) : 0;
            const canPurchase = item.should_sell && currentMoney >= item.final_price;
            
            // 设置基础样式
            itemDiv.style.cssText = `padding:8px 10px; background:rgba(255,255,255,0.03); border:1px solid #333; border-radius:2px; font-size:13px; ${item.should_sell ? 'cursor:pointer; transition:all 0.2s;' : ''}`;
            
            // 如果可购买，添加悬停效果
            if (item.should_sell) {
                itemDiv.addEventListener('mouseenter', () => {
                    if (canPurchase) {
                        itemDiv.style.borderColor = 'var(--primary-cyan, #00ffcc)';
                        itemDiv.style.background = 'rgba(0,255,204,0.1)';
                    }
                });
                itemDiv.addEventListener('mouseleave', () => {
                    itemDiv.style.borderColor = '#333';
                    itemDiv.style.background = 'rgba(255,255,255,0.03)';
                });
                
                // 添加点击事件
                if (canPurchase) {
                    itemDiv.addEventListener('click', () => {
                        if (typeof handleItemPurchase === 'function') {
                            handleItemPurchase(item, shopData.npc_info, npcId);
                        } else {
                            console.warn('[UI] handleItemPurchase 函数未定义');
                        }
                    });
                } else {
                    itemDiv.style.opacity = '0.6';
                    itemDiv.style.cursor = 'not-allowed';
                }
            }
            
            itemDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="color:#ddd; font-weight:bold; font-size:14px;">${item.item_name}</span>
                    <span style="color:${sellColor}; font-size:11px; border:1px solid ${sellColor}; padding:2px 6px; border-radius:2px;">${sellStatus}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
                    <span style="color:#888;">基础: ${item.base_price} 信用点</span>
                    <span style="color:${priceColor}; font-weight:bold;">最终: ${item.final_price} 信用点</span>
                </div>
                ${item.price_modifier ? `<div style="color:#666; font-size:11px; margin-top:3px; font-style:italic;">${item.price_modifier}</div>` : ''}
                ${!item.should_sell && item.sell_reason ? `<div style="color:#ff0055; font-size:11px; margin-top:3px;">${item.sell_reason}</div>` : ''}
                ${item.should_sell && !canPurchase ? `<div style="color:#ff0055; font-size:11px; margin-top:3px;">信用点不足</div>` : ''}
            `;
            
            itemsList.appendChild(itemDiv);
        });
        
        container.appendChild(itemsList);
        
        // 显示更新时间
        const updateTimeDiv = document.createElement('div');
        updateTimeDiv.style.cssText = 'margin-top:8px; padding-top:8px; border-top:1px dashed #333; font-size:11px; color:#555; text-align:center;';
        const updateDate = new Date(shopData.last_updated);
        updateTimeDiv.textContent = `更新于: ${updateDate.toLocaleTimeString('zh-CN', { hour12: false })}`;
        container.appendChild(updateTimeDiv);
    });
}

function updateKeypointUI() {
    const container = document.getElementById('keypoint-list-container');
    
    // 如果容器不存在，直接返回（新UI中可能不需要这个功能）
    if (!container) {
        console.log('[UI UPDATE] keypoint-list-container 不存在，跳过更新');
        return;
    }
    
    container.innerHTML = '';
    
    // 检查必要的对象是否存在
    if (typeof ClueManager === 'undefined' || !gameState || !gameState.currentClueTrees) {
        console.warn('[UI UPDATE] ClueManager 或 gameState 未初始化，跳过更新');
        return;
    }
    
    // 显示当前侦探阶段
    const phase = ClueManager.getInvestigationPhase();
    const phaseDiv = document.createElement('div');
    phaseDiv.className = 'investigation-phase';
    phaseDiv.innerHTML = `📍 ${phase.name} | ${gameState.investigation.knownClues.length} 条线索`;
    container.appendChild(phaseDiv);
    
    // 获取所有可见线索（非unknown状态）
    const visibleClues = ClueManager.getVisibleClues(gameState.currentClueTrees);
    console.log(`[UI UPDATE] Found ${visibleClues.length} visible clues:`, visibleClues.map(c => `${c.id}(${c.status})`));
    
    if (visibleClues.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-investigation';
        emptyDiv.innerHTML = `
            <div>📋 调查笔记为空...</div>
            <div style="font-size:0.75rem; margin-top:5px;">尝试与当地人交谈或搜索环境</div>
        `;
        container.appendChild(emptyDiv);
        return;
    }
    
    // 按发现顺序排序（最新的在前）
    const sortedClues = [...visibleClues].sort((a, b) => {
        const logA = gameState.investigation.clueDiscoveryLog.find(l => l.clueId === a.id);
        const logB = gameState.investigation.clueDiscoveryLog.find(l => l.clueId === b.id);
        return (logB?.turn || 0) - (logA?.turn || 0);
    });
    
    sortedClues.forEach(clue => {
        const div = document.createElement('div');
        const indent = clue.depth * 12;
        
        // 根据状态设置图标和样式
        let icon = '❓';
        let statusClass = 'clue-rumored';
        
        switch(clue.status) {
            case 'rumored':
                icon = '👂';
                statusClass = 'clue-rumored';
                break;
            case 'hinted':
                icon = '🔍';
                statusClass = 'clue-hinted';
                break;
            case 'found':
                icon = '📄';
                statusClass = 'clue-found';
                break;
            case 'verified':
                icon = '✅';
                statusClass = 'clue-verified';
                break;
        }
        
        div.className = `keypoint-item ${statusClass}`;
        div.style.marginLeft = `${indent}px`;
        div.style.fontSize = clue.depth === 0 ? '0.85rem' : '0.8rem';
        
        // 显示名称（rumored状态显示???）
        const displayName = clue.status === 'rumored' ? '???' : clue.name;
        
        div.innerHTML = `
            <span class="clue-icon">${icon}</span>
            <span class="clue-name" title="${clue.desc || ''}">${displayName}</span>
            ${clue.childrenProgress ? `<span class="clue-progress">${clue.childrenProgress}</span>` : ''}
        `;
        
        container.appendChild(div);
    });
    
    // 显示已验证的根节点数量
    const verifiedRoots = ClueManager.getVerifiedRootCount(gameState.currentClueTrees);
    const requiredCount = STAGE_CONFIG[gameState.currentStage].required_count;
    if (verifiedRoots > 0) {
        const progressDiv = document.createElement('div');
        progressDiv.style.cssText = 'margin-top: 10px; padding: 5px; border-top: 1px solid #333; font-size: 0.75rem; color: #888; text-align: center;';
        progressDiv.innerHTML = `核心数据: ${verifiedRoots}/${requiredCount} 已整合`;
        container.appendChild(progressDiv);
    }
}

function toggleInputs(enabled) {
    const playerInput = document.getElementById('player-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (playerInput) {
        playerInput.disabled = !enabled;
        if (enabled) playerInput.focus();
    }
    
    if (sendBtn) {
        sendBtn.disabled = !enabled;
    }
}

// ===== LLM 控制台 =====
const LLM_CONSOLE_MAX_ENTRIES = 30;

function setLlmConsoleTab(tabId) {
    const tabs = document.querySelectorAll('.llm-console-tab');
    const pages = document.querySelectorAll('.llm-console-page');
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.consoleTab === tabId);
    });
    pages.forEach(page => {
        page.classList.toggle('active', page.dataset.consolePage === tabId);
    });
}

function toggleLlmConsole(show) {
    const consoleEl = document.getElementById('llm-console');
    if (!consoleEl) return;
    const shouldShow = typeof show === 'boolean' ? show : consoleEl.classList.contains('hidden');
    consoleEl.classList.toggle('hidden', !shouldShow);
}

function appendConsoleEntry(containerId, text) {
    const container = document.getElementById(containerId);
    if (!container || !text) return;
    const entry = document.createElement('pre');
    entry.className = 'llm-console-entry';
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}]\n${text}`;
    container.appendChild(entry);
    while (container.children.length > LLM_CONSOLE_MAX_ENTRIES) {
        container.removeChild(container.firstChild);
    }
    container.scrollTop = container.scrollHeight;
}

function logLlmConsole(tabId, channel, text) {
    appendConsoleEntry(`console-${tabId}-${channel}`, text);
}

function logLlmConsoleInput(tabId, role, text) {
    appendConsoleEntry(`console-${tabId}-${role}-input`, text);
}

function initLlmConsole() {
    const consoleEl = document.getElementById('llm-console');
    if (!consoleEl) return;

    const toggleBtn = document.getElementById('llm-console-toggle');
    const closeBtn = document.getElementById('llm-console-close');
    if (toggleBtn) toggleBtn.addEventListener('click', () => toggleLlmConsole());
    if (closeBtn) closeBtn.addEventListener('click', () => toggleLlmConsole(false));

    document.querySelectorAll('.llm-console-tab').forEach(tab => {
        tab.addEventListener('click', () => setLlmConsoleTab(tab.dataset.consoleTab));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && typeof toggleLlmConsole === 'function') {
            toggleLlmConsole(false);
        }
    });

    setLlmConsoleTab('main');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLlmConsole);
} else {
    initLlmConsole();
}

// 地图节点信息显示
function showMapNodeInfo(node) {
    const panel = document.getElementById('map-info-panel');
    const content = document.getElementById('map-info-content');
    if (!panel || !content) return;

    panel.style.display = 'block';
    
    // Node Basic Info
    let html = `<div style="color:var(--loc-color, #4a9eff); font-weight:bold; font-size:0.9rem;">${node.label}</div>`;
    html += `<div style="color:#666; font-size:0.7rem; margin-bottom:5px;">ID: ${node.id}</div>`;
    html += `<div style="margin-bottom:8px; line-height:1.2;">${node.title || '暂无描述'}</div>`;

    // NPCs
    if (node.npc_ids && node.npc_ids.length > 0) {
        html += `<div style="border-top:1px dashed #444; margin-top:5px; padding-top:5px;">`;
        html += `<div style="font-weight:bold; color:var(--npc-color, #ff9900); font-size:0.8rem;">👥 区域人物</div>`;
        
        const stageConfig = STAGE_CONFIG[gameState.currentStage];
        
        node.npc_ids.forEach(npcId => {
            const npc = stageConfig?.npcs?.find(n => n.id === npcId);
            if (npc) {
                const isTrust = (gameState.investigation?.npcInteractions?.[npcId]?.trust || 0) >= npc.trust_threshold;
                const trustColor = isTrust ? '#4aff4a' : '#aaa';
                
                html += `
                <div style="margin-top:4px; padding:3px; background:rgba(255,255,255,0.05); border-radius:3px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:#ddd; font-weight:bold;">${npc.name}</span>
                        <span style="font-size:0.6rem; color:${trustColor}; border:1px solid ${trustColor}; padding:0 3px; border-radius:3px;">
                            ${isTrust ? 'TRUSTED' : 'CAUTION'}
                        </span>
                    </div>
                    <div style="font-size:0.75em; color:#888; margin-top:2px;">${npc.desc || ''}</div>
                </div>`;
            } else {
                 html += `<div style="font-size:0.8em; color:#666;">未知人物 (${npcId})</div>`;
            }
        });
        html += `</div>`;
    } else {
        html += `<div style="margin-top:5px; font-style:italic; color:#555; font-size:0.75rem;">无相关人员活动</div>`;
    }
    
    // 如果有线索分布（可选显示）
    if (node.has_clue && node.clue_map) {
         html += `<div style="border-top:1px dashed #444; margin-top:5px; padding-top:5px;">`;
         html += `<div style="font-weight:bold; color:var(--item-color, #d2a8ff); font-size:0.8rem;">🔍 潜在迹象</div>`;
         const count = Object.keys(node.clue_map).length;
         html += `<div style="font-size:0.75em; color:#aaa;">侦测到 ${count} 处异常反应...</div>`;
         html += `</div>`;
    }

    // 显示当前 keypoint_trees
    if (gameState.currentClueTrees && gameState.currentClueTrees.length > 0) {
        html += `<div style="border-top:1px dashed #444; margin-top:5px; padding-top:5px;">`;
        html += `<div style="font-weight:bold; color:var(--narrative-color, #ffcc00); font-size:0.8rem;">📋 当前线索树</div>`;
        
        // 递归渲染线索树
        function renderClueTree(clueNode, depth = 0) {
            const indent = depth * 12;
            const indentStyle = `margin-left:${indent}px;`;
            
            // 状态图标和颜色
            let statusIcon = '❓';
            let statusColor = '#666';
            let statusText = '';
            
            switch(clueNode.status) {
                case 'unknown':
                    statusIcon = '❓';
                    statusColor = '#666';
                    statusText = 'UNKNOWN';
                    break;
                case 'rumored':
                    statusIcon = '👂';
                    statusColor = '#ffaa00';
                    statusText = 'RUMORED';
                    break;
                case 'hinted':
                    statusIcon = '🔍';
                    statusColor = '#ffcc00';
                    statusText = 'HINTED';
                    break;
                case 'found':
                    statusIcon = '📄';
                    statusColor = '#4aff4a';
                    statusText = 'FOUND';
                    break;
                case 'verified':
                    statusIcon = '✅';
                    statusColor = '#00ffcc';
                    statusText = 'VERIFIED';
                    break;
            }
            
            // 显示名称（unknown状态显示???）
            const displayName = clueNode.status === 'unknown' ? '???' : clueNode.name;
            
            // 显示可提示状态
            const hintableBadge = clueNode.hintable ? 
                `<span style="font-size:0.6rem; color:#d2a8ff; border:1px solid #d2a8ff; padding:0 3px; border-radius:3px; margin-left:5px;">HINTABLE</span>` : '';
            
            html += `
                <div style="${indentStyle} margin-top:3px; padding:3px; background:rgba(255,255,255,0.03); border-radius:3px;">
                    <div style="display:flex; align-items:center; flex-wrap:wrap;">
                        <span style="margin-right:5px;">${statusIcon}</span>
                        <span style="color:#ddd; font-weight:${depth === 0 ? 'bold' : 'normal'}; font-size:${depth === 0 ? '0.85rem' : '0.8rem'};">${displayName}</span>
                        <span style="font-size:0.6rem; color:${statusColor}; margin-left:5px;">${statusText}</span>
                        ${hintableBadge}
                    </div>
                    ${clueNode.desc ? `<div style="font-size:0.7em; color:#888; margin-top:2px; margin-left:20px;">${clueNode.desc}</div>` : ''}
                    ${clueNode.location_hint ? `<div style="font-size:0.65em; color:#666; margin-top:1px; margin-left:20px; font-style:italic;">📍 ${clueNode.location_hint}</div>` : ''}
                </div>
            `;
            
            // 递归渲染子节点
            if (clueNode.children && clueNode.children.length > 0) {
                clueNode.children.forEach(child => {
                    renderClueTree(child, depth + 1);
                });
            }
        }
        
        gameState.currentClueTrees.forEach(root => {
            renderClueTree(root, 0);
        });
        
        html += `</div>`;
    }

    content.innerHTML = html;
}

// 绑定关闭按钮
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-map-info');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('map-info-panel').style.display = 'none';
        });
    }
});

// 处理物品购买
function handleItemPurchase(item, npcInfo, npcId) {
    // 获取当前游戏状态
    const gState = (typeof window !== 'undefined' && window.gameState) ? window.gameState : 
                   (typeof gameState !== 'undefined' ? gameState : null);
    
    if (!gState) {
        appendLog(`[购买失败] 游戏状态未初始化`, 'system', 'color: #ff0055; border-left: 3px solid #ff0055; padding-left: 8px;');
        return;
    }
    
    // 检查信用点是否足够
    const currentMoney = gState.playerStatus.money || 0;
    const itemPrice = item.final_price || item.base_price || 0;
    
    if (currentMoney < itemPrice) {
        appendLog(`[购买失败] 信用点不足！需要 ${itemPrice} 信用点，当前只有 ${currentMoney} 信用点。`, 'system', 'color: #ff0055; border-left: 3px solid #ff0055; padding-left: 8px;');
        return;
    }
    
    // 确认购买
    const confirmMessage = `确定购买 "${item.item_name}" 吗？\n价格: ${itemPrice} 信用点\n当前信用点: ${currentMoney} 信用点`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // 获取 ItemFilterLLM 实例
    const itemFilter = (typeof window !== 'undefined' && window.itemFilterLLMInstance) 
        ? window.itemFilterLLMInstance 
        : null;
    
    if (!itemFilter || typeof itemFilter.executePurchase !== 'function') {
        // 如果没有 ItemFilterLLM 实例，直接手动处理购买
        handleDirectPurchase(item, npcInfo, npcId);
        return;
    }
    
    // 准备购买数据
    const purchaseItems = [{
        item_id: item.item_id,
        item_name: item.item_name,
        base_price: item.base_price,
        final_price: item.final_price,
        price_modifier: item.price_modifier,
        quantity: 1
    }];
    
    const playerStatus = {
        money: currentMoney,
        physical: gState.playerStatus.physical || ['健康'],
        social: gState.playerStatus.social || ['普通']
    };
    
    // 执行购买
    try {
        itemFilter.executePurchase(purchaseItems, npcInfo, playerStatus);
        
        // 更新UI
        updatePlayerStatusUI();
        updateShopInventoryUI();
        
        // 更新物品栏显示
        updateInventoryGrid();
        
        // 显示购买成功消息
        appendLog(`[购买成功] 已购买 "${item.item_name}"，花费 ${itemPrice} 信用点。剩余信用点: ${gState.playerStatus.money}`, 'system', 'color: #4CAF50; border-left: 3px solid #4CAF50; padding-left: 8px;');
        
    } catch (error) {
        console.error('[购买错误]', error);
        appendLog(`[购买失败] 发生错误: ${error.message}`, 'system', 'color: #ff0055; border-left: 3px solid #ff0055; padding-left: 8px;');
    }
}

// 直接处理购买（不使用 ItemFilterLLM）
function handleDirectPurchase(item, npcInfo, npcId) {
    // 获取当前游戏状态
    const gState = (typeof window !== 'undefined' && window.gameState) ? window.gameState : 
                   (typeof gameState !== 'undefined' ? gameState : null);
    
    if (!gState) {
        appendLog(`[购买失败] 游戏状态未初始化`, 'system', 'color: #ff0055; border-left: 3px solid #ff0055; padding-left: 8px;');
        return;
    }
    
    const currentMoney = gState.playerStatus.money || 0;
    const itemPrice = item.final_price || item.base_price || 0;
    
    if (currentMoney < itemPrice) {
        appendLog(`[购买失败] 信用点不足！`, 'system', 'color: #ff0055; border-left: 3px solid #ff0055; padding-left: 8px;');
        return;
    }
    
    // 扣除信用点
    if (typeof PlayerStatusManager !== 'undefined') {
        PlayerStatusManager.updateMoney(-itemPrice, 'subtract');
    } else {
        gState.playerStatus.money = Math.max(0, currentMoney - itemPrice);
    }
    
    // 添加到物品列表
    if (typeof InventoryManager !== 'undefined') {
        InventoryManager.addItem({
            id: item.item_id,
            name: item.item_name,
            desc: item.desc || '',
            type: 'purchased',
            source: 'purchase',
            quantity: 1,
            npc_id: npcId,
            npc_name: npcInfo.name || '未知商人',
            price: itemPrice,
            turn: gState.turnNumber || 0,
            metadata: {
                base_price: item.base_price,
                final_price: item.final_price,
                price_modifier: item.price_modifier
            }
        });
    }
    
    // 记录购买历史
    if (!gState.purchaseHistory) {
        gState.purchaseHistory = { records: [], totalSpent: 0, purchaseCount: 0 };
    }
    gState.purchaseHistory.records.push({
        item_id: item.item_id,
        item_name: item.item_name,
        quantity: 1,
        price: item.base_price || 0,
        final_price: itemPrice,
        npc_id: npcId,
        npc_name: npcInfo.name || '未知商人',
        npc_occupation: npcInfo.occupation || '',
        turn: gState.turnNumber || 0,
        timestamp: Date.now()
    });
    gState.purchaseHistory.totalSpent += itemPrice;
    gState.purchaseHistory.purchaseCount += 1;
    
    // 更新UI
    updatePlayerStatusUI();
    updateShopInventoryUI();
    
    // 更新物品栏显示
    updateInventoryGrid();
    
    // 显示购买成功消息
    appendLog(`[购买成功] 已购买 "${item.item_name}"，花费 ${itemPrice} 信用点。剩余信用点: ${gState.playerStatus.money}`, 'system', 'color: #4CAF50; border-left: 3px solid #4CAF50; padding-left: 8px;');
}

// 更新物品栏显示
function updateInventoryGrid() {
    const invGrid = document.getElementById('inventory-grid');
    if (invGrid) {
        try {
            const gState = (typeof window !== 'undefined' && window.gameState) ? window.gameState : 
                          (typeof gameState !== 'undefined' ? gameState : null);
            const invMgr = (typeof window !== 'undefined' && window.InventoryManager) ? window.InventoryManager : null;
            const items = invMgr ? invMgr.getAllItems() : ((gState && gState.playerInventory) ? gState.playerInventory : []);
            
            invGrid.innerHTML = '';
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'inv-item active';
                const displayText = item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name;
                itemDiv.textContent = displayText;
                itemDiv.title = item.desc || item.name;
                invGrid.appendChild(itemDiv);
            });
            
            // 填充空位
            const emptySlots = 18 - items.length;
            for (let i = 0; i < emptySlots; i++) {
                const empty = document.createElement('div');
                empty.className = 'inv-item';
                invGrid.appendChild(empty);
            }
        } catch (e) {
            console.warn('[UI] 更新物品栏失败:', e);
        }
    }
}

window.logLlmConsole = logLlmConsole;
window.logLlmConsoleInput = logLlmConsoleInput;
window.toggleLlmConsole = toggleLlmConsole;
window.showMapNodeInfo = showMapNodeInfo;
window.updateShopInventoryUI = updateShopInventoryUI;
window.updatePlayerStatusUI = updatePlayerStatusUI;
window.handleItemPurchase = handleItemPurchase;
window.updateInventoryGrid = updateInventoryGrid;

// 3. 线索系统
const ClueManager = {
    // 根据 ID 查找节点
    findNodeById(trees, id) {
        let result = null;
        function traverse(node) {
            if (node.id === id) { result = node; return; }
            if (node.children) node.children.forEach(child => traverse(child));
        }
        trees.forEach(root => traverse(root));
        return result;
    },

    // 获取玩家当前可见的线索（用于UI渲染）- 只显示非unknown状态的
    getVisibleClues(trees) {
        let visible = [];
        
        function traverse(node, depth) {
            // 只有非 unknown 状态的才可见
            if (node.status !== 'unknown') {
                visible.push({
                    id: node.id,
                    name: node.status === 'rumored' ? '???' : node.name,
                    desc: node.status === 'rumored' ? '有传闻提到...' : node.desc,
                    status: node.status,
                    depth: depth,
                    hasChildren: node.children && node.children.length > 0,
                    childrenProgress: node.children && node.children.length > 0 ? 
                        `${node.children.filter(c => c.status === 'verified').length}/${node.children.length}` : null
                });
            }
            
            // 无论当前节点是否可见，都要递归遍历子节点
            if (node.children) {
                node.children.forEach(child => traverse(child, depth + 1));
            }
        }
        
        trees.forEach(root => traverse(root, 0));
        return visible;
    },
    
    // 获取所有可被发现的线索（供LLM判定）
    getDiscoverableClues(trees, playerKnownClues) {
        let discoverable = [];
        
        function traverse(node) {
            // 已验证的不再需要发现
            if (node.status === 'verified') return;
            
            // 检查前置条件
            const prereqsMet = !node.prerequisites || node.prerequisites.length === 0 ||
                node.prerequisites.every(prereq => playerKnownClues.includes(prereq));
            
            discoverable.push({
                id: node.id,
                name: node.name,
                desc: node.desc,
                status: node.status,
                hintable: Boolean(node.hintable),
                location_hint: node.location_hint,
                search_difficulty: node.search_difficulty,
                prerequisites: node.prerequisites || [],
                prereqs_met: prereqsMet,
                discovery_conditions: node.discovery_conditions
            });
            
            if (node.children) node.children.forEach(traverse);
        }
        
        trees.forEach(root => traverse(root));
        return discoverable;
    },
    
    // 检查线索是否可被发现（基于前置条件）
    canDiscover(trees, clueId, playerKnownClues) {
        const node = this.findNodeById(trees, clueId);
        if (!node) return false;
        
        if (node.prerequisites && node.prerequisites.length > 0) {
            return node.prerequisites.every(prereq => playerKnownClues.includes(prereq));
        }
        return true;
    },
    
    // 获取可以给LLM的线索提示（排除已提及的）
    getClueHintsForLLM(trees, alreadyMentioned) {
        let hints = [];
        
        function traverse(node) {
            // 只提供 hintable=true 的线索
            if (node.hintable && !alreadyMentioned.includes(node.id)) {
                hints.push({
                    id: node.id,
                    name: node.name,
                    status: node.status,
                    location_hint: node.location_hint
                });
            }
            if (node.children) node.children.forEach(traverse);
        }
        
        trees.forEach(traverse);
        return hints;
    },

    // 【重构】更新节点状态 - 由语义LLM调用
    // 规则：
    // 1. 叶子节点被发现时直接设为 verified
    // 2. 父节点只有当所有子节点都为 verified 时才自动变为 rumored
    updateStatus(trees, id, newStatus) {
        const target = this.findNodeById(trees, id);
        if (!target) return [];

        const oldStatus = target.status;
        
        // 【规则】叶子节点被发现后直接设为 verified
        const isLeaf = !target.children || target.children.length === 0;
        if (isLeaf && (newStatus === 'found' || newStatus === 'hinted')) {
            // 叶子节点如果被标记为 found/hinted，直接升级为 verified
            target.status = 'verified';
            console.log(`[CLUE SYSTEM] Leaf node ${target.name} found -> verified`);
        } else {
            target.status = newStatus;
        }
        
        let updates = [{ node: target, oldStatus, newStatus: target.status }];

        // 【规则】检查父节点是否满足解锁条件
        // 只有当所有子节点都为 verified 时，父节点才变为 rumored
        let changed = true;
        while(changed) {
            changed = false;
            const checkParents = (node) => {
                if (!node.children || node.children.length === 0) return;
                
                // 如果父节点已经不是 unknown，不再自动更新
                if (node.status !== 'unknown') return;

                const allChildrenVerified = node.children.every(
                    child => child.status === 'verified'
                );

                if (allChildrenVerified) {
                    const oldSt = node.status;
                    node.status = 'rumored';
                    updates.push({ node, oldStatus: oldSt, newStatus: 'rumored' });
                    changed = true;
                    console.log(`[CLUE SYSTEM] Parent Unlocked: ${node.name} -> rumored (all children verified)`);
                }

                node.children.forEach(child => checkParents(child));
            };

            trees.forEach(root => checkParents(root));
        }

        return updates;
    },
    
    // 记录线索发现
    recordDiscovery(clueId, method, location) {
        gameState.investigation.clueDiscoveryLog.push({
            clueId,
            method,  // 'search', 'npc_dialog', 'observation', 'deduction'
            location,
            turn: gameState.turnNumber,
            timestamp: Date.now()
        });
        
        if (!gameState.investigation.knownClues.includes(clueId)) {
            gameState.investigation.knownClues.push(clueId);
        }
    },

    // 获取已完成的根节点数量
    getVerifiedRootCount(trees) {
        return trees.filter(root => root.status === 'verified').length;
    },

    // 【重构】判定节点是否可以被提示 (hintable)
    // 规则：
    // 1. status 为 rumored/hinted 之一（found/verified 已完成，不需要提示）
    // 2. 如果 status 是 hinted，需要检查所在 location_graph 节点 is_visible=true
    //    （rumored 状态的传闻不受地点可见性限制）
    // 3. 如果是父节点，所有子节点必须为 verified
    isHintable(node) {
        if (!node) return false;
        
        // 规则1：status 必须为 rumored/hinted（found/verified 已完成，不需要再提示）
        const validStatuses = ['rumored', 'hinted'];
        if (!validStatuses.includes(node.status)) {
            return false;
        }
        
        // 规则2：检查 location_graph 中对应节点的 is_visible
        // 查找包含此线索的地点节点
        const locationNodes = GRAPH_STORE.location.nodes.get();
        let isInVisibleLocation = false;
        
        for (const locNode of locationNodes) {
            // 检查该地点是否包含此线索
            const clueMap = locNode.clue_map || {};
            if (clueMap[node.id] !== undefined || locNode.clue_id === node.id) {
                // 检查该地点是否可见
                if (locNode.is_visible !== false) {
                    isInVisibleLocation = true;
                    break;
                }
            }
        }
        
        // 如果线索还没有被分配到任何地点，也允许（由WorldGen分配时会设置）
        // 这里我们假设如果没有找到对应的地点，说明线索还未被分配，暂时不可提示
        // 但如果线索的 status 已经是非 unknown，说明已经被揭示过，可以继续提示
        if (!isInVisibleLocation && node.status === 'rumored') {
            // 对于 rumored 状态的线索，如果还没在可见地点中，仍然允许提示
            // 因为可能是通过NPC对话获得的传闻
            isInVisibleLocation = true;
        }
        
        if (!isInVisibleLocation) {
            return false;
        }
        
        // 规则4：如果是父节点，所有子节点必须为 verified
        if (node.children && node.children.length > 0) {
            const allChildrenVerified = node.children.every(
                child => child.status === 'verified'
            );
            if (!allChildrenVerified) {
                return false;
            }
        }
        
        return true;
    },

    // 【重构】更新线索树中所有节点的hintable状态
    updateHintableStatus(trees) {
        function traverse(node) {
            // 更新当前节点的hintable状态
            node.hintable = ClueManager.isHintable(node);
            
            // 递归更新子节点
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => traverse(child));
            }
        }
        
        trees.forEach(root => traverse(root));
    },
    
    // 获取调查阶段
    getInvestigationPhase() {
        const count = gameState.investigation.knownClues.length;
        if (count === 0) return { phase: 'A', name: '盲目探索期', desc: '广泛搜查获取入口线索' };
        if (count <= 3) return { phase: 'B', name: '定向搜索期', desc: '根据已知线索定向搜索' };
        return { phase: 'C', name: '推理验证期', desc: '整合线索进行推理' };
    },

    // 获取所有已知线索（用于展示和判断）
    getAllKnownClues(trees) {
        let known = [];
        function traverse(node) {
            if (node.status !== 'unknown') {
                known.push(node);
            }
            if(node.children) node.children.forEach(c => traverse(c));
        }
        trees.forEach(r => traverse(r));
        return known;
    },
    
    // 获取所有已验证的线索
    getAllVerifiedClues(trees) {
        let verified = [];
        function traverse(node) {
            if (node.status === 'verified') {
                verified.push(node);
            }
            if(node.children) node.children.forEach(c => traverse(c));
        }
        trees.forEach(r => traverse(r));
        return verified;
    },
    
    // 【兼容旧API】获取所有已找到的物理证据
    getAllFoundClues(trees) {
        // 现在 found 和 verified 都算已找到
        let found = [];
        function traverse(node) {
            if (node.status === 'found' || node.status === 'verified') {
                found.push(node);
            }
            if(node.children) node.children.forEach(c => traverse(c));
        }
        trees.forEach(r => traverse(r));
        return found;
    }
};

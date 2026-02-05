// 🟢 敌方角色资料库 (从文档中提取)
const CHARACTER_PROFILES = {
    "HimuroRinne": {
        name: "氷室 凛音 (Himuro Rinne)",
        desc: "私立樱羽学园学生会副会长，操纵冰结律法的冷酷大小姐。",
        imageUrl: "./web-project/public/栩.jpg",
        personality: `
            1. 像冰晶般纯粹而坚硬，在规则与秩序中寻求极致的正确。
            2. 说话言简意赅，如冰棱般锐利，总能一针见血指出逻辑谬误。
            3. 对"失序"和"暧昧"有近乎洁癖的排斥。
            4. 内心深处有极致的脆弱，渴望有人能理解她严苛背后的善意。
        `,
        magicStyle: `
            1. 核心概念：冰结律法 (Frozen Ordinance)。不仅是冰冻，而是将"秩序"具现化，将"混沌"强制凝固。
            2. 擅长使用"极寒之戒"作为媒介，施加无法抗拒的束缚与凝固。
            3. 战斗风格：静态、压倒性、强制力。不进行野蛮的肉搏，而是优雅地降下裁决。
        `,
        moves: [
            { id: "ice_lance_1", name: "氷结断罪・一之枪", type: "攻击/贯穿", effect: "凝聚大气水分形成亚音速射出的高压冰之弹头，追求极致的单点物理贯穿力。", restriction: "直线攻击，弹道单一。" },
            { id: "law_rain", name: "法则之雨・冰晶连射", type: "范围/压制", effect: "如暴雨般降下数百枚手术刀般的微小冰晶，进行大范围覆盖或单点凌迟。", restriction: "消耗中等。" },
            { id: "frost_fang", name: "无赦之槛・霜牙穿刺", type: "陷阱/突袭", effect: "将极寒魔力灌入地面，在指定区域瞬间暴起无数鲨鱼齿状的冰刺。", restriction: "需要地面接触。" },
            { id: "snowflake_shield", name: "秩序之壁・六花之盾", type: "防御/反击", effect: "制造三面雪花结晶冰盾。破碎瞬间会爆散成追踪冰片反击攻击者。", restriction: "防御上限取决于魔力输出。" },
            { id: "absolute_zero_breath", name: "绝对零度・深冻之息", type: "破防/概念", effect: "呼出绝对零度寒气，使魔术屏障或物理护甲结构脆化，一触即碎。", restriction: "射程较短。" },
            { id: "ice_wolf", name: "极寒追踪者・冰狼之牙", type: "召唤/追猎", effect: "创造拥有自主意识的冰之猎狼进行不死不休的追猎。", restriction: "冰狼智力有限。" },
            { id: "frozen_ordinance", name: "冰结律法・概念冻结", type: "控制/特殊", effect: "暂时冻结目标某个简单的'概念'（如平衡感），使其思维或行动产生逻辑断层。", restriction: "无法冻结核心概念。" },
            { id: "eternal_ice_prison", name: "秘奥义・永恒冰狱", type: "终极/对界", effect: "强制修改局部法则，将目标的'存在'本身封冻在虚无的时间点中。", restriction: "极大消耗，使用后情感冻结。" }
        ]
    },
    "Saber": {
        name: "Saber",
        desc: "标准的剑之骑士。",
        imageUrl: "https://placehold.co/300x400/450a0a/fbbf24?text=Saber",
        personality: "正直、骑士道精神。",
        magicStyle: "强力的对魔力，优秀的近战能力，光炮宝具。",
        moves: [
            { id: "strike", name: "魔力放出・斩", type: "攻击", effect: "附带高浓度魔力的重斩。", restriction: "近距离。" },
            { id: "excalibur", name: "Excalibur", type: "终极", effect: "誓约胜利之剑。", restriction: "极大消耗。" }
        ]
    }
};

    // 🟢 用户角色配置 (默认：白鸟遥)
let USER_CHARACTER_PROFILE = {
    name: "白鸟遥 (Shiratori Haruka)",
    desc: "冷静的优等生，拥有观测因果的魔眼，擅长天体/水晶魔术。",
    personality: `
        1. 冷静理智，擅长观察与分析。
        2. 拥有因果透视的魔眼，能预见攻击轨迹。
        3. 战斗风格优雅而精准，如同星辰运行般井然有序。
    `,
    magicStyle: `
        1. 核心概念：天体水晶魔术 (Astral Crystal Magic)。
        2. 通过操纵光的折射与能量束，进行远程精准打击。
        3. 战斗风格：高机动、精准打击、战术布局。
    `,
    moves: [
        { "id": "vega_arrow", "name": "织星贯流 (Vega Arrow)", "type": "攻击", "effect": "施放一束极高速、高密度、不可折射的能量光束，精准锁定目标并贯穿防御。", "restriction": "消耗低，由于速度接近光速，敌方难以物理闪避。" },
        { "id": "vega_prism_net", "name": "织星折光网 (Vega Prism Net)", "type": "防御/陷阱", "effect": "布置多枚水晶节点形成折射网。既可自动拦截敌方攻击，也可让己方光束不断弹跳变轨。", "restriction": "需要预先布置节点，适合阵地战。" },
        { "id": "vega_singularity", "name": "织星破界 (Vega Singularity)", "type": "终极/必杀", "effect": "将所有织星水晶能量聚合一点，释放接近光速的恒星爆发射线，贯穿任意防御。", "restriction": "【警告】施法后无法追加动作，短时间内魔力耗尽。" },
        { "id": "lunar_eclipse_flash", "name": "影月瞬斩 (Lunar Eclipse Flash)", "type": "近战/暗杀", "effect": "以纯粹影之力凝聚刃光，一瞬间完成多次超高速斩击。斩击轨迹延迟显现，无视护盾。", "restriction": "需在低光照或新月黑域环境下发动效果最佳。" },
        { "id": "causality_vision", "name": "魔眼：因果透视", "type": "辅助/闪避", "effect": "观察24小时内的因果线，看到攻击的源头与必然走向，提前规避。", "restriction": "若过度解析，大脑会产生信息超载，短暂失去现实感。" }
    ]
};

let battleDatabase = {};
let currentClass = "HimuroRinne";
let activeMoves = [...USER_CHARACTER_PROFILE.moves];
let currentSelectedMove = null;
let disabledMoves = {}; // 存储被禁用的招式：{ moveId: { disabledUntilTurn: number, reason: string } }

// 🩸 隐形伤害系统
let userHealth = 5;  // 玩家健康值（可承受5次重创）
let aiHealth = 5;    // AI健康值（可承受5次重创）
const MAX_HEALTH = 5;

window.onload = function() {
    // 尝试从选择框获取，如果没有则使用默认值
    const aiClassSelect = document.getElementById('aiClass');
    if (aiClassSelect) {
        currentClass = aiClassSelect.value;
    } else {
        currentClass = currentClass || "HimuroRinne";
    }
    ensureClassDataExists(currentClass);
    renderMoveList();
    refreshUI();
    updateHealthIndicator(); // 🩸 初始化健康指示器
};

function ensureClassDataExists(className) {
    if (!battleDatabase[className]) {
        battleDatabase[className] = [];
    }
}

function renderMoveList() {
    const container = document.getElementById('moveListContainer');
    container.innerHTML = '';
    currentSelectedMove = null;
    updateMoveDetailUI();

    const currentTurn = battleDatabase[currentClass]?.length || 0;

    activeMoves.forEach((move, index) => {
        const btn = document.createElement('div');
        
        // 🚫 检查招式是否被禁用
        const moveId = move.id;
        const disabledInfo = disabledMoves[moveId];
        const isDisabled = disabledInfo && disabledInfo.disabledUntilTurn > currentTurn;
        
        // 🔮 区分动态招式和基础招式的样式
        let cardClass = "move-card p-3 rounded flex justify-between items-center";
        if (isDisabled) {
            cardClass += " opacity-40 cursor-not-allowed border-red-600/30 bg-gray-800/50";
        } else if (move.isDynamic) {
            cardClass += " border-yellow-600/50 bg-gradient-to-r from-yellow-900/20 to-transparent";
        }
        
        btn.className = cardClass;
        
        // 🚫 禁用的招式不可点击，但添加提示
        if (isDisabled) {
            const remainingTurns = disabledInfo.disabledUntilTurn - currentTurn;
            btn.title = `🔒 该招式已被封印\n原因：${disabledInfo.reason}\n剩余回合：${remainingTurns}`;
        } else {
            btn.onclick = () => selectMove(index, btn);
        }

        let typeColor = "text-gray-400";
        if(move.type.includes("攻击")) typeColor = "text-red-400";
        if(move.type.includes("防御")) typeColor = "text-blue-400";
        if(move.type.includes("终极")) typeColor = "text-yellow-400";
        if(move.type.includes("连携") || move.type.includes("追击")) typeColor = "text-purple-400";
        if(move.type.includes("反制") || move.type.includes("破防")) typeColor = "text-orange-400";
        if(move.type.includes("爆发") || move.type.includes("终结")) typeColor = "text-red-500";

        // 🔮 动态招式显示剩余回合数
        let turnsInfo = "";
        if (move.isDynamic && move.turns_remaining) {
            const remaining = move.turns_remaining - (currentTurn - move.addedAtTurn);
            turnsInfo = `<span class="text-[9px] text-yellow-400 ml-1">(${remaining}回合)</span>`;
        }

        // 🚫 显示禁用状态
        let disabledBadge = "";
        if (isDisabled) {
            const remainingTurns = disabledInfo.disabledUntilTurn - currentTurn;
            disabledBadge = `<span class="text-[9px] text-red-400 ml-1">🔒(${remainingTurns}回合)</span>`;
        }

        btn.innerHTML = `
            <div class="flex items-center gap-2">
                ${isDisabled ? '<span class="text-red-400 text-xs">🔒</span>' : ''}
                ${!isDisabled && move.isDynamic ? '<span class="text-yellow-400 text-xs">🔮</span>' : ''}
                <span class="font-bold text-sm ${isDisabled ? 'text-gray-500 line-through' : 'text-gray-200'}">${move.name}</span>
                ${turnsInfo}
                ${disabledBadge}
            </div>
            <span class="text-[10px] border border-gray-700 px-1 rounded ${isDisabled ? 'text-gray-600' : typeColor}">${move.type}</span>
        `;
        container.appendChild(btn);
    });
}

function selectMove(index, btnElement) {
    const move = activeMoves[index];
    const currentTurn = battleDatabase[currentClass]?.length || 0;
    
    // 🚫 检查招式是否被禁用
    const disabledInfo = disabledMoves[move.id];
    if (disabledInfo && disabledInfo.disabledUntilTurn > currentTurn) {
        const remainingTurns = disabledInfo.disabledUntilTurn - currentTurn;
        alert(`⚠️ 该招式已被封印！\n原因：${disabledInfo.reason}\n剩余回合：${remainingTurns}`);
        return;
    }
    
    const allBtns = document.querySelectorAll('.move-card');
    allBtns.forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');
    currentSelectedMove = activeMoves[index];
    updateMoveDetailUI();
}

function updateMoveDetailUI() {
    const detailBox = document.getElementById('selectedMoveDetail');
    if (!currentSelectedMove) {
        detailBox.classList.add('hidden');
        return;
    }
    detailBox.classList.remove('hidden');
    
    const currentTurn = battleDatabase[currentClass]?.length || 0;
    
    // 🚫 检查是否被禁用
    const disabledInfo = disabledMoves[currentSelectedMove.id];
    const isDisabled = disabledInfo && disabledInfo.disabledUntilTurn > currentTurn;
    
    // 🔮 根据状态设置样式
    if (isDisabled) {
        detailBox.className = "bg-gradient-to-br from-red-900/40 to-black/40 border-2 border-red-600/50 p-3 rounded text-xs shadow-[0_0_15px_rgba(239,68,68,0.2)]";
    } else if (currentSelectedMove.isDynamic) {
        detailBox.className = "bg-gradient-to-br from-yellow-900/40 to-black/40 border-2 border-yellow-600/50 p-3 rounded text-xs shadow-[0_0_15px_rgba(251,191,36,0.2)]";
    } else {
        detailBox.className = "bg-black/40 border border-gray-700 p-3 rounded text-xs";
    }
    
    let nameHTML = currentSelectedMove.name;
    
    // 🚫 显示禁用信息
    if (isDisabled) {
        const remainingTurns = disabledInfo.disabledUntilTurn - currentTurn;
        nameHTML = `🔒 ${currentSelectedMove.name} <span class="text-red-400 text-[10px] ml-2">[已封印·${remainingTurns}回合]</span>`;
        document.getElementById('detailName').innerHTML = nameHTML;
        document.getElementById('detailEffect').innerHTML = `<span class="text-red-400">⚠️ 封印原因：${disabledInfo.reason}</span>`;
        document.getElementById('detailRestriction').innerText = "该招式暂时无法使用，请等待封印解除。";
    } else {
        // 🔮 显示动态招式信息
        if (currentSelectedMove.isDynamic) {
            const remaining = currentSelectedMove.turns_remaining - (currentTurn - currentSelectedMove.addedAtTurn);
            nameHTML = `🔮 ${currentSelectedMove.name} <span class="text-yellow-400 text-[10px] ml-2">[临时招式·剩余${remaining}回合]</span>`;
        }
        
        document.getElementById('detailName').innerHTML = nameHTML;
        document.getElementById('detailEffect').innerText = "效果：" + currentSelectedMove.effect;
        document.getElementById('detailRestriction').innerText = "限制：" + currentSelectedMove.restriction;
    }
}

function loadUserCharacter(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            // 验证格式
            if (data.name && data.desc && Array.isArray(data.moves) && data.moves.length > 0) {
                // 确认是否要替换当前角色（会重置所有战斗记录）
                if (Object.keys(battleDatabase).length > 0) {
                    if (!confirm("加载新角色会重置所有战斗记录，确定继续吗？")) {
                        input.value = '';
                        return;
                    }
                    // 清空所有战斗记录
                    battleDatabase = {};
                    ensureClassDataExists(currentClass);
                }
                
                USER_CHARACTER_PROFILE = data;
                activeMoves = [...USER_CHARACTER_PROFILE.moves];
                updateUserCharacterUI();
                renderMoveList();
                refreshUI();
                alert("角色配置加载成功！");
            } else {
                throw new Error("格式不符合规范，需要包含 name, desc, moves 等字段");
            }
        } catch (err) {
            alert("加载失败：" + err.message);
        }
        input.value = '';
    };
    reader.readAsText(file);
}

// 🆕 加载敌方角色配置文件
function loadEnemyCharacter(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            // 验证格式
            if (data.name && data.desc && Array.isArray(data.moves) && data.moves.length > 0) {
                // 确认是否要替换当前敌方角色（会重置该角色的战斗记录）
                const currentEnemyName = CHARACTER_PROFILES[currentClass]?.name || currentClass;
                if (battleDatabase[currentClass] && battleDatabase[currentClass].length > 0) {
                    if (!confirm(`加载新敌方角色会重置与 [${currentEnemyName}] 的所有战斗记录，确定继续吗？`)) {
                        input.value = '';
                        return;
                    }
                }
                
                // 生成一个唯一的ID用于存储
                const newEnemyId = data.id || `CustomEnemy_${Date.now()}`;
                
                // 更新 CHARACTER_PROFILES
                CHARACTER_PROFILES[newEnemyId] = {
                    name: data.name,
                    desc: data.desc,
                    personality: data.personality || data.desc,
                    magicStyle: data.magicStyle || "见招式库",
                    imageUrl: data.imageUrl || null, // 保存图片URL
                    moves: data.moves
                };
                
                // 更新当前选择的敌方角色
                currentClass = newEnemyId;
                
                // 更新下拉选择框（如果存在）
                const select = document.getElementById('aiClass');
                if (select) {
                    // 检查是否已存在该选项
                    let optionExists = false;
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].value === newEnemyId) {
                            optionExists = true;
                            select.selectedIndex = i;
                            break;
                        }
                    }
                    // 如果不存在，添加新选项
                    if (!optionExists) {
                        const option = document.createElement('option');
                        option.value = newEnemyId;
                        option.textContent = data.name;
                        select.appendChild(option);
                        select.selectedIndex = select.options.length - 1;
                    }
                }
                
                // 清空该角色的战斗记录
                battleDatabase[newEnemyId] = [];
                
                // 🔮 重置招式池和禁用状态
                activeMoves = [...USER_CHARACTER_PROFILE.moves];
                disabledMoves = {};
                
                // 🩸 重置健康值
                userHealth = MAX_HEALTH;
                aiHealth = MAX_HEALTH;
                console.log("✅ 成功加载敌方角色:", data.name);
console.log("📜 招式数量:", data.moves.length);
console.log("📋 招式列表:", data.moves.map(m => m.name));
console.log("🎯 完整角色配置:", CHARACTER_PROFILES[newEnemyId]);
                // 更新UI
                updateEnemyCharacterUI(data);
                renderMoveList();
                refreshUI();
                alert("敌方角色配置加载成功！");
            } else {
                throw new Error("格式不符合规范，需要包含 name, desc, moves 等字段");
            }
        } catch (err) {
            alert("加载失败：" + err.message);
        }
        input.value = '';
    };
    reader.readAsText(file);
}

// 🆕 更新敌方角色UI
function updateEnemyCharacterUI(data) {
    // 更新名称
    const nameElement = document.getElementById('enemyCharacterName');
    if (nameElement) {
        nameElement.innerText = data.name;
    }
    
    // 更新描述
    const descElement = document.getElementById('characterDesc');
    if (descElement) {
        descElement.innerText = data.desc;
    }
    
    // 更新图片（如果提供了imageUrl）
    if (data.imageUrl) {
        const img = document.getElementById('enemyPortrait');
        if (img) {
            img.style.opacity = '0.5';
            setTimeout(() => {
                img.src = data.imageUrl;
                img.onload = () => { img.style.opacity = '1'; };
            }, 200);
        }
    }
}

function updateUserCharacterUI() {
    // 更新名称
    const nameElement = document.getElementById('userCharacterName');
    if (nameElement) {
        nameElement.innerText = USER_CHARACTER_PROFILE.name;
    }
    
    // 更新图片（如果提供了imageUrl）
    if (USER_CHARACTER_PROFILE.imageUrl) {
        const img = document.getElementById('playerPortrait');
        if (img) {
            img.src = USER_CHARACTER_PROFILE.imageUrl;
        }
    }
}

function switchEnemyContext() {
    const select = document.getElementById('aiClass');
    if (select) {
        currentClass = select.value;
    } else {
        // 如果没有选择框，保持当前值或使用默认值
        currentClass = currentClass || "HimuroRinne";
    }

    // 更新 UI
    const profile = CHARACTER_PROFILES[currentClass];
    if (profile) {
        // 更新名称
        const nameElement = document.getElementById('enemyCharacterName');
        if (nameElement) {
            nameElement.innerText = profile.name;
        }
        // 更新描述
        const descElement = document.getElementById('characterDesc');
        if (descElement) {
            descElement.innerText = profile.desc;
        }
        // 更新图片（优先使用CHARACTER_PROFILES中的imageUrl，否则使用默认映射）
        const img = document.getElementById('enemyPortrait');
        if (img) {
            // 使用charImages作为后备（在HTML中定义）
            const charImages = {
                'HimuroRinne': './web-project/public/栩.jpg',
                'Saber': 'https://placehold.co/300x400/450a0a/fbbf24?text=Saber',
                'Unknown': 'https://placehold.co/300x400/000/666?text=Unknown'
            };
            const imageUrl = profile.imageUrl || charImages[currentClass] || charImages['Unknown'];
            img.style.opacity = '0.5';
            setTimeout(() => {
                img.src = imageUrl;
                img.onload = () => { img.style.opacity = '1'; };
            }, 200);
        }
    }

    // 🔮 切换敌人时重置招式池（清除动态招式和禁用状态）
    activeMoves = [...USER_CHARACTER_PROFILE.moves];
    disabledMoves = {};
    renderMoveList();
    
    // 🩸 重置健康值和战斗按钮
    userHealth = MAX_HEALTH;
    aiHealth = MAX_HEALTH;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('btnText').innerText = '执行推演 (Execute)';

    ensureClassDataExists(currentClass);
    document.getElementById('aiMoveDisplay').classList.add('hidden');
    refreshUI();
}

function refreshUI() {
    const history = battleDatabase[currentClass] || [];
    document.getElementById('currentTimelineCount').innerText = history.length;
    rebuildBattleLog(history);
    rebuildNovelHistory(history);
    updateHealthIndicator();
}

// 🩸 更新健康指示器
function updateHealthIndicator() {
    const userHealthDots = document.getElementById('userHealthDots');
    const aiHealthDots = document.getElementById('aiHealthDots');
    
    // 根据健康值显示心形符号
    let userHearts = '';
    let aiHearts = '';
    
    for (let i = 0; i < MAX_HEALTH; i++) {
        if (i < userHealth) {
            userHearts += '♥';
        } else {
            userHearts += '♡';
        }
    }
    
    for (let i = 0; i < MAX_HEALTH; i++) {
        if (i < aiHealth) {
            aiHearts += '♥';
        } else {
            aiHearts += '♡';
        }
    }
    
    userHealthDots.innerHTML = userHearts;
    aiHealthDots.innerHTML = aiHearts;
    
    // 根据健康值改变颜色
    if (userHealth <= 1) {
        userHealthDots.className = 'text-red-500 animate-pulse';
    } else if (userHealth <= 2) {
        userHealthDots.className = 'text-orange-400';
    } else {
        userHealthDots.className = 'text-blue-400';
    }
    
    if (aiHealth <= 1) {
        aiHealthDots.className = 'text-red-900 opacity-50';
    } else if (aiHealth <= 2) {
        aiHealthDots.className = 'text-orange-400';
    } else {
        aiHealthDots.className = 'text-red-400';
    }
}

function clearCurrentMemory() {
    if(confirm(`确定要删除与 [${currentClass}] 的所有战斗记录吗？`)) {
        battleDatabase[currentClass] = [];
        
        // 🔮 清除记忆时重置招式池和禁用状态
        activeMoves = [...USER_CHARACTER_PROFILE.moves];
        disabledMoves = {};
        renderMoveList();
        
        // 🩸 重置健康值和战斗按钮
        userHealth = MAX_HEALTH;
        aiHealth = MAX_HEALTH;
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('btnText').innerText = '执行推演 (Execute)';
        
        document.getElementById('aiMoveDisplay').classList.add('hidden');
        refreshUI();
    }
}

function saveAllMemories() {
    // 🩸 保存时包含健康值数据
    const saveData = {
        battleDatabase: battleDatabase,
        userHealth: userHealth,
        aiHealth: aiHealth,
        savedAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(saveData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Battle_Save_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
}

function loadMemories(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const saveData = JSON.parse(e.target.result);
            battleDatabase = saveData.battleDatabase || saveData; // 兼容旧格式
            
            // 🩸 恢复健康值（如果存档包含健康值数据）
            if (saveData.userHealth !== undefined && saveData.aiHealth !== undefined) {
                userHealth = saveData.userHealth;
                aiHealth = saveData.aiHealth;
            } else {
                // 旧存档没有健康值，重置为满血
                userHealth = MAX_HEALTH;
                aiHealth = MAX_HEALTH;
            }
            
            ensureClassDataExists(currentClass);
            
            // 🔮 加载存档时重置招式池和禁用状态（只保留基础招式）
            activeMoves = [...USER_CHARACTER_PROFILE.moves];
            disabledMoves = {};
            renderMoveList();
            
            // 🩸 检查是否有一方已经战败
            if (userHealth <= 0 || aiHealth <= 0) {
                document.getElementById('submitBtn').disabled = true;
                const winner = userHealth > aiHealth ? USER_CHARACTER_PROFILE.name : CHARACTER_PROFILES[currentClass].name;
                document.getElementById('btnText').innerText = `战斗已结束 - ${winner} 获胜`;
            } else {
                document.getElementById('submitBtn').disabled = false;
                document.getElementById('btnText').innerText = '执行推演 (Execute)';
            }
            
            refreshUI();
            alert("存档读取成功（动态招式和禁用状态已重置）");
        } catch (e) { alert("存档格式错误"); }
        input.value = '';
    };
    reader.readAsText(file);
}

function rebuildBattleLog(history) {
    const battleLog = document.getElementById('battleLog');
    battleLog.innerHTML = '';
    if (history.length === 0) {
        battleLog.innerHTML = '<p class="opacity-50">无交战记录...</p>';
        return;
    }
    [...history].forEach((turn, index) => {
        const logItem = document.createElement('div');
        logItem.className = "battle-log-item p-2 mb-2 text-xs text-gray-300";
        
        // 🩸 构建伤害显示
        let damageHTML = '';
        if (turn.damageToAI !== undefined || turn.damageToUser !== undefined) {
            const aiDmg = turn.damageToAI || 0;
            const userDmg = turn.damageToUser || 0;
            
            if (aiDmg > 0 || userDmg > 0) {
                damageHTML = `<div class="mt-1 text-[10px] flex gap-3">`;
                if (aiDmg > 0) {
                    damageHTML += `<span class="text-red-400">AI -${aiDmg}♥</span>`;
                }
                if (userDmg > 0) {
                    damageHTML += `<span class="text-orange-400">YOU -${userDmg}♥</span>`;
                }
                damageHTML += `</div>`;
            }
        }
        
        logItem.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="text-blue-400 font-bold">Turn ${index + 1}</span>
                </div>
                <div class="mb-1 opacity-80">You: "${turn.userMoveName}"</div>
                <div class="mb-1 opacity-80 text-red-300">AI: "${turn.ai}"</div>
                ${damageHTML}
            `;
        battleLog.prepend(logItem);
    });
}

function rebuildNovelHistory(history) {
    const container = document.getElementById('novelOutput');
    container.innerHTML = '';

    if (history.length === 0) {
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-gray-600 italic opacity-50 space-y-4">
                <p>（——时间线：[${USER_CHARACTER_PROFILE.name}] VS [${CHARACTER_PROFILES[currentClass]?.name || currentClass}] 处于静止状态。）</p>
                <p>（请从左侧选择招式，开始推演。）</p>
            </div>`;
        return;
    }

    history.forEach((turn, index) => {
        const divider = document.createElement('div');
        divider.className = "chapter-divider";
        divider.innerHTML = `<span>Turn ${index + 1} // Phase: ${turn.userMoveName}</span>`;
        container.appendChild(divider);

        const contentDiv = document.createElement('div');
        contentDiv.className = "mb-8 animate-fade-in";

        // 🔴 修复核心：增加类型检查和转换
        let textToRender = turn.novelText;

        // 如果 API 返回的是数组，将其合并为字符串，用换行符连接
        if (Array.isArray(textToRender)) {
            textToRender = textToRender.join('\n\n');
        }

        // 强制转换为字符串，防止 null 或 undefined 导致的崩溃
        textToRender = String(textToRender || "");

        // 传入处理后的字符串
        contentDiv.innerHTML = marked.parse(textToRender);
        container.appendChild(contentDiv);
    });

    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

async function startBattleTurn() {
    const apiKey = document.getElementById('apiKey').value.trim();
    let baseUrl = document.getElementById('baseUrl').value.trim().replace(/\/+$/, '');
    const modelName = document.getElementById('modelName').value.trim();

    if (!currentSelectedMove) { alert("请先从列表选择一个招式！"); return; }
    if (!apiKey) { alert("请先配置 API Key"); return; }
    
    // 🚫 检查当前选中的招式是否被禁用
    const tempCurrentTurn = battleDatabase[currentClass]?.length || 0;
    const disabledInfo = disabledMoves[currentSelectedMove.id];
    if (disabledInfo && disabledInfo.disabledUntilTurn > tempCurrentTurn) {
        alert(`⚠️ 该招式已被封印，无法使用！\n原因：${disabledInfo.reason}`);
        return;
    }

    const btn = document.getElementById('submitBtn');
    const spinner = document.getElementById('loadingSpinner');
    btn.disabled = true;
    spinner.classList.remove('hidden');

    // 确保 currentClass 已设置（如果没有选择框，使用默认值）
    if (!currentClass) {
        currentClass = "HimuroRinne";
    }
    const aiProfile = CHARACTER_PROFILES[currentClass] || CHARACTER_PROFILES["HimuroRinne"];
    const currentHistory = battleDatabase[currentClass] || [];
    
    // 🔓 清理过期的禁用状态
    const currentTurn = currentHistory.length;
    const expiredMoveIds = [];
    Object.keys(disabledMoves).forEach(moveId => {
        if (disabledMoves[moveId].disabledUntilTurn <= currentTurn) {
            const targetMove = activeMoves.find(m => m.id === moveId);
            if (targetMove) {
                expiredMoveIds.push(targetMove.name);
            }
            delete disabledMoves[moveId];
        }
    });
    
    // 如果有招式解除封印，显示提示
    if (expiredMoveIds.length > 0) {
        console.log(`%c🔓 封印解除: ${expiredMoveIds.join(', ')}`, "color: #10b981; font-weight: bold;");
    }

    // 1. 获取上一回合上下文
    const lastTurn = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null;
    let lastNovelSnippet = lastTurn ? lastTurn.novelText : "（战斗在私立樱羽学园的钟楼顶端展开。。）";
    const recentUserMoves = currentHistory.slice(-3).map((turn, i) =>
        `Turn ${currentHistory.length - 3 + i + 1}: [${turn.userMoveName}]`
    ).join("\n");

    const hasHistory = currentHistory.length > 0;

    // 2. 判定胜负关系 + 🩸 伤害计算
    let tacticalFeedback = "";
    let tacticalStatus = "NEUTRAL";
    let damageToAI = 0;
    let damageToUser = 0;

    if (lastTurn) {
        const userMove = currentSelectedMove.name;
        const isBest = lastTurn.bestSolution && (userMove.includes(lastTurn.bestSolution) || lastTurn.bestSolution.includes(userMove));
        const isWorst = lastTurn.worstSolution && (userMove.includes(lastTurn.worstSolution) || lastTurn.worstSolution.includes(userMove));

        if (isBest) {
            tacticalStatus = "SUCCESS";
            damageToAI = 2; // 🩸 重创 AI
            tacticalFeedback = `
            【系统判定：大成功/完美反制】
            用户选择了上一轮预测的[最优解]（${userMove}）。
            **写作强制要求**：
            1. 描写${USER_CHARACTER_PROFILE.name}通过战术布局或能力优势，完全破解了${aiProfile.name}的上一招。
            2. **必须描写${aiProfile.name}受到实质性伤害**（例如：防御碎裂、后退、嘴角溢血、眼神从冷漠变为震惊、魔力回路受损）。
            3. 强调此招式如何克制了${aiProfile.name}的战斗风格。
            `;
        } else if (isWorst) {
            tacticalStatus = "FAILURE";
            damageToUser = 2; // 🩸 玩家受重创
            tacticalFeedback = `
            【系统判定：大失败/落入陷阱】
            用户选择了上一轮警告的[最差解/被克]（${userMove}）。
            **写作强制要求**：
            1. 描写${USER_CHARACTER_PROFILE.name}的攻击完全无效，或者被${aiProfile.name}的能力直接克制/反弹。
            2. **必须描写${USER_CHARACTER_PROFILE.name}受到重创**（例如：招式被破解、受伤、退守、魔力回路受损）。
            3. ${aiProfile.name}毫发无伤，展现出绝对的支配力。
            `;
        } else {
            // 🩸 随机判定伤害
            const random = Math.random();
            if (random < 0.3) {
                damageToAI = 1; // 30% 概率 AI 受轻伤
            } else if (random < 0.5) {
                damageToUser = 1; // 20% 概率玩家受轻伤
            } else if (random < 0.6) {
                damageToAI = 1;
                damageToUser = 1; // 10% 概率双方都受轻伤
            }
            // 40% 概率无人受伤
            
            tacticalFeedback = `
            【系统判定：普通交锋】
            双方互有攻守，魔力激荡。${aiProfile.name}防御了攻击，或者双方招式互相抵消。战局僵持。
            ${damageToAI > 0 ? `${aiProfile.name}在交锋中受到了一定程度的伤害。` : ''}
            ${damageToUser > 0 ? `${USER_CHARACTER_PROFILE.name}在攻防中也承受了不小的压力。` : ''}
            `;
        }
    } else {
        tacticalFeedback = "【判定结果：遭遇战】这是战斗的第一回合。双方互相试探，气氛紧张。";
    }
    
    // 🩸 应用伤害
    aiHealth -= damageToAI;
    userHealth -= damageToUser;
    
    // 🩸 受伤后的招式禁用机制（玩家受重伤时，自动禁用高消耗招式）
    if (damageToUser >= 2 && userHealth > 0) {
        // 找出所有终极/高消耗招式
        const highCostMoves = activeMoves.filter(m => 
            m.type.includes("终极") || m.type.includes("必杀") || m.restriction.includes("极大消耗")
        );
        
        // 随机禁用1个高消耗招式（如果有的话）
        if (highCostMoves.length > 0 && Math.random() < 0.5) {
            const targetMove = highCostMoves[Math.floor(Math.random() * highCostMoves.length)];
            if (!disabledMoves[targetMove.id]) {
                disabledMoves[targetMove.id] = {
                    disabledUntilTurn: currentHistory.length + 2,
                    reason: "伤势过重，魔力回路受损"
                };
                console.log(`%c🩸 由于受伤，招式「${targetMove.name}」暂时无法使用`, "color: #ef4444; font-style: italic;");
            }
        }
    }

    const userMoveSetContext = activeMoves.map(m =>
        `- [${m.name}]: ${m.effect} (类型: ${m.type})`
    ).join("\n");

    // 🔮 收集所有已存在的招式名称（用于去重）
    const existingMoveNames = activeMoves.map(m => m.name);
    const existingMoveIds = activeMoves.map(m => m.id);
    
    // 🔮 收集历史文本中出现过的招式名称（从 novelText 和 userMoveName 中提取）
    const historicalMoveNames = new Set();
    currentHistory.forEach(turn => {
        // 添加玩家使用过的招式名称
        if (turn.userMoveName) {
            historicalMoveNames.add(turn.userMoveName);
        }
        // 从文本中提取引号内的招式名称
        if (turn.novelText) {
            const matches = turn.novelText.match(/[「『""]([^」』""]+)[」』""]/g);
            if (matches) {
                matches.forEach(m => {
                    const cleanName = m.replace(/[「『""]|[」』""]/g, '');
                    historicalMoveNames.add(cleanName);
                });
            }
        }
    });

    const aiMoveSetContext = aiProfile.moves.map(m =>
        `- [${m.name}]: ${m.effect}`
    ).join("\n");

    // 🩸 健康状态描述
    const getHealthStatus = (health, maxHealth, name) => {
        const percentage = health / maxHealth;
        if (health <= 0) return `【濒死】${name}已经失去战斗能力`;
        if (percentage <= 0.2) return `【重伤】${name}伤势严重，魔力回路多处损坏，动作迟缓`;
        if (percentage <= 0.4) return `【中伤】${name}身上多处伤口，魔力输出明显下降`;
        if (percentage <= 0.6) return `【轻伤】${name}受了些伤，但仍有战斗能力`;
        if (percentage <= 0.8) return `【小伤】${name}略有损伤，整体状态良好`;
        return `【完好】${name}状态完好`;
    };
    
    const userHealthStatus = getHealthStatus(userHealth, MAX_HEALTH, USER_CHARACTER_PROFILE.name);
    const aiHealthStatus = getHealthStatus(aiHealth, MAX_HEALTH, aiProfile.name);
    
    // 🩸 根据 AI 健康值限制可用招式等级
    let aiAvailableMoves = [...aiProfile.moves];
    if (aiHealth <= 1) {
        // 濒死：只能使用最基础的招式（前2个）
        aiAvailableMoves = aiProfile.moves.slice(0, 2);
    } else if (aiHealth <= 2) {
        // 重伤：只能使用基础和中级招式（前5个）
        aiAvailableMoves = aiProfile.moves.slice(0, Math.min(5, aiProfile.moves.length));
    } else if (aiHealth <= 3) {
        // 中伤：不能使用最强的终极招式（最后1个）
        aiAvailableMoves = aiProfile.moves.slice(0, -1);
    }
    
    const aiMoveSetContextLimited = aiAvailableMoves.map(m =>
        `- [${m.name}]: ${m.effect}`
    ).join("\n");
    
    // 🟢 核心修改：基于文档的角色扮演 Prompt
    const systemPrompt = `
        你是一名《Fate/Stay Night》及《魔法使之夜》风格的战斗小说家 (奈须蘑菇风格)。
        现在通过读取到的设定文件进行角色扮演。

        【敌我设定】
        * **己方 (AI)**: **${aiProfile.name}**
        * **人物设定**: ${aiProfile.personality}
        * **战斗风格/魔术**: ${aiProfile.magicStyle}
        * **🩸 当前状态**: ${aiHealthStatus}
        * **当前可用招式库** ${aiHealth < MAX_HEALTH ? '(受伤导致部分高级招式无法使用)' : ''}:
        ${aiMoveSetContextLimited}
        
        **⚠️ 强制规则：AI招式库约束**
        - ${aiProfile.name} 在战斗中**只能使用上方列出的招式库中的招式或者根据招式库中的招式演化**
        - 每个招式都有明确的效果和限制，使用时必须遵循这些设定
        - 选择招式时必须考虑：角色性格、战斗风格、当前伤势、战局态势
        - 描写招式时，必须体现该招式的核心特点（如冰系的冻结效果、光系的贯穿效果等）

         * **敌方 (User)**: **${USER_CHARACTER_PROFILE.name}**
         * **人物设定**: ${USER_CHARACTER_PROFILE.personality || USER_CHARACTER_PROFILE.desc}
         * **战斗风格/魔术**: ${USER_CHARACTER_PROFILE.magicStyle || "见招式库"}
         * **🩸 当前状态**: ${userHealthStatus}

        【高级逻辑：因果连锁 (Chain Reaction)】
        在描写战斗时，必须检测用户的**当前招式**与**历史招式**是否存在逻辑上的联动。
        * **判定规则**：如果【当前招式】能利用【历史招式】留下的环境，则判定为 **Combo 成功**。
        * **Combo 效果**：如果不构成 Combo，则按普通判定描写；如果构成 Combo，**必须大幅提升用户攻击的华丽度和威力描述**，使用"利用了之前残留的..."或"与上一轮的术式产生共鸣"等语句。

        【高级机制：动态招式进化 (Dynamic Move Evolution)】
        根据战场状态，为 ${USER_CHARACTER_PROFILE.name} 生成 0-2 个**临时新招式**：
        * **触发条件**（满足任一即可生成）：
          - 如果${USER_CHARACTER_PROFILE.name}的招式在场上留下了特殊环境效果，生成利用这些环境的 Combo 招式
          - 如果${USER_CHARACTER_PROFILE.name}连续使用同一类型招式2次以上，生成该类型的"强化版/奥义版"
          - 如果${aiProfile.name}使用了特定属性攻击，生成针对性的反制/破解招式
          - 如果战斗进入关键节点（如双方僵持、濒死反击等），生成符合当前剧情的突破性招式
        * **设计原则**：
          - 招式名称必须符合${USER_CHARACTER_PROFILE.name}的魔术体系和命名风格
          - 必须有明确且严格的使用条件
          - 威力/效果应该比基础招式强，但有更严格的限制或代价
          - 类型标签要准确（如"连携/追击"、"反制/破防"、"爆发/终结"等）
        * **去重要求**（必须严格遵守）：
          - 不能生成与【当前招式库】中已存在的招式同名的招式
          - 不能生成与【历史战斗文本】中出现过的招式名称重复的招式
          - 每个新招式的 id 和 name 都必须是全新的、从未出现过的
        * **重要**：如果当前战况不符合任何触发条件（如第一回合、平淡交锋、无特殊环境），则返回空数组 []
        
        【高级机制：战术压制与技能封印 (Tactical Suppression)】
        根据 ${aiProfile.name} 的战术布局，可以**暂时禁用** ${USER_CHARACTER_PROFILE.name} 的部分招式：
        * **触发条件**（满足时才能禁用）：
          - ${aiProfile.name} 使用了特定的封印/结界类招式
          - ${aiProfile.name} 破坏了战场环境，导致某些依赖环境的招式无法使用
          - ${USER_CHARACTER_PROFILE.name} 的某个招式刚被完美反制，暂时不可用（需要冷却）
        * **禁用规则**：
          - 每次最多禁用 1-2 个招式，不能全部禁用
          - 禁用持续时间为 1-3 回合（用 disabled_turns 字段指定）
          - 必须在 novel_text 中明确描写禁用的原因
        * **输出格式**：在返回的 JSON 中添加 disabled_move_ids 数组，包含要禁用的招式 id
        
        【🩸 伤势影响系统 (Injury Impact)】
        * **描写要求**：必须在 novel_text 中体现双方当前的伤势状态：
          - 轻伤/小伤：动作略显僵硬、呼吸加重、魔力输出不稳定
          - 中伤：明显的伤口、衣物破损、魔力回路部分受损、招式威力下降
          - 重伤：多处严重伤口、站立困难、魔力几乎枯竭、只能使用基础招式
          - 濒死：失去战斗能力，即将败北
        * **AI招式限制**：${aiProfile.name} 由于受伤，当前只能从受限的招式库中选择（已自动过滤高级招式）
        * **战败判定**：如果任一方健康值≤0，必须描写其战败的场景

        【写作铁律】
        1. **禁绝人称代词**：只使用"${aiProfile.name}"和"${USER_CHARACTER_PROFILE.name}"，禁止"你/我"。
        2. **氛围描写**：使用复杂的修辞、独特的名词（如"以太"、"大源"、"固有结界"）来堆砌史诗感。
        3. **输出格式**：JSON 单行，无 Markdown 标记。
        
        【novel_text 写作要求】（重要！）
        在生成 novel_text 时，必须遵循以下小说化写作规范：
        
        **A. 战斗场面描写（细致化）**：
        - 描写魔力流动的细节
        - 描写招式的视觉效果
        - 描写肢体动作（如"${aiProfile.name}的手指划过空气，在虚空中勾勒出复杂的魔术阵"）
        - 描写环境反应
        - 描写攻击的轨迹和速度
        - 描写碰撞的瞬间
        

        
        **C. 思考过程（战术分析）**：
        - 描写角色在战斗中的判断过程
        - 描写对敌人招式的分析
        - 描写战术选择的理由（如"正面突破是愚蠢的，必须利用折光原理改变攻击角度"）
        
        **D. 心理描写（内心活动）**：
        - 描写角色的情绪波动
        - 描写战斗压力（如"魔力消耗已经超过七成，呼吸开始变得急促"）
        - 描写决心或觉悟（如"${USER_CHARACTER_PROFILE.name}深吸一口气，眼中的星光愈发璀璨——已经没有退路了"）
        - 描写对战局的焦虑或自信（如"局势正在向不利的方向倾斜，必须尽快打破僵局"）
        
        **E. 段落结构要求**：
        建议按照以下结构组织 novel_text（每部分用 \\n\\n 分段）：
        1. 【起手】：${USER_CHARACTER_PROFILE.name} 发动招式的细节描写 + 一句对话或心理活动
        2. 【交锋】：双方的快速攻防 + 战术思考 + 对话交锋（2-3轮互动）
        3. 【环境】：战场环境的变化，魔力的碰撞效果
        4. 【转折】：${aiProfile.name} 开始蓄力或展开反击 + 心理描写
        5. 【高潮】：${aiProfile.name} 释放终局招式的前摇 + 威胁感描写 + 悬念结尾
        
        **F. 文学化技巧**：
        - 使用比喻和拟人
        - 使用通感描写（如"寒意不仅刺入皮肤，更像是要冻结灵魂本身"）
        - 使用时间的放慢或加速（如"那一瞬间仿佛被无限拉长"）
        - 使用留白和悬念（结尾时不要写出结果，而是定格在即将命中的瞬间）

        【核心逻辑：动态攻防流 (Dynamic Flow)】
        1. **执行判定与连锁**：根据判定结果，描写 ${USER_CHARACTER_PROFILE.name} 这一轮攻击造成的后果。如果检测到 ${USER_CHARACTER_PROFILE.name} 的招式与历史招式构成 Combo，请描写一连串华丽的连续打击。
        2. **动态交锋 (Skirmish Phase)**：
           - 在这一段描写中，**双方都可以连续出招**。
           - 允许 ${aiProfile.name} 和 ${USER_CHARACTER_PROFILE.name} 互换 2-3 次攻防（可以使用通用魔术弹、体术或招式库中的低阶招式进行快速试探/压制）。
           - **不要**让战斗停下来，要描写魔力碰撞的火花、高速咏唱的压迫感。
        3. **终局定格 (The Climax)**：
           - 在激烈的交锋后，${aiProfile.name} 必须祭出一记**主要招式**（High-Threat Move）作为本段落的结尾。
           - 描写必须**停格**在该招式即将命中或刚刚展开的瞬间，形成悬念（Cliffhanger）。
        4. **AI招式选择强制规则 (Critical: AI Move Selection)**：
           - **必须从${aiProfile.name}的招式库中选择一个具体的招式作为终局定格招式**
           - **绝对禁止编造不在招式库中的招式名称**
           - **选择的招式必须符合以下所有条件**：
             a) 存在于上方列出的【当前可用招式库】中
             b) 符合${aiProfile.name}的战斗风格（${aiProfile.magicStyle}）
             c) 符合角色性格和战术思维（${aiProfile.personality}）
             d) 适配当前战局和伤势状态
           - **招式选择优先级**：根据战况选择合适等级的招式（基础→中级→高级→终极）
           - **描写要求**：使用招式时，必须体现该招式的核心特点和效果，与招式库中的描述保持一致
        5. **出题**：
           - 仅针对最后这个"终局定格"的招式，设计 ${USER_CHARACTER_PROFILE.name} 下一轮的【最优解】和【最差解】。


    `;
    console.log(systemPrompt)
    const userPrompt = `
        【上文结尾】
        ...${lastNovelSnippet.slice(-200)}
        【战场残留记录 (用于判断 Combo)】
        ${hasHistory ? recentUserMoves : "（无，这是第一回合）"}
        【当前回合行动】
        >>> ${USER_CHARACTER_PROFILE.name} 发动招式：${currentSelectedMove.name}
        >>> 招式效果：${currentSelectedMove.effect}

        【判定指示】
        1. ${tacticalFeedback}
        2. **🩸 健康状态通报**：
           - ${USER_CHARACTER_PROFILE.name}: ${userHealthStatus}
           - ${aiProfile.name}: ${aiHealthStatus}
           ${userHealth <= 0 || aiHealth <= 0 ? '⚠️ 有一方已经濒死，战斗即将结束！' : ''}
        3. **动态演算要求**：请不要只写这一招。以此招为起点，描写双方进行了一轮激烈的**连续攻防**（可以包含 ${USER_CHARACTER_PROFILE.name} 的追击或 ${aiProfile.name} 的快速反制）。
           - 在攻防过程中，必须插入双方的**对话**和**心理活动**
           - 详细描写每一次攻击的**视觉效果**和**环境影响**
           - 展现角色的**战术思考**：为什么选择这样应对，如何判断敌人的弱点
           - **必须体现伤势对战斗的影响**：伤口疼痛、动作变形、魔力不足等
        4. **最终威胁**：但在最后，${aiProfile.name} 必须通过重整态势或强行突破，释放一个新的威胁。
           - **⚠️ 招式选择约束**：必须从【${aiProfile.name}的当前可用招式库】中选择一个真实存在的招式，严禁编造
           - 选择的招式必须符合${aiProfile.name}的角色设定和战斗风格
           - 描写 ${aiProfile.name} 蓄力时的**心理变化**（如从冷静到认真，或从轻视到警惕）
           - 用**一句有分量的对话**宣告招式名称或战术意图（必须使用招式库中的准确名称）
           - 描写招式效果时，必须体现该招式在招式库中定义的核心特性（如冰系则描写冰冻效果，光系则描写光束贯穿等）
           - 定格在招式即将命中的瞬间，制造**悬念感**
           ${aiHealth <= 2 ? `- ⚠️ 注意：${aiProfile.name}当前重伤，只能使用基础/低级招式，描写时要体现其虚弱和绝望` : ''}
        5. **Combo 检测**：请检查上面的【战场残留记录】。如果${USER_CHARACTER_PROFILE.name}之前的招式能辅助当前的 ${currentSelectedMove.name}（例如：之前布置了陷阱/增益，现在发动进攻产生连锁效果），请在描写中体现这种**连锁增幅**。
           - 如果构成Combo，必须通过**心理描写**展现${USER_CHARACTER_PROFILE.name}的战术成功感（如"一切都按照预想展开"）
           - 通过**对话**让${aiProfile.name}意识到陷入了对方的布局（如"——糟了，这是陷阱！"）

        【${USER_CHARACTER_PROFILE.name}的可用招式库 (用于设计下一轮的解法)】
        ${userMoveSetContext}

        【已存在的招式名称（禁止重复生成）】
        当前招式库中的招式名称：${existingMoveNames.join(', ')}
        历史文本中出现过的招式名称：${Array.from(historicalMoveNames).join(', ')}
        **重要**：生成新招式时，name 和 id 都不能与上述任何名称重复或相似！

        【写作指令】
        请生成纯文本的 JSON 数据（不要使用 markdown 代码块）：
        1. **is_battle_end**: (新增) 布尔值，如果任一方健康值≤0则为true，否则为false
        2. **battle_winner**: (新增) 如果战斗结束，填写胜者名称（"${USER_CHARACTER_PROFILE.name}" 或 "${aiProfile.name}"），否则为null
        3. **novel_text**: 包含"${USER_CHARACTER_PROFILE.name}起手效果 -> 双方高速攻防交换 -> ${aiProfile.name} 最终杀招前摇"的完整段落。
           ${userHealth <= 0 || aiHealth <= 0 ? '⚠️ 特别要求：由于有一方濒死，novel_text 必须描写战败场景（败者倒地/认输/失去意识，胜者的胜利宣言），不需要再设置"最终威胁"' : ''}
           
           **必须包含以下要素**：
           - **细致的战斗场面描写**：魔力流动、招式视觉效果、肢体动作、环境反应、攻击轨迹、碰撞瞬间等细节
           - **2-4句符合角色性格的对话**：战术宣言、挑衅、分析或情感表达，使用破折号和书名号增强文学感
           - **战术思考过程**：角色对战局的判断、对敌人招式的分析、战术选择的理由
           - **心理活动描写**：情绪波动、战斗压力、决心觉悟、对战局的焦虑或自信
           - **小说化叙事技巧**：日常化的语句
           
           **推荐段落结构**（每部分用 \\n\\n 分段）：
           第1段：${USER_CHARACTER_PROFILE.name} 发动招式的细节 + 对话/心理
           第2-3段：双方攻防交锋 + 战术思考 + 对话互动
           第4段：战场环境变化，魔力碰撞效果
           第5段：${aiProfile.name} 反击蓄力 + 心理描写
           第6段：${aiProfile.name} 终局招式前摇 + 悬念结尾（定格在即将命中的瞬间）
           
           
        4. **ai_move_name**: ${aiProfile.name} 最后定格使用的那一招。
           **⚠️ 强制要求**：
           - 必须从【${aiProfile.name}的当前可用招式库】中选择一个真实存在的招式名称
           - 绝对禁止自行编造或创造新招式名称
           - 所选招式必须符合${aiProfile.name}的战斗风格（${aiProfile.magicStyle}）
           - 所选招式必须符合角色性格特点（如冷酷则选精准致命的，狂暴则选大范围破坏的）
           - 根据当前伤势状态选择合适等级的招式（重伤时只能用基础招式，完好时可用终极招式）
           - 在 novel_text 中描写该招式时，必须体现招式库中定义的核心效果
           如果存在 Combo，重点描写连锁反应。${userHealth <= 0 || aiHealth <= 0 ? '如果战斗已结束，此字段可为空字符串' : ''}
        5. **battle_result**: 简短概括本回合结果。${userHealth <= 0 || aiHealth <= 0 ? '如果战斗结束，写明胜负结果（如"${USER_CHARACTER_PROFILE.name}战败"或"${aiProfile.name}战败"）' : ''}
        6. **solution_best**: 针对${aiProfile.name}新招式，${USER_CHARACTER_PROFILE.name}招式库中最好的那个招式名（作为下一轮的正确答案）。${userHealth <= 0 || aiHealth <= 0 ? '如果战斗已结束，此字段可为空字符串' : ''}
        7. **solution_worst**: 针对${aiProfile.name}新招式，${USER_CHARACTER_PROFILE.name}招式库中最差的那个招式名（作为下一轮的陷阱）。${userHealth <= 0 || aiHealth <= 0 ? '如果战斗已结束，此字段可为空字符串' : ''}
        8. **user_dynamic_moves**: 数组，包含 0-2 个新招式对象。每个对象需要：
           - id: 招式唯一标识（英文_小写，不能与已存在的 id 重复）
           - name: 招式名称（符合${USER_CHARACTER_PROFILE.name}的魔术体系，**不能与已存在的招式名称重复**）
           - type: 类型标签（如"连携/追击"、"反制/破防"、"爆发/终结"）
           - effect: 效果描述（详细说明招式效果和触发的连锁反应）
           - restriction: 使用条件（必须严格！如"需要场上存在水晶节点"、"需要上回合使用过光束类招式"）
           - turns_remaining: 可用回合数（建议 2-3 回合，之后失效）
           ${userHealth <= 0 || aiHealth <= 0 ? '⚠️ 如果战斗已结束，此字段返回空数组 []' : ''}
        9. **disabled_move_ids**: 数组，包含要禁用的招式 id（0-2个）。每个对象需要：
           - move_id: 要禁用的招式 id（必须是当前招式库中存在的）
           - disabled_turns: 禁用持续回合数（1-3回合）
           - reason: 禁用原因（
           **重要**：只有在 novel_text 中明确描写了相关的封印/破坏效果时，才能禁用招式！
           ${userHealth <= 0 || aiHealth <= 0 ? '⚠️ 如果战斗已结束，此字段返回空数组 []' : ''}

        【重要：输出格式要求】
        ⚠️ 直接输出 JSON 对象，不要使用任何 markdown 代码块标记！
        ⚠️ novel_text 中的换行请使用 \\n 转义！
        
        正确格式示例（直接输出这样的格式）：
        {"is_battle_end":false,"battle_winner":null,"ai_move_name":"示例招式名","battle_result":"双方僵持","solution_best":"最优招式名","solution_worst":"最差招式名","novel_text":"${USER_CHARACTER_PROFILE.name}发动了攻击...\\n\\n${aiProfile.name}冷笑一声...","user_dynamic_moves":[{"id":"unique_combo_1","name":"星痕连锁·追击","type":"连携/追击","effect":"引爆场上残留的水晶节点，形成光束交叉网","restriction":"需要场上存在至少2个水晶节点","turns_remaining":3}],"disabled_move_ids":[{"move_id":"vega_prism_net","disabled_turns":2,"reason":"水晶节点被冰封"}]}
    `;

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.95
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "API Error");
        }

        const data = await response.json();
        let rawContent = data.choices[0].message.content;

        // 🔧 增强的 JSON 提取与清理逻辑
        // 1. 移除 markdown 代码块标记
        rawContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
        
        // 2. 提取 JSON 对象（从第一个 { 到最后一个 }）
        const firstBrace = rawContent.indexOf('{');
        const lastBrace = rawContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            rawContent = rawContent.substring(firstBrace, lastBrace + 1);
        }

        // 3. 尝试解析 JSON
        let result;
        try {
            result = JSON.parse(rawContent);
        } catch (e) {
            console.warn("首次解析失败，尝试修复...", e);
            console.log("原始内容:", rawContent);
            
            try {
                // 尝试修复常见问题：转义换行符和回车符
                let fixedContent = rawContent
                    .replace(/\n/g, "\\n")
                    .replace(/\r/g, "\\r")
                    .replace(/\t/g, "\\t");
                result = JSON.parse(fixedContent);
            } catch (e2) {
                // 如果还是失败，显示详细错误信息
                console.error("JSON 解析失败:", e2);
                console.error("清理后的内容:", rawContent.substring(0, 500));
                throw new Error(`JSON 解析失败: ${e2.message}\n前100字符: ${rawContent.substring(0, 100)}`);
            }
        }

        battleDatabase[currentClass].push({
            userMoveName: currentSelectedMove.name,
            ai: result.ai_move_name || "——",
            result: result.battle_result,
            novelText: result.novel_text,
            bestSolution: result.solution_best || "",
            worstSolution: result.solution_worst || "",
            damageToAI: damageToAI,
            damageToUser: damageToUser,
            userHealthAfter: userHealth,
            aiHealthAfter: aiHealth
        });
        
        // 🩸 战败判定
        const isBattleEnd = result.is_battle_end || userHealth <= 0 || aiHealth <= 0;
        if (isBattleEnd) {
            const winner = result.battle_winner || (userHealth > aiHealth ? USER_CHARACTER_PROFILE.name : aiProfile.name);
            const loser = winner === USER_CHARACTER_PROFILE.name ? aiProfile.name : USER_CHARACTER_PROFILE.name;
            
            console.log(`%c⚔️ 战斗结束！胜者：${winner}`, "color: #10b981; font-size: 16px; font-weight: bold; background: #1e1e2e; padding: 8px 16px; border: 2px solid #10b981;");
            
            // 禁用战斗按钮
            document.getElementById('submitBtn').disabled = true;
            document.getElementById('btnText').innerText = `战斗已结束 - ${winner} 获胜`;
            
            // 在 Battle Log 中添加战斗结束通知
            const battleLog = document.getElementById('battleLog');
            const endNotice = document.createElement('div');
            endNotice.className = winner === USER_CHARACTER_PROFILE.name 
                ? "bg-green-900/40 border-2 border-green-500 p-3 mb-3 text-xs text-green-300 rounded animate-pulse"
                : "bg-red-900/40 border-2 border-red-500 p-3 mb-3 text-xs text-red-300 rounded animate-pulse";
            endNotice.innerHTML = `
                <div class="font-bold text-center text-sm mb-1">⚔️ 战斗结束 ⚔️</div>
                <div class="text-center">${winner === USER_CHARACTER_PROFILE.name ? '🎉 胜利！' : '💀 败北...'}</div>
            `;
            battleLog.prepend(endNotice);
            
            // 显示战斗结束提示
            setTimeout(() => {
                alert(`⚔️ 战斗结束！\n\n胜者：${winner}\n败者：${loser}\n\n${winner === USER_CHARACTER_PROFILE.name ? '恭喜你赢得了这场圣杯战争！' : '很遗憾，你在这场战斗中落败了...'}`);
            }, 500);
        } else {
            // 🩸 如果本回合有重大伤害，在 Battle Log 中添加提示
            if (damageToAI >= 2) {
                const battleLog = document.getElementById('battleLog');
                const criticalHit = document.createElement('div');
                criticalHit.className = "bg-red-900/30 border border-red-600/50 p-2 mb-2 text-xs text-red-300 rounded";
                criticalHit.innerHTML = `
                    <span class="font-bold">💥 Critical Hit!</span>
                    <div class="mt-1 text-[10px]">${aiProfile.name}受到了严重伤害！</div>
                `;
                battleLog.prepend(criticalHit);
            } else if (damageToUser >= 2) {
                const battleLog = document.getElementById('battleLog');
                const criticalHit = document.createElement('div');
                criticalHit.className = "bg-orange-900/30 border border-orange-600/50 p-2 mb-2 text-xs text-orange-300 rounded";
                criticalHit.innerHTML = `
                    <span class="font-bold">⚠️ Heavy Damage!</span>
                    <div class="mt-1 text-[10px]">你受到了严重伤害！</div>
                `;
                battleLog.prepend(criticalHit);
            }
        }

        // 🔮 处理动态生成的新招式（带去重验证）
        if (result.user_dynamic_moves && Array.isArray(result.user_dynamic_moves) && result.user_dynamic_moves.length > 0) {
            const newMoveNames = [];
            const rejectedMoves = [];
            
            result.user_dynamic_moves.forEach(newMove => {
                // 验证必要字段
                if (!newMove.name || !newMove.effect || !newMove.restriction || !newMove.id) {
                    rejectedMoves.push(`${newMove.name || '未命名'}（缺少必要字段）`);
                    return;
                }
                
                // 🚫 去重验证：检查 id 是否重复
                if (activeMoves.some(m => m.id === newMove.id)) {
                    rejectedMoves.push(`${newMove.name}（ID重复: ${newMove.id}）`);
                    return;
                }
                
                // 🚫 去重验证：检查名称是否重复（精确匹配或包含关系）
                const isDuplicate = activeMoves.some(m => 
                    m.name === newMove.name || 
                    m.name.includes(newMove.name) || 
                    newMove.name.includes(m.name)
                );
                if (isDuplicate) {
                    rejectedMoves.push(`${newMove.name}（名称重复）`);
                    return;
                }
                
                // ✅ 通过验证，添加元数据标记
                newMove.isDynamic = true;
                newMove.addedAtTurn = battleDatabase[currentClass].length;
                
                // 添加到招式池
                activeMoves.push(newMove);
                newMoveNames.push(newMove.name);
            });
            
            // 显示解锁提示
            if (newMoveNames.length > 0) {
                console.log(`%c🔮 解锁新招式: ${newMoveNames.join(', ')}`, "color: #fbbf24; font-weight: bold; background: #1e1e2e; padding: 6px 12px; border-left: 3px solid #fbbf24;");
                
                // 在 Battle Log 中添加提示
                const battleLog = document.getElementById('battleLog');
                const unlockNotice = document.createElement('div');
                unlockNotice.className = "bg-yellow-900/30 border border-yellow-600/50 p-2 mb-2 text-xs text-yellow-300 rounded";
                unlockNotice.innerHTML = `
                    <span class="font-bold">🔮 术式进化</span>
                    <div class="mt-1 text-[10px]">${newMoveNames.map(n => `"${n}"`).join(', ')} 已解锁！</div>
                `;
                battleLog.prepend(unlockNotice);
            }
            
            // 显示被拒绝的招式（用于调试）
            if (rejectedMoves.length > 0) {
                console.warn(`%c🚫 招式生成被拒绝: ${rejectedMoves.join(', ')}`, "color: #ef4444; font-style: italic;");
            }
            
            // 重新渲染招式列表并更新详情
            renderMoveList();
            updateMoveDetailUI();
        }

        // 🚫 处理招式禁用
        if (result.disabled_move_ids && Array.isArray(result.disabled_move_ids) && result.disabled_move_ids.length > 0) {
            const currentTurn = battleDatabase[currentClass].length;
            const disabledNames = [];
            
            result.disabled_move_ids.forEach(disableInfo => {
                const moveId = disableInfo.move_id;
                const disabledTurns = disableInfo.disabled_turns || 1;
                const reason = disableInfo.reason || "未知原因";
                
                // 验证招式是否存在
                const targetMove = activeMoves.find(m => m.id === moveId);
                if (targetMove) {
                    disabledMoves[moveId] = {
                        disabledUntilTurn: currentTurn + disabledTurns,
                        reason: reason
                    };
                    disabledNames.push(`${targetMove.name}（${reason}，${disabledTurns}回合）`);
                    
                    // 如果当前选中的招式被禁用，清除选择
                    if (currentSelectedMove && currentSelectedMove.id === moveId) {
                        currentSelectedMove = null;
                    }
                }
            });
            
            // 显示禁用提示
            if (disabledNames.length > 0) {
                console.log(`%c🔒 招式被封印: ${disabledNames.join(', ')}`, "color: #ef4444; font-weight: bold; background: #1e1e2e; padding: 6px 12px; border-left: 3px solid #ef4444;");
                
                // 在 Battle Log 中添加提示
                const battleLog = document.getElementById('battleLog');
                const disableNotice = document.createElement('div');
                disableNotice.className = "bg-red-900/30 border border-red-600/50 p-2 mb-2 text-xs text-red-300 rounded";
                disableNotice.innerHTML = `
                    <span class="font-bold">🔒 术式封印</span>
                    <div class="mt-1 text-[10px]">${disabledNames.join('<br>')}</div>
                `;
                battleLog.prepend(disableNotice);
            }
            
            // 重新渲染招式列表并更新详情
            renderMoveList();
            updateMoveDetailUI();
        }

        // 🗑️ 清理过期的动态招式
        const currentTurn = battleDatabase[currentClass].length;
        const originalCount = activeMoves.length;
        activeMoves = activeMoves.filter(move => {
            if (!move.isDynamic) return true; // 保留基础招式
            const turnsElapsed = currentTurn - move.addedAtTurn;
            const maxTurns = move.turns_remaining || 3;
            return turnsElapsed < maxTurns;
        });
        
        // 如果有招式过期，重新渲染
        if (activeMoves.length < originalCount) {
            const expiredCount = originalCount - activeMoves.length;
            console.log(`%c⏱️ ${expiredCount} 个临时招式已失效`, "color: #6b7280; font-style: italic;");
            renderMoveList();
        }

        refreshUI();
        renderBattleResult(result);
        updateHealthIndicator(); // 🩸 更新健康指示器
        
        if (!isBattleEnd) {
            console.log(`%c[Next Puzzle] Best: ${result.solution_best} | Worst: ${result.solution_worst}`, "color: #60a5fa; font-weight: bold; background: #222; padding: 4px;");
        }

    } catch (error) {
        console.error(error);
        alert("系统错误: " + error.message);
    } finally {
        btn.disabled = false;
        spinner.classList.add('hidden');
    }
}

function renderBattleResult(result) {
    const aiMoveDisplay = document.getElementById('aiMoveDisplay');
    document.getElementById('aiMoveName').innerText = result.ai_move_name || "————";
    const resText = result.battle_result || "判定不明";
    let colorClass = "text-yellow-400 border-yellow-400";
    if (resText.includes("败") || resText.includes("死")) colorClass = "text-red-400 border-red-400";
    if (resText.includes("胜") || resText.includes("优")) colorClass = "text-green-400 border-green-400";
    document.getElementById('battleResultBadge').innerHTML = `<span class="result-badge ${colorClass}">RESULT: ${resText}</span>`;
    aiMoveDisplay.classList.remove('hidden');
}


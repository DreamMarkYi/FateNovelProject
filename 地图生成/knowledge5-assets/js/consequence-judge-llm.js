// ========== 后果裁决LLM系统 ==========
// 负责判断玩家行为的后果、游戏状态和玩家状态更新

// ========== 后果裁决上下文生成 ==========
function getConsequenceJudgeContext(userAction, narrativeResult, gameState) {
    const playerStatus = PlayerStatusManager.getStatusDescription();
    
    // 获取当前玩家状态详情（用于判断状态是否变化）
    const currentPhysicalStatus = gameState.playerStatus?.physical || ['健康'];
    const currentSocialStatus = gameState.playerStatus?.social || ['普通'];
    
    // Boss状态信息（已注释 - Boss LLM功能已停用）
    // const bossStatusInfo = `
    // [BOSS STATUS]
    // - Boss Location: ${bossAgent.locationId}
    // - Boss HP: ${bossAgent.hp}
    // - Boss State: ${bossAgent.state}
    // - Same Location as Player: ${bossAgent.isAtSameLocation(gameState.currentLocationId)}
    // - In Combat: ${gameState.inCombat}
    // `;
    const bossStatusInfo = `[BOSS STATUS - 已停用]`;

    // 获取最近的对话历史
    const recentDialogue = (gameState.conversationMemory.llmDialogueHistory || []).slice(-5);
    
    // 获取最近的后果裁决历史
    const recentJudgments = (gameState.consequenceJudge.history || []).slice(-5);
    
    // 获取上一步的行动总结（用于更新）
    // 如果gameState中没有，尝试从localStorage加载
    let previousActionSummary = gameState.consequenceJudge.actionSummary;
    if (!previousActionSummary) {
        try {
            const saved = localStorage.getItem('consequenceJudgeActionSummary');
            if (saved) {
                previousActionSummary = saved;
                gameState.consequenceJudge.actionSummary = saved;
                console.log('[ConsequenceJudge] 已从localStorage加载行动总结');
            }
        } catch (e) {
            console.warn('[ConsequenceJudge] 加载行动总结失败:', e);
        }
    }
    
    const context = `
==============================================================
                【后果裁决上下文】
==============================================================

[当前回合]: ${gameState.turnNumber}
[玩家行为]: "${userAction}"
[玩家当前位置]: ${gameState.currentLocationId}

==============================================================
                【上一步行动总结（用于更新）】
==============================================================

${previousActionSummary ? `[Previous Action Summary]: ${previousActionSummary}` : '[Previous Action Summary]: 无（这是第一步，请从当前行为开始总结）'}

【重要】在STEP 8行动总结更新时，必须：
1. 如果存在上一步总结，基于上一步总结进行更新和扩展
2. 如果不存在上一步总结，从当前行为开始创建新的总结
3. 总结应该连贯地反映玩家的行动历程，有机地融合新信息

==============================================================
                【玩家当前状态（用于判断是否变化）】
==============================================================

[当前身体状态]: ${currentPhysicalStatus.join('、') || '健康'}
[当前社会状态]: ${currentSocialStatus.join('、') || '普通'}
[完整状态描述]: ${playerStatus}
[玩家HP]: ${gameState.playerHP}/100
[玩家MP]: ${gameState.playerMP || 0}/100
[战斗状态]: ${gameState.inCombat ? '战斗中' : '非战斗'}

【重要】在STEP 6状态提取时，必须：
1. 先检查当前状态（上方已提供）
2. 分析叙事和游戏状态，判断状态是否发生变化
3. 如果状态没有明显变化，保持原有状态（输出当前状态）
4. 如果状态有明显变化，输出新状态

==============================================================
                【主LLM叙事结果】
==============================================================

${narrativeResult.narrative || '无叙事文本'}

[HP变化]: ${narrativeResult.player_hp_change || 0}
[MP变化]: ${narrativeResult.player_mp_change || 0}

==============================================================
                【Boss状态】
==============================================================

${bossStatusInfo}

==============================================================
                【最近对话历史 - 最近5条】
==============================================================

${recentDialogue.length > 0 ? 
recentDialogue.map((entry, idx) => `[${idx + 1}] ${entry}`).join('\n\n') 
: '无对话历史'}

==============================================================
                【最近裁决历史 - 最近5条】
==============================================================

${recentJudgments.length > 0 ? 
recentJudgments.map((j, idx) => 
    `[${idx + 1}] Turn ${j.turn}: ${j.consequence_type || '无类型'} - ${j.summary || '无摘要'}`
).join('\n\n') 
: '无裁决历史'}

==============================================================
                【当前线索状态】
==============================================================

[已知线索数量]: ${gameState.investigation.knownClues?.length || 0}
[已找到证据数量]: ${ClueManager ? ClueManager.getAllFoundClues(gameState.currentClueTrees).length : 0}

`;
    return context;
}

// ========== 后果裁决LLM（核心函数）==========
async function callConsequenceJudgeLLM(userAction, narrativeResult, gameState) {
    const context = getConsequenceJudgeContext(userAction, narrativeResult, gameState);
    
    const prompt = `
${context}

==============================================================
                    【裁决任务】
==============================================================

你需要使用【思维链】模式，逐步分析玩家行为的后果，并做出裁决。

${getConsequenceJudgeInstruction()}
`;

    if (window.logLlmConsoleInput) {
        window.logLlmConsoleInput('consequence-judge', 'system', CONSEQUENCE_JUDGE_SYSTEM_PROMPT);
        window.logLlmConsoleInput('consequence-judge', 'user', prompt);
    }
    
    try {
        const response = await fetch(API_CONFIG.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_CONFIG.key}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    { role: "system", content: CONSEQUENCE_JUDGE_SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error("Consequence Judge LLM API Error");
        const data = await response.json();
        let content = data.choices[0].message.content;

        console.log("[CONSEQUENCE JUDGE PROMPT]:", prompt);
        console.log("[CONSEQUENCE JUDGE RAW]:", content);
        
        if (window.logLlmConsole) {
            window.logLlmConsole('consequence-judge', 'output', content);
        }

        // 使用统一的JSON解析函数
        const result = parseLlmJsonResponse(content);

        // 规范化结果
        result.game_over = Boolean(result.game_over);
        result.ending_type = result.ending_type || null;
        result.warning = result.warning || null;
        result.consequence_type = result.consequence_type || 'normal';
        result.physical_status = result.physical_status || [];
        result.social_status = result.social_status || [];
        result.consequence_analysis = result.consequence_analysis || '';
        result.action_summary = result.action_summary || '';
        
        // 更新行动总结到gameState
        if (result.action_summary) {
            gameState.consequenceJudge.actionSummary = result.action_summary;
        }
        
        // 更新玩家状态
        if (result.physical_status && result.physical_status.length > 0) {
            PlayerStatusManager.updatePhysicalStatus(result.physical_status);
        }
        if (result.social_status && result.social_status.length > 0) {
            PlayerStatusManager.updateSocialStatus(result.social_status);
        }
        
        // 保存状态
        PlayerStatusManager.saveToLocalStorage();
        
        // 如果发出警告，记录并显示
        if (result.warning) {
            gameState.consequenceJudge.warnings.push({
                turn: gameState.turnNumber,
                warning: result.warning,
                timestamp: Date.now()
            });
            // 限制警告历史长度
            if (gameState.consequenceJudge.warnings.length > 20) {
                gameState.consequenceJudge.warnings = gameState.consequenceJudge.warnings.slice(-20);
            }
            // 显示警告
            appendLog(`[⚠️ 警告] ${result.warning}`, 'system', 'color: #ffaa00; font-weight: bold;');
        }
        
        // 如果游戏结束，更新游戏状态
        if (result.game_over) {
            gameState.isGameOver = true;
            console.log(`[CONSEQUENCE JUDGE] 游戏结束: ${result.ending_type}`);
        }
        
        // 存储裁决结果
        const judgmentRecord = {
            turn: gameState.turnNumber,
            action: userAction,
            thinking: result.thinking,
            consequence_type: result.consequence_type,
            game_over: result.game_over,
            ending_type: result.ending_type,
            warning: result.warning,
            physical_status: result.physical_status,
            social_status: result.social_status,
            consequence_analysis: result.consequence_analysis,
            action_summary: result.action_summary,
            timestamp: Date.now()
        };
        
        gameState.consequenceJudge.lastResult = judgmentRecord;
        gameState.consequenceJudge.history.push(judgmentRecord);
        
        // 限制历史长度
        if (gameState.consequenceJudge.history.length > 50) {
            gameState.consequenceJudge.history = gameState.consequenceJudge.history.slice(-50);
        }
        
        // 持久化存储裁决结果
        try {
            localStorage.setItem('consequenceJudgeHistory', JSON.stringify(
                gameState.consequenceJudge.history.slice(-20) // 只保存最近20条
            ));
            // 持久化存储行动总结
            if (gameState.consequenceJudge.actionSummary) {
                localStorage.setItem('consequenceJudgeActionSummary', gameState.consequenceJudge.actionSummary);
            }
        } catch (e) {
            console.warn('[ConsequenceJudge] 持久化存储失败:', e);
        }
        
        console.log(`[CONSEQUENCE JUDGE] 裁决完成: ${result.consequence_type}, 游戏结束=${result.game_over}, 警告=${result.warning ? '是' : '否'}`);
        
        return result;
    } catch (e) {
        console.error("[Consequence Judge LLM Error]:", e);
        if (window.logLlmConsole) {
            window.logLlmConsole('consequence-judge', 'output', `ERROR: ${e.message}`);
        }
        // 返回安全的默认值
        return {
            thinking: { error: e.message },
            game_over: false,
            ending_type: null,
            warning: null,
            consequence_type: 'normal',
            physical_status: [],
            social_status: [],
            consequence_analysis: '',
            action_summary: ''
        };
    }
}


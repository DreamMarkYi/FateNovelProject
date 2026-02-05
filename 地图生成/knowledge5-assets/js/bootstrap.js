// 12. 启动入口
function initBootstrap() {
    const playerInput = document.getElementById('player-input');
    if (playerInput) {
        playerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && typeof handleInput === 'function') {
                handleInput();
            }
        });
    }
}

// 初始化LLM历史管理器（全局实例）
if (typeof window !== 'undefined' && typeof LLMHistoryManager !== 'undefined') {
    window.llmHistoryManager = new LLMHistoryManager({
        basePath: './llm-history',
        maxEntriesPerFile: 1000,
        enableAutoSave: true
    });
    console.log('[Bootstrap] LLM历史管理器已初始化');
}

// 等待 DOM 加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initBootstrap();
        if (typeof initAllGraphs === 'function') {
            initAllGraphs();
        }
    });
} else {
    initBootstrap();
    if (typeof initAllGraphs === 'function') {
        initAllGraphs();
    }
}

window.onload = function() {
    if (typeof initAllGraphs === 'function') {
        initAllGraphs();
    }
};


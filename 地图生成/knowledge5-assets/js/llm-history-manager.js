// LLM对话历史管理器
// 用于分别存储每个LLM的完整对话历史（提示词和输出）到独立的JSON文件

class LLMHistoryManager {
    constructor(options = {}) {
        this.basePath = options.basePath || './llm-history';
        this.maxEntriesPerFile = options.maxEntriesPerFile || 1000;
        this.enableAutoSave = options.enableAutoSave !== false;
        this.scriptId = options.scriptId || null; // 剧本ID
        
        // 内存缓存：{ llmId: [] }
        this.cache = {};
        
        // 每个LLM的待保存队列和保存锁
        this.pendingQueues = {};
        this.saveLocks = {};
        
        this.initStorage();
        this.initAutoSave();
        this.initExitHandlers();
    }
    
    /**
     * 设置剧本ID（在剧本初始化时调用）
     * @param {string} scriptId - 剧本ID
     */
    setScriptId(scriptId) {
        if (!scriptId) {
            console.warn('[LLMHistoryManager] 剧本ID不能为空');
            return;
        }
        this.scriptId = scriptId;
        console.log(`[LLMHistoryManager] 已设置剧本ID: ${scriptId}`);
    }
    
    /**
     * 初始化存储系统
     */
    initStorage() {
        if (typeof window === 'undefined') {
            // Node.js环境：创建目录
            const fs = require('fs');
            const path = require('path');
            if (!fs.existsSync(this.basePath)) {
                fs.mkdirSync(this.basePath, { recursive: true });
            }
        } else {
            // 浏览器环境：初始化localStorage索引
            try {
                if (!localStorage.getItem('llmHistoryIndex')) {
                    localStorage.setItem('llmHistoryIndex', JSON.stringify({}));
                }
            } catch (e) {
                console.warn('[LLMHistoryManager] localStorage初始化失败:', e);
            }
        }
    }
    
    /**
     * 初始化自动保存机制（定时保存）
     */
    initAutoSave() {
        if (!this.enableAutoSave) return;
        
        // 定时保存：每30秒检查一次，即使未满10条也保存
        setInterval(() => {
            Object.keys(this.cache).forEach(llmId => {
                const cacheLength = this.cache[llmId]?.length || 0;
                if (cacheLength > 0 && !this.saveLocks[llmId]) {
                    console.log(`[LLMHistoryManager] 定时保存触发: ${llmId} (${cacheLength}条)`);
                    this.saveAsync(llmId);
                }
            });
        }, 30000); // 30秒
    }
    
    /**
     * 初始化退出处理（页面卸载前保存）
     */
    initExitHandlers() {
        if (typeof window === 'undefined') return;
        
        // 页面卸载前保存所有数据
        window.addEventListener('beforeunload', () => {
            this.saveAllSync();
        });
        
        // 页面隐藏时保存（移动端）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveAll();
            }
        });
    }
    
    /**
     * 记录一次LLM对话（非阻塞，立即返回）
     * @param {string} llmId - LLM标识符（如：'main', 'worldgen', 'semantic'等）
     * @param {Object} data - 对话数据
     * @param {string} data.systemPrompt - 系统提示词
     * @param {string} data.userPrompt - 用户提示词
     * @param {string} data.output - LLM输出
     * @param {Object} data.metadata - 可选的元数据（如turn, timestamp等）
     */
    record(llmId, data) {
        if (!llmId || !data) {
            console.warn('[LLMHistoryManager] 无效的参数');
            return;
        }
        
        if (!this.scriptId) {
            console.warn('[LLMHistoryManager] 剧本ID未设置，无法记录历史');
            return;
        }
        
        const entry = {
            timestamp: Date.now(),
            turn: data.metadata?.turn || null,
            systemPrompt: data.systemPrompt || null,
            userPrompt: data.userPrompt || null,
            output: data.output || null,
            metadata: {
                ...data.metadata,
                llmId: llmId
            }
        };
        
        // 检查是否正在保存
        if (this.saveLocks[llmId]) {
            // 如果正在保存，添加到待保存队列
            if (!this.pendingQueues[llmId]) {
                this.pendingQueues[llmId] = [];
            }
            this.pendingQueues[llmId].push(entry);
            console.log(`[LLMHistoryManager] ${llmId} 正在保存，新记录已加入待保存队列`);
            return;
        }
        
        // 正常情况：添加到主缓存
        if (!this.cache[llmId]) {
            this.cache[llmId] = [];
        }
        this.cache[llmId].push(entry);
        
        // 达到10条时触发异步保存（不阻塞）
        if (this.enableAutoSave && this.cache[llmId].length >= 10) {
            if (typeof setImmediate !== 'undefined') {
                setImmediate(() => this.saveAsync(llmId));
            } else {
                queueMicrotask(() => this.saveAsync(llmId));
            }
        }
    }
    
    /**
     * 异步保存（非阻塞，后台执行）
     * @param {string} llmId - LLM标识符
     */
    async saveAsync(llmId) {
        // 检查是否正在保存（防止并发）
        if (this.saveLocks[llmId]) {
            return;
        }
        
        // 设置保存锁
        this.saveLocks[llmId] = true;
        
        try {
            // 步骤1：合并待保存队列到主缓存（不立即保存）
            if (this.pendingQueues[llmId] && this.pendingQueues[llmId].length > 0) {
                if (!this.cache[llmId]) {
                    this.cache[llmId] = [];
                }
                const pendingCount = this.pendingQueues[llmId].length;
                this.cache[llmId].push(...this.pendingQueues[llmId]);
                this.pendingQueues[llmId] = [];
                console.log(`[LLMHistoryManager] ${llmId} 待保存队列已合并 (${pendingCount}条)，当前缓存: ${this.cache[llmId].length}条`);
            }
            
            // 步骤2：检查是否需要保存（达到10条才保存）
            const cacheLength = this.cache[llmId]?.length || 0;
            
            if (cacheLength >= 10) {
                // 达到批量阈值，执行保存
                await this.save(llmId);
                
                // 保存完成后，检查是否有新的待保存记录
                if (this.pendingQueues[llmId] && this.pendingQueues[llmId].length > 0) {
                    // 递归保存（继续处理）
                    setImmediate(() => this.saveAsync(llmId));
                }
            } else if (cacheLength > 0) {
                // 未达到10条，等待更多记录（定时保存会处理）
                console.log(`[LLMHistoryManager] ${llmId} 缓存未满10条(${cacheLength}条)，等待更多记录或定时保存`);
            }
        } catch (error) {
            console.error(`[LLMHistoryManager] 保存 ${llmId} 失败:`, error);
        } finally {
            // 释放保存锁
            this.saveLocks[llmId] = false;
        }
    }
    
    /**
     * 保存指定LLM的历史记录到文件（内部方法，使用原子操作）
     * @param {string} llmId - LLM标识符
     */
    async save(llmId) {
        // 原子操作：快照+立即清空缓存（防止并发修改）
        let entriesToSave = [];
        if (this.cache[llmId] && this.cache[llmId].length > 0) {
            entriesToSave = [...this.cache[llmId]]; // 快照
            this.cache[llmId] = []; // 立即清空
        }
        
        // 如果快照为空，说明没有需要保存的数据
        if (entriesToSave.length === 0) {
            return;
        }
        
        if (!this.scriptId) {
            console.warn('[LLMHistoryManager] 剧本ID未设置，无法保存历史记录');
            // 保存失败，将数据放回缓存
            if (!this.cache[llmId]) {
                this.cache[llmId] = [];
            }
            this.cache[llmId].unshift(...entriesToSave);
            return;
        }
        
        const fileName = `${llmId}-${this.scriptId}.json`;
        const filePath = this.getFilePath(fileName);
        
        try {
            // 读取现有文件（如果存在）
            let existingData = { entries: [], metadata: {} };
            try {
                existingData = await this.loadFile(filePath);
            } catch (e) {
                // 文件不存在，使用默认值
            }
            
            // 合并新记录
            existingData.entries = existingData.entries.concat(entriesToSave);
            
            // 限制记录数量
            if (existingData.entries.length > this.maxEntriesPerFile) {
                existingData.entries = existingData.entries.slice(-this.maxEntriesPerFile);
            }
            
            // 更新元数据
            existingData.metadata = {
                llmId: llmId,
                scriptId: this.scriptId,
                lastUpdated: Date.now(),
                totalEntries: existingData.entries.length,
                firstEntryTime: existingData.entries[0]?.timestamp || null,
                lastEntryTime: existingData.entries[existingData.entries.length - 1]?.timestamp || null
            };
            
            // 异步写入文件
            await this.writeFileAsync(filePath, existingData);
            
            console.log(`[LLMHistoryManager] 已保存 ${entriesToSave.length} 条记录到 ${fileName}`);
        } catch (error) {
            // 如果保存失败，将数据放回缓存，避免丢失
            console.error(`[LLMHistoryManager] 保存失败，数据已放回缓存:`, error);
            if (!this.cache[llmId]) {
                this.cache[llmId] = [];
            }
            this.cache[llmId].unshift(...entriesToSave);
            throw error;
        }
    }
    
    /**
     * 保存所有LLM的历史记录（异步，并行保存）
     */
    async saveAll() {
        const llmIds = Object.keys(this.cache);
        // 并行保存所有LLM（每个LLM独立保存，不互相阻塞）
        const savePromises = llmIds.map(llmId => this.saveAsync(llmId));
        await Promise.allSettled(savePromises);
        console.log(`[LLMHistoryManager] 已保存所有 ${llmIds.length} 个LLM的历史记录`);
    }
    
    /**
     * 同步保存所有数据（用于退出前，会阻塞但确保数据不丢失）
     */
    saveAllSync() {
        Object.keys(this.cache).forEach(llmId => {
            // 合并待保存队列
            if (this.pendingQueues[llmId] && this.pendingQueues[llmId].length > 0) {
                if (!this.cache[llmId]) {
                    this.cache[llmId] = [];
                }
                this.cache[llmId].push(...this.pendingQueues[llmId]);
                this.pendingQueues[llmId] = [];
            }
            
            // 如果有数据，同步保存
            if (this.cache[llmId] && this.cache[llmId].length > 0) {
                try {
                    // 使用同步方式保存（浏览器环境使用同步localStorage）
                    this.saveSync(llmId);
                } catch (e) {
                    console.error(`[LLMHistoryManager] 同步保存失败:`, e);
                }
            }
        });
    }
    
    /**
     * 同步保存（用于退出前）
     * @param {string} llmId - LLM标识符
     */
    saveSync(llmId) {
        // 原子操作：快照+清空
        let entriesToSave = [];
        if (this.cache[llmId] && this.cache[llmId].length > 0) {
            entriesToSave = [...this.cache[llmId]];
            this.cache[llmId] = [];
        }
        
        if (entriesToSave.length === 0 || !this.scriptId) {
            return;
        }
        
        const fileName = `${llmId}-${this.scriptId}.json`;
        const filePath = this.getFilePath(fileName);
        
        try {
            // 读取现有文件
            let existingData = { entries: [], metadata: {} };
            try {
                if (typeof window === 'undefined') {
                    const fs = require('fs');
                    const content = fs.readFileSync(filePath, 'utf-8');
                    existingData = JSON.parse(content);
                } else {
                    const content = localStorage.getItem(filePath);
                    if (content) {
                        existingData = JSON.parse(content);
                    }
                }
            } catch (e) {
                // 文件不存在
            }
            
            // 合并数据
            existingData.entries = existingData.entries.concat(entriesToSave);
            
            // 限制记录数量
            if (existingData.entries.length > this.maxEntriesPerFile) {
                existingData.entries = existingData.entries.slice(-this.maxEntriesPerFile);
            }
            
            // 更新元数据
            existingData.metadata = {
                llmId: llmId,
                scriptId: this.scriptId,
                lastUpdated: Date.now(),
                totalEntries: existingData.entries.length,
                firstEntryTime: existingData.entries[0]?.timestamp || null,
                lastEntryTime: existingData.entries[existingData.entries.length - 1]?.timestamp || null
            };
            
            // 同步写入
            const jsonContent = JSON.stringify(existingData, null, 2);
            if (typeof window === 'undefined') {
                const fs = require('fs');
                fs.writeFileSync(filePath, jsonContent, 'utf-8');
            } else {
                localStorage.setItem(filePath, jsonContent);
                // 更新索引
                const index = JSON.parse(localStorage.getItem('llmHistoryIndex') || '{}');
                index[filePath] = {
                    llmId: existingData.metadata.llmId,
                    lastUpdated: existingData.metadata.lastUpdated,
                    totalEntries: existingData.metadata.totalEntries
                };
                localStorage.setItem('llmHistoryIndex', JSON.stringify(index));
            }
        } catch (error) {
            console.error(`[LLMHistoryManager] 同步保存失败:`, error);
            // 保存失败，放回缓存
            if (!this.cache[llmId]) {
                this.cache[llmId] = [];
            }
            this.cache[llmId].unshift(...entriesToSave);
        }
    }
    
    /**
     * 加载指定LLM的历史记录
     * @param {string} llmId - LLM标识符
     * @param {string} scriptId - 剧本ID（可选，默认使用当前剧本ID）
     * @param {number} limit - 限制返回的记录数（可选）
     * @returns {Object} 历史记录数据
     */
    async load(llmId, scriptId = null, limit = null) {
        const targetScriptId = scriptId || this.scriptId;
        if (!targetScriptId) {
            console.warn('[LLMHistoryManager] 剧本ID未设置，无法加载历史记录');
            return { entries: [], metadata: {} };
        }
        
        const fileName = `${llmId}-${targetScriptId}.json`;
        const filePath = this.getFilePath(fileName);
        
        try {
            const data = await this.loadFile(filePath);
            
            if (limit && data.entries.length > limit) {
                data.entries = data.entries.slice(-limit);
            }
            
            return data;
        } catch (e) {
            console.warn(`[LLMHistoryManager] 加载 ${llmId} 的历史记录失败:`, e);
            return { entries: [], metadata: {} };
        }
    }
    
    /**
     * 获取完整文件路径
     * @param {string} fileName - 文件名
     * @returns {string} 完整路径
     */
    getFilePath(fileName) {
        if (typeof window === 'undefined') {
            const path = require('path');
            return path.join(this.basePath, fileName);
        } else {
            return `llm_history_${fileName}`;
        }
    }
    
    /**
     * 读取文件
     * @param {string} filePath - 文件路径
     * @returns {Promise<Object>} 文件内容
     */
    async loadFile(filePath) {
        if (typeof window === 'undefined') {
            const fs = require('fs').promises;
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } else {
            const content = localStorage.getItem(filePath);
            if (!content) {
                throw new Error('文件不存在');
            }
            return JSON.parse(content);
        }
    }
    
    /**
     * 异步写入文件（浏览器环境优化，使用requestIdleCallback避免阻塞）
     * @param {string} filePath - 文件路径
     * @param {Object} data - 要写入的数据
     */
    async writeFileAsync(filePath, data) {
        const jsonContent = JSON.stringify(data, null, 2);
        
        if (typeof window === 'undefined') {
            // Node.js环境：使用异步文件系统
            const fs = require('fs').promises;
            await fs.writeFile(filePath, jsonContent, 'utf-8');
        } else {
            // 浏览器环境：使用 requestIdleCallback 或 setTimeout 避免阻塞主线程
            return new Promise((resolve, reject) => {
                const writeOperation = () => {
                    try {
                        localStorage.setItem(filePath, jsonContent);
                        
                        // 更新索引
                        const index = JSON.parse(localStorage.getItem('llmHistoryIndex') || '{}');
                        index[filePath] = {
                            llmId: data.metadata.llmId,
                            lastUpdated: data.metadata.lastUpdated,
                            totalEntries: data.metadata.totalEntries
                        };
                        localStorage.setItem('llmHistoryIndex', JSON.stringify(index));
                        resolve();
                    } catch (e) {
                        console.error('[LLMHistoryManager] 保存失败:', e);
                        reject(e);
                    }
                };
                
                // 使用 requestIdleCallback 在浏览器空闲时执行，避免阻塞
                if (typeof requestIdleCallback !== 'undefined') {
                    requestIdleCallback(writeOperation, { timeout: 1000 });
                } else {
                    // 降级到 setTimeout，确保异步执行
                    setTimeout(writeOperation, 0);
                }
            });
        }
    }
    
    /**
     * 写入文件（已废弃，使用 writeFileAsync 代替）
     * @deprecated 使用 writeFileAsync 代替
     */
    async writeFile(filePath, data) {
        return this.writeFileAsync(filePath, data);
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.LLMHistoryManager = LLMHistoryManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLMHistoryManager;
}


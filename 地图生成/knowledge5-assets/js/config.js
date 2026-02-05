// 1. 配置
const API_CONFIG = {
    url: "https://hk-api.gptbest.vip/v1/chat/completions",
    key: "sk-D7OWUqvBcM500TgnC4UBixNKHiiguyppWdSw11xgVjKVDdFU",
    model: "gemini-3-flash-preview-thinking-*"
};


// 1.1 线索树结构定义 (迷雾侦探模式)
// 状态定义 (status) - 由语义LLM更新:
// "unknown" = 完全未知，UI不显示，LLM不提及
// "rumored" = 有人提到过/有传闻，UI显示为"???"
// "hinted" = 有明确线索指向，UI显示名称但标记"未验证"
// "found" = 已找到物理证据（仅叶子节点使用）
// "verified" = 已验证/整合完成（叶子节点被发现后直接设为verified）
//
// hintable 字段判断规则:
// 1. status 为 rumored/hinted 之一（found/verified 已完成，不需要提示）
// 2. 如果 status 是 hinted，需要检查所在 location_graph 节点 is_visible=true
//    （rumored 状态的传闻不受地点可见性限制）
// 3. 如果是父节点，所有子节点必须为 verified
const CLUE_STATUS = {
    UNKNOWN: 'unknown',
    RUMORED: 'rumored',
    HINTED: 'hinted',
    FOUND: 'found',
    VERIFIED: 'verified'
};

const STAGE_CONFIG = {
    1: {
        name: "贫民窟的数据泄露",
        required_count: 2,
        boss_start: "loc_start_perimeter",
        
        // 入口线索（玩家最初能接触到的传闻）
        entry_clues: ["rumor_data_leak", "rumor_gang_activity"],
        
        // NPC配置
        // spawn_phase: "initial" = 游戏开始时分配, "dynamic" = 根据剧情动态出现
        // spawn_trigger: 动态NPC的触发条件描述（供LLM判断）
        npcs: [
            { 
                id: "npc_bartender", 
                name: "马飞飞",
                location: null,
                knows: ["leaf_antenna", "rumor_chip"],
                trust_threshold: 0,
                spawn_phase: "dynamic",
                desc: "酒吧老板，消息灵通"
            },
            {
                id: "npc_hacker",
                name: "伍栩栩",
                location: null,
                knows: ["leaf_frequency", "clue_decoder"],
                trust_threshold: 1,
                spawn_phase: "dynamic",
                desc: "神秘黑客，需要通过特定方式接触。触发条件：玩家询问关于黑客/技术/信号/解密相关话题"
            },
            {
                id: "npc_informant",
                name: "严杰杰",
                location: null,
                knows: ["leaf_bodyguard_log", "leaf_vip_receipt"],
                trust_threshold: 0,
                spawn_phase: "dynamic",
                desc: "线人，了解高层动向。触发条件：玩家探索高层/保镖/VIP相关线索后"
            }
        ],
        
        keypoint_trees: [
            {
                id: "kp_chip",
                name: "加密芯片",
                desc: "包含帮派核心数据的芯片",
                status: "unknown",
                hintable: false,
                discovery_hint: "需要找到信号源和解码器两条线索",
                children: [
                    {
                        id: "clue_signal_source",
                        name: "异常信号源",
                        desc: "芯片发出的特殊信号",
                        status: "unknown",
                        hintable: false,
                        discovery_conditions: [
                            "玩家在有信号干扰的区域使用扫描设备",
                            "玩家询问NPC关于奇怪的无线电信号"
                        ],
                        children: [
                            { 
                                id: "leaf_antenna", 
                                name: "折断的军用天线", 
                                desc: "高规格天线，指向地下",
                                status: "rumored",
                                hintable: false,
                                children: [] 
                            },
                            { 
                                id: "leaf_frequency", 
                                name: "干扰频段记录", 
                                desc: "记录奇怪赫兹数的便签",
                                status: "rumored",
                                hintable: false,
                                location_hint: "电线杆或通讯设备附近",
                                search_difficulty: "easy",
                                prerequisites: [],
                                children: [] 
                            }
                        ]
                    },
                    {
                        id: "clue_decoder",
                        name: "解密算法盘",
                        desc: "读取芯片必须的插件",
                        status: "rumored",
                        hintable: false,
                        location_hint: "黑客的藏身处",
                        search_difficulty: "hard",
                        prerequisites: ["leaf_frequency"],
                        children: []
                    }
                ]
            },
            {
                id: "kp_id_card",
                name: "高层门禁卡",
                desc: "通往公司广场的通行证",
                status: "unknown",
                hintable: false,
                discovery_hint: "需要找到高层的行踪线索",
                children: [
                    {
                        id: "leaf_bodyguard_log",
                        name: "保镖的行程表",
                        desc: "电子版日志，记录了高层今晚会去'红灯区'",
                        status: "rumored",
                        hintable: false,
                        location_hint: "保镖休息的地方",
                        search_difficulty: "medium",
                        prerequisites: [],
                        children: []
                    },
                    {
                        id: "leaf_vip_receipt",
                        name: "VIP消费凭证",
                        desc: "一张沾血的收据，上面有高层的签名",
                        status: "rumored",
                        hintable: false,
                        location_hint: "红灯区的高级场所",
                        search_difficulty: "hard",
                        prerequisites: ["leaf_bodyguard_log"],
                        children: []
                    }
                ]
            },
            {
                id: "kp_evidence",
                name: "行贿录音",
                desc: "证明高层腐败的关键证据",
                status: "unknown",
                hintable: false,
                discovery_hint: "需要找到录音设备",
                children: [
                    { 
                        id: "leaf_recorder", 
                        name: "损坏的录音笔", 
                        desc: "电池仓里藏着内存卡",
                        status: "rumored",
                        hintable: false,
                        location_hint: "废弃的办公区域",
                        search_difficulty: "medium",
                        prerequisites: [],
                        children: [] 
                    }
                ]
            }
        ]
    },
    2: {
        name: "公司广场的阴谋",
        required_count: 2,
        boss_start: "loc_security_hub",
        entry_clues: ["rumor_server_breach"],
        npcs: [
            {
                id: "npc_guard",
                name: "离职保安老王",
                location: null,
                knows: ["leaf_admin_fingerprint", "leaf_pwd_hint"],
                trust_threshold: 1,
                spawn_phase: "initial",
                desc: "被公司解雇的老保安，对公司心怀怨恨"
            },
            {
                id: "npc_insider",
                name: "匿名内鬼",
                location: null,
                knows: ["kp_biometric", "kp_prototype"],
                trust_threshold: 2,
                spawn_phase: "dynamic",
                desc: "公司内部人员，知道核心机密但行事谨慎。触发条件：玩家获取到服务器相关线索后，或在研发区域深入探索时"
            }
        ],
        keypoint_trees: [
            {
                id: "kp_server_access",
                name: "服务器密钥",
                desc: "访问核心服务器的凭证",
                status: "unknown",
                hintable: false,
                children: [
                    { 
                        id: "leaf_admin_fingerprint", 
                        name: "管理员指纹膜", 
                        desc: "从咖啡杯上提取的指纹",
                        status: "unknown",
                        hintable: false,
                        location_hint: "管理员常去的咖啡店",
                        search_difficulty: "hard",
                        prerequisites: [],
                        children: [] 
                    },
                    { 
                        id: "leaf_pwd_hint", 
                        name: "密码提示纸条", 
                        desc: "写着'生日倒序'",
                        status: "unknown",
                        hintable: false,
                        location_hint: "办公桌抽屉",
                        search_difficulty: "easy",
                        prerequisites: [],
                        children: [] 
                    }
                ]
            },
            { 
                id: "kp_biometric", 
                name: "生物样本", 
                desc: "绕过生物识别系统的样本",
                status: "unknown",
                hintable: false,
                location_hint: "医疗废弃物处理区",
                search_difficulty: "hard",
                prerequisites: [],
                children: [] 
            },
            { 
                id: "kp_prototype", 
                name: "原型组件", 
                desc: "公司秘密项目的关键零件",
                status: "unknown",
                hintable: false,
                location_hint: "研发实验室",
                search_difficulty: "hard",
                prerequisites: [],
                children: [] 
            }
        ]
    }
};

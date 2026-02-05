/**
 * 开放世界Demo - 高中校园世界数据
 * 包含角色、地点、知识图谱、初始状态等
 */

// ==================== 地点定义 ====================
const LOCATIONS = {
    classroom_1a: {
        id: 'classroom_1a',
        name: '1年A班教室',
        description: '明亮的教室，窗边能看到操场。课桌整齐排列，黑板上还留着昨天的板书。',
        type: 'indoor',
        tags: ['学习', '日常', '安全'],
        connectedTo: ['hallway_1f', 'classroom_1b'],
        unlockChapter: 1,
        position: { x: 150, y: 200 },
        ambiance: '教室',
        availableActions: ['交谈', '学习', '观察', '休息']
    },
    classroom_1b: {
        id: 'classroom_1b',
        name: '1年B班教室',
        description: '隔壁班的教室，门口常有学生聚集闲聊。',
        type: 'indoor',
        tags: ['学习', '日常', '安全'],
        connectedTo: ['hallway_1f', 'classroom_1a'],
        unlockChapter: 1,
        position: { x: 250, y: 200 },
        ambiance: '教室',
        availableActions: ['交谈', '观察']
    },
    hallway_1f: {
        id: 'hallway_1f',
        name: '一楼走廊',
        description: '长长的走廊，两侧是教室。墙上贴满了社团招新海报和学校通知。',
        type: 'indoor',
        tags: ['通道', '日常'],
        connectedTo: ['classroom_1a', 'classroom_1b', 'stairwell', 'entrance'],
        unlockChapter: 1,
        position: { x: 200, y: 250 },
        ambiance: '走廊',
        availableActions: ['移动', '观察']
    },
    stairwell: {
        id: 'stairwell',
        name: '楼梯间',
        description: '连接各楼层的楼梯。台阶上偶尔能看到被遗落的笔记本或发卡。',
        type: 'indoor',
        tags: ['通道'],
        connectedTo: ['hallway_1f', 'hallway_2f', 'rooftop'],
        unlockChapter: 1,
        position: { x: 300, y: 250 },
        ambiance: '楼梯',
        availableActions: ['移动']
    },
    hallway_2f: {
        id: 'hallway_2f',
        name: '二楼走廊',
        description: '二楼走廊，学生会办公室就在这里。气氛比一楼安静许多。',
        type: 'indoor',
        tags: ['通道', '学生会'],
        connectedTo: ['stairwell', 'student_council', 'library'],
        unlockChapter: 1,
        position: { x: 300, y: 150 },
        ambiance: '走廊',
        availableActions: ['移动', '观察']
    },
    student_council: {
        id: 'student_council',
        name: '学生会办公室',
        description: '布置整洁的办公室，文件堆叠在桌上。墙上挂着历届学生会主席的照片。',
        type: 'indoor',
        tags: ['学生会', '重要'],
        connectedTo: ['hallway_2f'],
        unlockChapter: 1,
        position: { x: 400, y: 150 },
        ambiance: '办公室',
        availableActions: ['交谈', '调查', '观察']
    },
    library: {
        id: 'library',
        name: '图书馆',
        description: '安静的图书馆，书架之间弥漫着旧书的气息。深处似乎有个禁止入内的区域。',
        type: 'indoor',
        tags: ['学习', '安静', '神秘'],
        connectedTo: ['hallway_2f', 'library_restricted'],
        unlockChapter: 1,
        position: { x: 200, y: 100 },
        ambiance: '图书馆',
        availableActions: ['阅读', '交谈', '调查', '观察']
    },
    library_restricted: {
        id: 'library_restricted',
        name: '图书馆禁区',
        description: '被锁着的房间，玻璃门后能隐约看到古旧的书籍和奇怪的图案。',
        type: 'indoor',
        tags: ['神秘', '危险', '锁定'],
        connectedTo: ['library'],
        unlockChapter: 3,
        position: { x: 200, y: 50 },
        ambiance: '神秘',
        availableActions: ['调查', '观察']
    },
    entrance: {
        id: 'entrance',
        name: '学校正门',
        description: '城南高中的正门，两侧是高大的银杏树。门卫室里总是飘出茶香。',
        type: 'outdoor',
        tags: ['入口', '日常'],
        connectedTo: ['hallway_1f', 'playground', 'garden'],
        unlockChapter: 1,
        position: { x: 200, y: 350 },
        ambiance: '室外',
        availableActions: ['移动', '观察']
    },
    playground: {
        id: 'playground',
        name: '操场',
        description: '宽阔的操场，跑道环绕着足球场。放学后常有社团在这里活动。',
        type: 'outdoor',
        tags: ['运动', '开放', '日常'],
        connectedTo: ['entrance', 'gym', 'equipment_room'],
        unlockChapter: 1,
        position: { x: 100, y: 400 },
        ambiance: '室外',
        availableActions: ['运动', '交谈', '观察', '休息']
    },
    gym: {
        id: 'gym',
        name: '体育馆',
        description: '室内体育馆，篮球场和排球场俱全。器材室的门似乎总是虚掩着。',
        type: 'indoor',
        tags: ['运动', '日常'],
        connectedTo: ['playground'],
        unlockChapter: 1,
        position: { x: 50, y: 450 },
        ambiance: '体育馆',
        availableActions: ['运动', '交谈', '观察']
    },
    equipment_room: {
        id: 'equipment_room',
        name: '器材室',
        description: '堆满体育器材的房间，角落里堆着积灰的旧箱子，似乎很久没人动过。',
        type: 'indoor',
        tags: ['储藏', '神秘'],
        connectedTo: ['playground'],
        unlockChapter: 1,
        position: { x: 50, y: 350 },
        ambiance: '储藏室',
        availableActions: ['调查', '观察']
    },
    garden: {
        id: 'garden',
        name: '后花园',
        description: '学校后面的小花园，种满了各种花草。园艺社的学生常在这里照料植物。',
        type: 'outdoor',
        tags: ['安静', '自然', '休闲'],
        connectedTo: ['entrance', 'old_building'],
        unlockChapter: 1,
        position: { x: 350, y: 400 },
        ambiance: '花园',
        availableActions: ['休息', '交谈', '观察']
    },
    old_building: {
        id: 'old_building',
        name: '旧教学楼',
        description: '废弃的旧教学楼，据说是"第七教学楼"。铁门上挂着"禁止入内"的牌子。',
        type: 'outdoor',
        tags: ['神秘', '危险', '传说'],
        connectedTo: ['garden'],
        unlockChapter: 2,
        position: { x: 400, y: 450 },
        ambiance: '废墟',
        availableActions: ['调查', '观察']
    },
    rooftop: {
        id: 'rooftop',
        name: '天台',
        description: '学校顶楼的天台，能俯瞰整个校园。傍晚时分景色特别美。',
        type: 'outdoor',
        tags: ['安静', '开放', '私密'],
        connectedTo: ['stairwell'],
        unlockChapter: 1,
        position: { x: 350, y: 200 },
        ambiance: '天台',
        availableActions: ['休息', '交谈', '观察', '思考']
    },
    cafeteria: {
        id: 'cafeteria',
        name: '食堂',
        description: '学校食堂，午餐时间总是人满为患。窗口阿姨的红烧肉是招牌。',
        type: 'indoor',
        tags: ['日常', '社交', '食物'],
        connectedTo: ['entrance'],
        unlockChapter: 1,
        position: { x: 100, y: 300 },
        ambiance: '食堂',
        availableActions: ['用餐', '交谈', '观察']
    }
};

// ==================== 角色定义 ====================
const CHARACTERS = {
    player: {
        id: 'player',
        name: '林渊',
        role: 'protagonist',
        description: '刚转学来城南高中的高一学生。性格温和但观察力敏锐。',
        personality: ['好奇', '冷静', '善良'],
        faction: 'neutral',
        currentLocation: 'classroom_1a',
        stats: {
            reputation: 50,
            knowledge: 30,
            courage: 40,
            social: 35
        },
        relationships: {},
        inventory: ['学生证', '手机', '笔记本'],
        secrets: []
    },
    su_meng: {
        id: 'su_meng',
        name: '苏梦',
        role: 'student_council_president',
        description: '学生会主席，成绩优异，做事雷厉风行。似乎对学校的某些事情讳莫如深。',
        personality: ['严肃', '负责', '神秘'],
        faction: 'student_council',
        currentLocation: 'student_council',
        defaultSchedule: {
            morning: 'classroom_1a',
            noon: 'student_council',
            afternoon: 'student_council',
            evening: 'library'
        },
        stats: { influence: 90, trust: 30 },
        relationships: {
            player: { affinity: 0, trust: 20, status: '陌生人' }
        },
        dialogueStyle: '正式、简洁，偶尔流露出疲惫',
        secrets: ['知道第七教学楼的真相', '三年前的学生失踪事件参与者'],
        availableTopics: ['学生会', '学校规则', '社团活动'],
        forbiddenTopics: ['第七教学楼', '三年前的事件']
    },
    chen_yang: {
        id: 'chen_yang',
        name: '陈阳',
        role: 'classmate',
        description: '活泼开朗的同桌，对学校的八卦了如指掌。虽然成绩一般，但人缘极好。',
        personality: ['热情', '八卦', '仗义'],
        faction: 'neutral',
        currentLocation: 'classroom_1a',
        defaultSchedule: {
            morning: 'classroom_1a',
            noon: 'cafeteria',
            afternoon: 'playground',
            evening: 'classroom_1a'
        },
        stats: { influence: 40, trust: 60 },
        relationships: {
            player: { affinity: 30, trust: 40, status: '同学' }
        },
        dialogueStyle: '随意、热情，喜欢用流行语',
        secrets: ['知道一些关于旧教学楼的传闻'],
        availableTopics: ['学校八卦', '同学关系', '游戏', '漫画'],
        forbiddenTopics: []
    },
    lin_xiaoxue: {
        id: 'lin_xiaoxue',
        name: '林小雪',
        role: 'mysterious_senior',
        description: '高三的神秘学姐，总是独来独往。常在图书馆深处看一些古旧的书籍。',
        personality: ['神秘', '冷淡', '博学'],
        faction: 'unknown',
        currentLocation: 'library',
        defaultSchedule: {
            morning: 'library',
            noon: 'garden',
            afternoon: 'library',
            evening: 'rooftop'
        },
        stats: { influence: 60, trust: 10 },
        relationships: {
            player: { affinity: 0, trust: 0, status: '陌生人' }
        },
        dialogueStyle: '简短、意味深长，经常说一些让人费解的话',
        secrets: ['研究学校的超自然现象', '与第七教学楼有某种联系'],
        availableTopics: ['书籍', '学校历史', '神秘学'],
        forbiddenTopics: ['个人背景', '家庭']
    },
    wang_laoban: {
        id: 'wang_laoban',
        name: '王老板',
        role: 'librarian',
        description: '图书馆管理员，外号"王老板"。看似普通的中年人，但对学校历史了如指掌。',
        personality: ['和蔼', '博学', '守密'],
        faction: 'staff',
        currentLocation: 'library',
        defaultSchedule: {
            morning: 'library',
            noon: 'library',
            afternoon: 'library',
            evening: 'library'
        },
        stats: { influence: 50, trust: 40 },
        relationships: {
            player: { affinity: 10, trust: 30, status: '认识' }
        },
        dialogueStyle: '温和、有条理，喜欢引经据典',
        secrets: ['保管着禁区的钥匙', '了解学校所有的秘密'],
        availableTopics: ['图书推荐', '学校历史', '学习建议'],
        forbiddenTopics: ['图书馆禁区', '三年前的事件']
    },
    liu_feng: {
        id: 'liu_feng',
        name: '刘枫',
        role: 'sports_star',
        description: '学校篮球队队长，阳光帅气，深受女生欢迎。性格直爽，不喜欢绕弯子。',
        personality: ['热血', '直爽', '重义气'],
        faction: 'sports_club',
        currentLocation: 'playground',
        defaultSchedule: {
            morning: 'classroom_1b',
            noon: 'cafeteria',
            afternoon: 'gym',
            evening: 'playground'
        },
        stats: { influence: 70, trust: 50 },
        relationships: {
            player: { affinity: 0, trust: 30, status: '陌生人' }
        },
        dialogueStyle: '豪爽、直接，常用运动术语',
        secrets: ['曾在旧教学楼看到过奇怪的东西'],
        availableTopics: ['篮球', '运动', '比赛'],
        forbiddenTopics: []
    },
    zhao_yun: {
        id: 'zhao_yun',
        name: '赵云',
        role: 'quiet_girl',
        description: '安静内向的女生，总是坐在教室角落。画画很厉害，但很少与人交流。',
        personality: ['内向', '敏感', '艺术'],
        faction: 'art_club',
        currentLocation: 'classroom_1a',
        defaultSchedule: {
            morning: 'classroom_1a',
            noon: 'garden',
            afternoon: 'classroom_1a',
            evening: 'art_room'
        },
        stats: { influence: 20, trust: 20 },
        relationships: {
            player: { affinity: 0, trust: 10, status: '陌生人' }
        },
        dialogueStyle: '简短、害羞，经常停顿',
        secrets: ['画过很多关于学校神秘事件的画'],
        availableTopics: ['绘画', '艺术', '风景'],
        forbiddenTopics: ['社交', '公开场合']
    }
};

// ==================== 知识图谱 (简化版) ====================
const KNOWLEDGE_GRAPH = {
    // 节点
    nodes: {
        // 事件节点
        evt_transfer: {
            id: 'evt_transfer',
            type: 'Event',
            name: '林渊转学',
            chapter: 1,
            timestamp: 'Day1',
            description: '主角转学到城南高中'
        },
        evt_missing_3years: {
            id: 'evt_missing_3years',
            type: 'Event',
            name: '三年前失踪事件',
            chapter: 3,
            timestamp: '3YearsAgo',
            description: '三年前有学生在旧教学楼神秘失踪',
            isSecret: true,
            revealCondition: 'trust_su_meng >= 60'
        },
        evt_building_sealed: {
            id: 'evt_building_sealed',
            type: 'Event',
            name: '旧教学楼封锁',
            chapter: 2,
            timestamp: '3YearsAgo',
            description: '第七教学楼在失踪事件后被封锁'
        },
        // 传说/设定节点
        lore_building7: {
            id: 'lore_building7',
            type: 'Lore',
            name: '第七教学楼传说',
            description: '传说第七教学楼在满月之夜会出现奇怪的光芒',
            isPublic: true
        },
        lore_school_history: {
            id: 'lore_school_history',
            type: 'Lore',
            name: '城南高中历史',
            description: '城南高中建于1950年，前身是一座私塾',
            isPublic: true
        },
        // 物品节点
        item_old_key: {
            id: 'item_old_key',
            type: 'Object',
            name: '古老的钥匙',
            location: 'library_restricted',
            description: '一把造型古怪的钥匙，似乎能打开某扇门'
        },
        item_diary: {
            id: 'item_diary',
            type: 'Object',
            name: '神秘日记',
            location: 'equipment_room',
            description: '一本旧日记，记录着三年前的事情'
        }
    },
    // 关系边
    edges: [
        { from: 'su_meng', to: 'evt_missing_3years', relation: '知晓', validFrom: 'Chapter1' },
        { from: 'lin_xiaoxue', to: 'lore_building7', relation: '研究', validFrom: 'Chapter1' },
        { from: 'wang_laoban', to: 'item_old_key', relation: '保管', validFrom: 'Chapter1' },
        { from: 'evt_missing_3years', to: 'evt_building_sealed', relation: '导致', validFrom: 'Chapter1' },
        { from: 'old_building', to: 'lore_building7', relation: '关联', validFrom: 'Chapter1' },
        { from: 'zhao_yun', to: 'evt_missing_3years', relation: '目击', validFrom: 'Chapter1', isSecret: true }
    ]
};

// ==================== 时间系统 ====================
const TIME_SYSTEM = {
    periods: ['早晨', '上午', '中午', '下午', '傍晚', '夜晚'],
    periodConfig: {
        '早晨': { start: 6, end: 8, ambiance: 'morning', activities: ['上学', '早读'] },
        '上午': { start: 8, end: 12, ambiance: 'day', activities: ['上课', '课间'] },
        '中午': { start: 12, end: 14, ambiance: 'noon', activities: ['午餐', '午休'] },
        '下午': { start: 14, end: 17, ambiance: 'afternoon', activities: ['上课', '社团'] },
        '傍晚': { start: 17, end: 19, ambiance: 'evening', activities: ['放学', '社团活动'] },
        '夜晚': { start: 19, end: 22, ambiance: 'night', activities: ['自习', '回家'] }
    },
    currentDay: 1,
    currentPeriod: '上午',
    chapter: 1
};

// ==================== 事件模板 ====================
const EVENT_TEMPLATES = {
    // 日常事件
    daily: [
        {
            id: 'daily_chat',
            type: 'SOCIAL',
            title: '闲聊时光',
            triggerConditions: { location: ['classroom_1a', 'cafeteria'], period: ['中午', '课间'] },
            template: '${npc_name}主动找你搭话，似乎想聊聊${topic}。'
        },
        {
            id: 'daily_study',
            type: 'STUDY',
            title: '学习时间',
            triggerConditions: { location: ['classroom_1a', 'library'], period: ['上午', '下午'] },
            template: '可以专心学习，提升知识值。'
        },
        {
            id: 'daily_rest',
            type: 'REST',
            title: '休息片刻',
            triggerConditions: { location: ['rooftop', 'garden'], period: ['中午', '傍晚'] },
            template: '找个安静的地方休息，恢复精力。'
        }
    ],
    // 特殊事件
    special: [
        {
            id: 'sp_strange_sound',
            type: 'MYSTERY',
            title: '奇怪的声音',
            triggerConditions: { 
                location: ['old_building', 'library'], 
                period: ['傍晚', '夜晚'],
                minChapter: 1
            },
            template: '你听到了从${direction}传来的奇怪声音...',
            consequences: { knowledge: 5, courage: -3 }
        },
        {
            id: 'sp_meet_senior',
            type: 'ENCOUNTER',
            title: '偶遇学姐',
            triggerConditions: { 
                location: ['library', 'rooftop'], 
                period: ['傍晚'],
                requiredRelationship: { lin_xiaoxue: { affinity: { min: 0 } } }
            },
            template: '神秘的学姐林小雪出现在这里，她似乎在看着什么。'
        }
    ],
    // 冲突事件
    conflict: [
        {
            id: 'cf_confrontation',
            type: 'CONFLICT',
            title: '意外冲突',
            triggerConditions: { tensionLevel: { min: 70 } },
            template: '气氛突然紧张起来，${antagonist}似乎对你有所不满。'
        }
    ]
};

// ==================== 对话系统模板 ====================
const DIALOGUE_SYSTEM = {
    // 通用对话选项
    commonOptions: [
        { id: 'greet', text: '打招呼', effect: { affinity: 1 } },
        { id: 'ask_info', text: '询问情况', effect: { knowledge: 1 } },
        { id: 'leave', text: '告辞离开', effect: {} }
    ],
    // 特殊对话条件
    specialDialogues: {
        su_meng: {
            unlock_conditions: [
                { condition: 'affinity >= 30', dialogue_id: 'su_meng_personal' },
                { condition: 'trust >= 50', dialogue_id: 'su_meng_secret' },
                { condition: 'has_item:item_diary', dialogue_id: 'su_meng_confrontation' }
            ]
        },
        lin_xiaoxue: {
            unlock_conditions: [
                { condition: 'location == library && period == evening', dialogue_id: 'lin_secret_research' },
                { condition: 'knowledge >= 60', dialogue_id: 'lin_acknowledge' }
            ]
        }
    }
};

// ==================== 预生成内容池 ====================
const PREGENERATED_CONTENT = {
    // 闲聊对话 (按角色分类)
    casual_dialogues: {
        chen_yang: [
            {
                context: 'first_meeting',
                dialogue: [
                    { speaker: 'chen_yang', text: '哟！新来的同学吧？我叫陈阳，以后就是同桌了！' },
                    { speaker: 'chen_yang', text: '有什么不懂的尽管问我，这学校的事我可门儿清！' }
                ]
            },
            {
                context: 'daily_greeting',
                dialogue: [
                    { speaker: 'chen_yang', text: '今天的课好无聊啊，中午一起去食堂？' },
                    { speaker: 'chen_yang', text: '听说今天有红烧肉，得早点去占位子！' }
                ]
            },
            {
                context: 'gossip',
                dialogue: [
                    { speaker: 'chen_yang', text: '诶，你知道吗？那个旧教学楼...' },
                    { speaker: 'chen_yang', text: '据说晚上会有奇怪的光从里面透出来！' },
                    { speaker: 'chen_yang', text: '不过我可没敢去看，那地方太瘆人了。' }
                ]
            }
        ],
        su_meng: [
            {
                context: 'formal_meeting',
                dialogue: [
                    { speaker: 'su_meng', text: '你就是新转来的林渊同学？我是学生会主席苏梦。' },
                    { speaker: 'su_meng', text: '有任何关于学校的问题可以来学生会咨询。' },
                    { speaker: 'su_meng', text: '另外...有些地方最好不要随便乱闯。' }
                ]
            },
            {
                context: 'busy',
                dialogue: [
                    { speaker: 'su_meng', text: '抱歉，现在有点忙。有事的话改天再说吧。' }
                ]
            }
        ],
        lin_xiaoxue: [
            {
                context: 'library_encounter',
                dialogue: [
                    { speaker: 'lin_xiaoxue', text: '......' },
                    { speaker: 'lin_xiaoxue', text: '这里的书...不是所有人都能读懂的。' },
                    { speaker: 'lin_xiaoxue', text: '你...对这所学校的历史，有兴趣吗？' }
                ]
            },
            {
                context: 'rooftop_meeting',
                dialogue: [
                    { speaker: 'lin_xiaoxue', text: '傍晚的天台...是观察这所学校最好的地方。' },
                    { speaker: 'lin_xiaoxue', text: '如果你足够仔细，或许能发现一些有趣的东西。' }
                ]
            }
        ],
        wang_laoban: [
            {
                context: 'greeting',
                dialogue: [
                    { speaker: 'wang_laoban', text: '哦，新同学啊。欢迎来到图书馆。' },
                    { speaker: 'wang_laoban', text: '这里有很多好书，随便看。不过...' },
                    { speaker: 'wang_laoban', text: '里面那个房间就别进去了，那是禁区。' }
                ]
            }
        ]
    },
    // 环境描述 (按地点和时间)
    environment_descriptions: {
        classroom_1a: {
            '早晨': '阳光透过窗户洒进教室，同学们陆续到来，课桌上堆着刚拿出来的课本。',
            '上午': '老师的声音在教室里回荡，有人认真听讲，有人偷偷打着瞌睡。',
            '中午': '下课铃响了，教室瞬间变得嘈杂起来，同学们三三两两离开去吃午饭。',
            '下午': '午后的教室有些昏昏欲睡，风扇呼呼地转着，带来一丝凉意。',
            '傍晚': '夕阳的余晖将教室染成金色，留下来自习的同学不多了。',
            '夜晚': '教室已经空了，只有走廊的灯还亮着，投下长长的影子。'
        },
        library: {
            '早晨': '图书馆刚开门，空气中弥漫着书香和清晨的清新。',
            '上午': '几个学生在角落安静地自习，只有翻书声和笔尖划过纸面的声音。',
            '中午': '图书馆比较安静，大多数人都去吃饭了。',
            '下午': '阳光从高窗斜照进来，在书架间形成光柱，尘埃在光线中飞舞。',
            '傍晚': '图书馆的灯亮了起来，橙黄色的光让这里显得格外温馨。',
            '夜晚': '图书馆深处传来轻微的声响，在这个时间，禁区的门似乎在微微发光...'
        },
        rooftop: {
            '早晨': '天台上空无一人，远处的朝阳正缓缓升起。',
            '中午': '阳光直射，天台热得几乎站不住人。',
            '傍晚': '夕阳西下，整个校园被染成橘红色，景色美得让人窒息。',
            '夜晚': '月光如水，洒在空旷的天台上。远处的旧教学楼在月色下格外诡异。'
        },
        old_building: {
            '早晨': '即使在白天，这栋废弃的建筑也透着一股阴森的气息。',
            '傍晚': '夕阳将旧楼的影子拉得很长，像是要吞噬整个花园。',
            '夜晚': '黑暗中的旧教学楼似乎在等待着什么，偶尔能看到窗户后有微光闪过...'
        }
    },
    // 内心独白
    inner_thoughts: {
        arrival: [
            '城南高中...从今天开始，这里就是我的新学校了。',
            '听说这所学校有很多传说，不知道是真是假。',
            '希望能在这里交到朋友吧。'
        ],
        curiosity: [
            '那栋旧教学楼...总觉得有什么东西吸引着我。',
            '苏梦学姐说的"不要乱闯"，到底是指什么？',
            '林小雪学姐看的那些书...似乎不是普通的书籍。'
        ],
        tension: [
            '总觉得有人在暗中观察我...',
            '这所学校比看起来要复杂得多。',
            '三年前...究竟发生了什么？'
        ]
    }
};

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LOCATIONS,
        CHARACTERS,
        KNOWLEDGE_GRAPH,
        TIME_SYSTEM,
        EVENT_TEMPLATES,
        DIALOGUE_SYSTEM,
        PREGENERATED_CONTENT
    };
}
























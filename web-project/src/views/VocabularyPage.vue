<script setup>
import { ref, computed, watch, onMounted } from 'vue'

// ———————————————— 单词书数据 ————————————————

// 单词书1: 大学英语综合（原有数据）
const book1Data = [
    // —————————— Unit 1 ——————————
    // Part A
    { unit: 1, part: 'A', word: 'excessive', meaning: '过度的，过分的' },
    { unit: 1, part: 'A', word: 'deficit', meaning: '赤字，亏损，不足' },
    { unit: 1, part: 'A', word: 'indigenous', meaning: '本土的，土著的' },
    { unit: 1, part: 'A', word: 'equivalent', meaning: '等价的；等价物' },
    { unit: 1, part: 'A', word: 'formula', meaning: '公式，配方' },
    { unit: 1, part: 'A', word: 'substantial', meaning: '大量的，实质的' },
    { unit: 1, part: 'A', word: 'rigor', meaning: '严谨，严格' },
    { unit: 1, part: 'A', word: 'nutrient', meaning: '营养物' },
    { unit: 1, part: 'A', word: 'assumption', meaning: '假设，假定' },
    { unit: 1, part: 'A', word: 'irreversible', meaning: '不可逆的' },
    // Part B
    { unit: 1, part: 'B', word: 'potential', meaning: '潜在的；潜力' },
    { unit: 1, part: 'B', word: 'trend', meaning: '趋势' },
    { unit: 1, part: 'B', word: 'accounting', meaning: '会计；占（比例）' },
    { unit: 1, part: 'B', word: 'scale', meaning: '规模，比例' },
    { unit: 1, part: 'B', word: 'released', meaning: '释放，发布' },
    { unit: 1, part: 'B', word: 'volume', meaning: '体积，卷，量' },
    { unit: 1, part: 'B', word: 'massive', meaning: '巨大的' },
    { unit: 1, part: 'B', word: 'analyze', meaning: '分析' },
    { unit: 1, part: 'B', word: 'application', meaning: '应用，申请' },
    // 补充
    { unit: 1, part: '补充', word: 'interact', meaning: '互动，相互作用' },
    { unit: 1, part: '补充', word: 'ultimately', meaning: '最终，根本上' },
    { unit: 1, part: '补充', word: 'demeanor', meaning: '举止，风度' },
    { unit: 1, part: '补充', word: 'undeniably', meaning: '不可否认地' },
    { unit: 1, part: '补充', word: 'overwhelming', meaning: '压倒性的' },
    { unit: 1, part: '补充', word: 'guilty', meaning: '内疚的，有罪的' },
    { unit: 1, part: '补充', word: 'intentional', meaning: '故意的' },
    { unit: 1, part: '补充', word: 'leverages', meaning: '利用，杠杆作用' },
    { unit: 1, part: '补充', word: 'infinitely', meaning: '无限地' },
    { unit: 1, part: '补充', word: 'transcend', meaning: '超越' },
    { unit: 1, part: '补充', word: 'interpret', meaning: '解释，理解' },
    { unit: 1, part: '补充', word: 'triggered', meaning: '触发，引起' },
    { unit: 1, part: '补充', word: 'implications', meaning: '含义，暗示，影响' },
    { unit: 1, part: '补充', word: 'relevancy', meaning: '相关性' },
    { unit: 1, part: '补充', word: 'mindset', meaning: '心态，思维模式' },
    { unit: 1, part: '补充', word: 'interconnected', meaning: '相互连接的' },
    { unit: 1, part: '补充', word: 'strikingly', meaning: '显著地，引人注目地' },
    { unit: 1, part: '补充', word: 'monetary', meaning: '货币的，金钱的' },
    { unit: 1, part: '补充', word: 'entity', meaning: '实体' },
    { unit: 1, part: '补充', word: 'clinical', meaning: '临床的' },
    { unit: 1, part: '补充', word: 'diagnose', meaning: '诊断' },
    { unit: 1, part: '补充', word: 'perceive', meaning: '感知，认为' },
    { unit: 1, part: '补充', word: 'diverge', meaning: '分歧，偏离' },
    { unit: 1, part: '补充', word: 'trump', meaning: '胜过；王牌' },
    { unit: 1, part: '补充', word: 'intuit', meaning: '凭直觉知晓' },

    // —————————— Unit 2 ——————————
    // Part A
    { unit: 2, part: 'A', word: 'aspiring', meaning: '有抱负的' },
    { unit: 2, part: 'A', word: 'dominance', meaning: '优势，统治地位' },
    { unit: 2, part: 'A', word: 'complication', meaning: '并发症，复杂化' },
    { unit: 2, part: 'A', word: 'rotation', meaning: '旋转，循环' },
    { unit: 2, part: 'A', word: 'correlates', meaning: '（使）相关联' },
    { unit: 2, part: 'A', word: 'coordination', meaning: '协调，配合' },
    { unit: 2, part: 'A', word: 'exclusively', meaning: '排他地，独占地' },
    { unit: 2, part: 'A', word: 'pathway', meaning: '路径' },
    { unit: 2, part: 'A', word: 'cognitive', meaning: '认知的' },
    // Part B
    { unit: 2, part: 'B', word: 'phenomenon', meaning: '现象' },
    { unit: 2, part: 'B', word: 'separate', meaning: '分开；单独的' },
    { unit: 2, part: 'B', word: 'organisms', meaning: '生物，有机体' },
    { unit: 2, part: 'B', word: 'essential', meaning: '基本的，必要的' },
    { unit: 2, part: 'B', word: 'consumption', meaning: '消费，消耗' },
    { unit: 2, part: 'B', word: 'evolved', meaning: '进化，发展' },
    { unit: 2, part: 'B', word: 'advanced', meaning: '先进的，高级的' },
    { unit: 2, part: 'B', word: 'primitive', meaning: '原始的' },
    { unit: 2, part: 'B', word: 'reproduce', meaning: '繁殖，复制' },
    { unit: 2, part: 'B', word: 'biologists', meaning: '生物学家' },
    // 补充
    { unit: 2, part: '补充', word: 'prominent', meaning: '显著的，杰出的' },
    { unit: 2, part: '补充', word: 'underlies', meaning: '构成...的基础' },
    { unit: 2, part: '补充', word: 'layout', meaning: '布局，设计' },
    { unit: 2, part: '补充', word: 'assort', meaning: '把...分类' },
    { unit: 2, part: '补充', word: 'resilient', meaning: '有弹性的，适应力强的' },
    { unit: 2, part: '补充', word: 'variable', meaning: '变量；易变的' },
    { unit: 2, part: '补充', word: 'horrendous', meaning: '可怕的，惊人的' },
    { unit: 2, part: '补充', word: 'perspectives', meaning: '视角，观点' },
    { unit: 2, part: '补充', word: 'contemplates', meaning: '沉思，注视' },
    { unit: 2, part: '补充', word: 'evolutionary', meaning: '进化的' },
    { unit: 2, part: '补充', word: 'entanglement', meaning: '纠缠' },
    { unit: 2, part: '补充', word: 'predispose', meaning: '预先处置，使偏向于' },

    // —————————— Unit 3 ——————————
    // Part A
    { unit: 3, part: 'A', word: 'discourage', meaning: '使气馁，阻碍' },
    { unit: 3, part: 'A', word: 'hesitate', meaning: '犹豫' },
    { unit: 3, part: 'A', word: 'exterminate', meaning: '消灭，根除' },
    { unit: 3, part: 'A', word: 'consequence', meaning: '后果，结果' },
    { unit: 3, part: 'A', word: 'sound', meaning: '健全的；声音' },
    { unit: 3, part: 'A', word: 'flapped', meaning: '拍打，飘动' },
    { unit: 3, part: 'A', word: 'strange', meaning: '奇怪的' },
    { unit: 3, part: 'A', word: 'blame', meaning: '责备，归咎于' },
    { unit: 3, part: 'A', word: 'experienced', meaning: '有经验的' },
    { unit: 3, part: 'A', word: 'great', meaning: '伟大的，巨大的' },
    // Part B
    { unit: 3, part: 'B', word: 'in the long run', meaning: '从长远来看' },
    { unit: 3, part: 'B', word: 'piled up', meaning: '堆积，积累' },
    { unit: 3, part: 'B', word: 'end up', meaning: '最终，结果是' },
    { unit: 3, part: 'B', word: 'turned down', meaning: '拒绝，关小' },
    { unit: 3, part: 'B', word: 'take a crack', meaning: '尝试' },
    { unit: 3, part: 'B', word: 'stage fright', meaning: '怯场' },
    { unit: 3, part: 'B', word: 'uproot', meaning: '根除，连根拔起' },
    { unit: 3, part: 'B', word: 'big name', meaning: '名人，大牌' },
    { unit: 3, part: 'B', word: 'gut', meaning: '勇气；直觉；肠道' },
    { unit: 3, part: 'B', word: 'beg off', meaning: '推辞，拒绝' },
    // 补充
    { unit: 3, part: '补充', word: 'prospect', meaning: '前景，展望' },
    { unit: 3, part: '补充', word: 'terrific', meaning: '极好的，极度的' },
    { unit: 3, part: '补充', word: 'waver', meaning: '动摇，犹豫' },
    { unit: 3, part: '补充', word: 'sophisticated', meaning: '复杂的，老练的' },
    { unit: 3, part: '补充', word: 'exotic', meaning: '异国情调的，外来的' },
    { unit: 3, part: '补充', word: 'consistent', meaning: '一致的，始终如一的' },
    { unit: 3, part: '补充', word: 'despised', meaning: '鄙视，看不起' },
    { unit: 3, part: '补充', word: 'flattery', meaning: '奉承，恭维' },
    { unit: 3, part: '补充', word: 'contemptible', meaning: '可鄙的，卑劣的' },

    // —————————— Unit 9 ——————————
    // Part A
    { unit: 9, part: 'A', word: 'insights', meaning: '洞察力，见解' },
    { unit: 9, part: 'A', word: 'potential', meaning: '潜力' },
    { unit: 9, part: 'A', word: 'prompted', meaning: '促使，激起' },
    { unit: 9, part: 'A', word: 'sensitive', meaning: '敏感的' },
    { unit: 9, part: 'A', word: 'manipulative', meaning: '操纵性的' },
    { unit: 9, part: 'A', word: 'opaque', meaning: '不透明的，晦涩的' },
    { unit: 9, part: 'A', word: 'index', meaning: '指数，索引' },
    { unit: 9, part: 'A', word: 'context', meaning: '语境，背景' },
    { unit: 9, part: 'A', word: 'foster', meaning: '培养，促进' },
    { unit: 9, part: 'A', word: 'elevate', meaning: '提升，举起' },
    // Part B
    { unit: 9, part: 'B', word: 'put the boot in', meaning: '落井下石，残忍攻击' },
    { unit: 9, part: 'B', word: 'argued with', meaning: '与...争论' },
    { unit: 9, part: 'B', word: 'laid into', meaning: '痛斥，攻击' },
    { unit: 9, part: 'B', word: 'laid up', meaning: '卧床不起；储备' },
    { unit: 9, part: 'B', word: 'put in the forefront', meaning: '置于首位' },
    { unit: 9, part: 'B', word: 'laid out', meaning: '布置；花费；陈列' },
    { unit: 9, part: 'B', word: 'came up for', meaning: '发生，被提出' },
    { unit: 9, part: 'B', word: 'putting the work in', meaning: '投入工作' },
    { unit: 9, part: 'B', word: 'come up with', meaning: '想出，提出' },
    { unit: 9, part: 'B', word: 'comply with', meaning: '遵守，顺从' },
    // 补充
    { unit: 9, part: '补充', word: 'tailored', meaning: '定制的，剪裁的' },
    { unit: 9, part: '补充', word: 'insight', meaning: '洞察力，顿悟 (单数)' },
    { unit: 9, part: '补充', word: 'pinpoint', meaning: '精确找到，查明' },
    { unit: 9, part: '补充', word: 'deploy', meaning: '部署，调度' },
    { unit: 9, part: '补充', word: 'insurmountable', meaning: '不可逾越的' },
    { unit: 9, part: '补充', word: 'hurdle', meaning: '障碍，难关' },
    { unit: 9, part: '补充', word: 'stigma', meaning: '耻辱，污名' },
    { unit: 9, part: '补充', word: 'concede', meaning: '承认，让步' },

    // —————————— Unit 11 ——————————
    // Part A
    { unit: 11, part: 'A', word: 'compromise', meaning: '妥协；危害' },
    { unit: 11, part: 'A', word: 'eloquent', meaning: '雄辩的' },
    { unit: 11, part: 'A', word: 'befall', meaning: '降临，发生' },
    { unit: 11, part: 'A', word: 'dormant', meaning: '休眠的' },
    { unit: 11, part: 'A', word: 'monopolize', meaning: '垄断，独占' },
    { unit: 11, part: 'A', word: 'humane', meaning: '仁慈的' },
    { unit: 11, part: 'A', word: 'epidemics', meaning: '流行病' },
    { unit: 11, part: 'A', word: 'vicinity', meaning: '附近' },
    { unit: 11, part: 'A', word: 'yield', meaning: '产量；屈服' },
    { unit: 11, part: 'A', word: 'entity', meaning: '实体，存在' },
    // Part B
    { unit: 11, part: 'B', word: 'send out', meaning: '发出，长出' },
    { unit: 11, part: 'B', word: 'account for', meaning: '解释；占据；负责' },
    { unit: 11, part: 'B', word: 'tied up', meaning: '忙于；被占用' },
    { unit: 11, part: 'B', word: 'penetrated', meaning: '渗透，洞察' },
    { unit: 11, part: 'B', word: 'in good shape', meaning: '状态良好' },
    { unit: 11, part: 'B', word: 'feeds on', meaning: '以...为食' },
    { unit: 11, part: 'B', word: 'emerging from', meaning: '从...出现' },
    { unit: 11, part: 'B', word: 'put pressure on', meaning: '对...施加压力' },
    { unit: 11, part: 'B', word: 'regenerated', meaning: '再生，革新' },
    { unit: 11, part: 'B', word: 'apart from', meaning: '除...之外' },
    // 补充
    { unit: 11, part: '补充', word: 'decompose', meaning: '分解，腐烂' },
    { unit: 11, part: '补充', word: 'prolonged', meaning: '延长的，拖延的' },
    { unit: 11, part: '补充', word: 'forgo', meaning: '放弃，停止' },
    { unit: 11, part: '补充', word: 'envisioned', meaning: '设想，预想' },
    { unit: 11, part: '补充', word: 'eruption', meaning: '爆发，喷发' },
    { unit: 11, part: '补充', word: 'endorsement', meaning: '认可，背书' },

    // —————————— Unit 12 ——————————
    // Part A
    { unit: 12, part: 'A', word: 'was distressed', meaning: '感到苦恼的' },
    { unit: 12, part: 'A', word: 'conflicted', meaning: '矛盾的' },
    { unit: 12, part: 'A', word: 'originates', meaning: '起源于' },
    { unit: 12, part: 'A', word: 'passion', meaning: '激情' },
    { unit: 12, part: 'A', word: 'holy', meaning: '神圣的' },
    { unit: 12, part: 'A', word: 'beautiful', meaning: '美丽的' },
    { unit: 12, part: 'A', word: 'complained', meaning: '抱怨' },
    { unit: 12, part: 'A', word: 'presupposition', meaning: '预设，前提' },
    { unit: 12, part: 'A', word: 'analysis', meaning: '分析' },
    { unit: 12, part: 'A', word: 'childish', meaning: '幼稚的' },
    // Part B
    { unit: 12, part: 'B', word: 'gaze at', meaning: '凝视' },
    { unit: 12, part: 'B', word: 'break free', meaning: '挣脱，获得自由' },
    { unit: 12, part: 'B', word: 'spring from', meaning: '源于' },
    { unit: 12, part: 'B', word: 'verdict', meaning: '裁决，定论' },
    { unit: 12, part: 'B', word: 'perspective', meaning: '观点，视角' },
    { unit: 12, part: 'B', word: 'marital', meaning: '婚姻的' },
    { unit: 12, part: 'B', word: 'rests on', meaning: '依赖于；基于' },
    { unit: 12, part: 'B', word: 'permanent', meaning: '永久的' },
    { unit: 12, part: 'B', word: 'ego', meaning: '自我' },
    { unit: 12, part: 'B', word: 'fulfilling', meaning: '令人满足的' },
    // 补充
    { unit: 12, part: '补充', word: 'unfulfilling', meaning: '令人不满足的' },
    { unit: 12, part: '补充', word: 'grieve', meaning: '悲伤，哀悼' },
    { unit: 12, part: '补充', word: 'lamenting', meaning: '悲叹，悔恨' },
    { unit: 12, part: '补充', word: 'infantile', meaning: '幼稚的，婴儿的' },
    { unit: 12, part: '补充', word: 'premise', meaning: '前提' },
    { unit: 12, part: '补充', word: 'ambiguous', meaning: '模棱两可的' },
    { unit: 12, part: '补充', word: 'extravagant', meaning: '奢侈的，浪费的' },
    { unit: 12, part: '补充', word: 'emanate', meaning: '散发，发出' },
    { unit: 12, part: '补充', word: 'relentless', meaning: '无情的，残酷的' }
]

// 单词书2: 学术英语词汇（来自单词.txt）
const book2Data = [
    // Unit 1 - 修辞与写作
    { unit: 1, part: 'A', word: 'sustain', meaning: '维持，支撑' },
    { unit: 1, part: 'A', word: 'craft', meaning: '工艺，手艺；精心制作' },
    { unit: 1, part: 'A', word: 'clutter', meaning: '杂乱，混乱' },
    { unit: 1, part: 'A', word: 'simile', meaning: '明喻' },
    { unit: 1, part: 'A', word: 'metaphor', meaning: '隐喻，暗喻' },
    { unit: 1, part: 'A', word: 'implicit', meaning: '含蓄的，隐含的' },
    { unit: 1, part: 'A', word: 'rhythm', meaning: '节奏，韵律' },
    { unit: 1, part: 'A', word: 'parallelism', meaning: '平行结构，对仗' },
    { unit: 1, part: 'A', word: 'alliteration', meaning: '头韵' },
    { unit: 1, part: 'A', word: 'antithesis', meaning: '对立，对照' },
    { unit: 1, part: 'B', word: 'juxtaposition', meaning: '并列，并置' },
    { unit: 1, part: 'B', word: 'assertion', meaning: '断言，主张' },
    { unit: 1, part: 'B', word: 'bolster', meaning: '支持，加强' },
    { unit: 1, part: 'B', word: 'testimony', meaning: '证词，证据' },
    { unit: 1, part: 'B', word: 'anecdote', meaning: '轶事，趣闻' },
    { unit: 1, part: 'B', word: 'hypothetical', meaning: '假设的' },
    { unit: 1, part: 'B', word: 'textured', meaning: '有质感的，有纹理的' },
    { unit: 1, part: 'B', word: 'sparingly', meaning: '节俭地，少量地' },
    { unit: 1, part: 'B', word: 'credible', meaning: '可信的' },
    { unit: 1, part: 'B', word: 'credentials', meaning: '资格，证书' },
    // Unit 2 - 演讲与表达
    { unit: 2, part: 'A', word: 'extemporaneously', meaning: '即兴地' },
    { unit: 2, part: 'A', word: 'impromptu', meaning: '即兴的' },
    { unit: 2, part: 'A', word: 'detract', meaning: '减损，贬低' },
    { unit: 2, part: 'A', word: 'dominant', meaning: '占主导地位的' },
    { unit: 2, part: 'A', word: 'inadequacy', meaning: '不足，不充分' },
    { unit: 2, part: 'A', word: 'convert', meaning: '转变，转换' },
    { unit: 2, part: 'A', word: 'deprivation', meaning: '剥夺，匮乏' },
    { unit: 2, part: 'A', word: 'constancy', meaning: '恒定，坚定' },
    { unit: 2, part: 'A', word: 'plausible', meaning: '貌似合理的' },
    { unit: 2, part: 'A', word: 'staggering', meaning: '令人震惊的' },
    { unit: 2, part: 'B', word: 'unprecedented', meaning: '史无前例的' },
    { unit: 2, part: 'B', word: 'entail', meaning: '需要，牵涉' },
    { unit: 2, part: 'B', word: 'mediocre', meaning: '平庸的' },
    { unit: 2, part: 'B', word: 'elaborate', meaning: '精心制作的；详细阐述' },
    { unit: 2, part: 'B', word: 'effluent', meaning: '废水，污水' },
    { unit: 2, part: 'B', word: 'finitude', meaning: '有限性' },
    { unit: 2, part: 'B', word: 'disruption', meaning: '中断，干扰' },
    { unit: 2, part: 'B', word: 'traverse', meaning: '穿越，横跨' },
    { unit: 2, part: 'B', word: 'magnitude', meaning: '重要性，规模' },
    { unit: 2, part: 'B', word: 'particulate', meaning: '微粒的' },
    // Unit 3 - 环境与社会
    { unit: 3, part: 'A', word: 'consensus', meaning: '共识，一致' },
    { unit: 3, part: 'A', word: 'concentration', meaning: '浓度，集中' },
    { unit: 3, part: 'A', word: 'liability', meaning: '责任，负债' },
    { unit: 3, part: 'A', word: 'menace', meaning: '威胁，恐吓' },
    { unit: 3, part: 'A', word: 'portend', meaning: '预示，预兆' },
    { unit: 3, part: 'A', word: 'pathogen', meaning: '病原体' },
    { unit: 3, part: 'A', word: 'striking', meaning: '显著的，引人注目的' },
    { unit: 3, part: 'A', word: 'augment', meaning: '增加，增强' },
    { unit: 3, part: 'A', word: 'emergence', meaning: '出现，兴起' },
    { unit: 3, part: 'A', word: 'intractable', meaning: '棘手的，难处理的' },
    { unit: 3, part: 'B', word: 'massive', meaning: '巨大的，大量的' },
    { unit: 3, part: 'B', word: 'central', meaning: '中心的，核心的' },
    { unit: 3, part: 'B', word: 'devastating', meaning: '毁灭性的' },
    { unit: 3, part: 'B', word: 'aggravate', meaning: '加重，恶化' },
    { unit: 3, part: 'B', word: 'nail', meaning: '钉子；确定' },
    { unit: 3, part: 'B', word: 'infraction', meaning: '违规，犯规' },
    { unit: 3, part: 'B', word: 'whopping', meaning: '巨大的' },
    { unit: 3, part: 'B', word: 'citation', meaning: '引用，传票' },
    { unit: 3, part: 'B', word: 'sporadically', meaning: '偶尔地' },
    { unit: 3, part: 'B', word: 'whim', meaning: '一时兴起，突发奇想' },
    // Unit 4 - 健康与心理
    { unit: 4, part: 'A', word: 'grim', meaning: '严峻的，冷酷的' },
    { unit: 4, part: 'A', word: 'prod', meaning: '刺激，督促' },
    { unit: 4, part: 'A', word: 'hysteria', meaning: '歇斯底里' },
    { unit: 4, part: 'A', word: 'fatality', meaning: '死亡，致命性' },
    { unit: 4, part: 'A', word: 'wart', meaning: '疣，缺点' },
    { unit: 4, part: 'A', word: 'conviction', meaning: '信念，定罪' },
    { unit: 4, part: 'A', word: 'respite', meaning: '暂缓，喘息' },
    { unit: 4, part: 'A', word: 'subgroup', meaning: '子群，分组' },
    { unit: 4, part: 'A', word: 'address', meaning: '处理，演说' },
    { unit: 4, part: 'A', word: 'bystander', meaning: '旁观者' },
    { unit: 4, part: 'B', word: 'subsequent', meaning: '随后的' },
    { unit: 4, part: 'B', word: 'ambiguity', meaning: '模糊，歧义' },
    { unit: 4, part: 'B', word: 'utter', meaning: '完全的；说出' },
    { unit: 4, part: 'B', word: 'rapport', meaning: '融洽，和谐' },
    { unit: 4, part: 'B', word: 'brand', meaning: '品牌；标记' },
    { unit: 4, part: 'B', word: 'inherent', meaning: '固有的，内在的' },
    { unit: 4, part: 'B', word: 'simultaneously', meaning: '同时地' },
    { unit: 4, part: 'B', word: 'subservience', meaning: '屈从，奴性' },
    { unit: 4, part: 'B', word: 'gender', meaning: '性别' },
    { unit: 4, part: 'B', word: 'gee', meaning: '哎呀（感叹词）' },
    // Unit 5 - 社交与礼仪
    { unit: 5, part: 'A', word: 'covert', meaning: '隐蔽的，秘密的' },
    { unit: 5, part: 'A', word: 'sneaky', meaning: '鬼鬼祟祟的' },
    { unit: 5, part: 'A', word: 'underhanded', meaning: '不光彩的，秘密的' },
    { unit: 5, part: 'A', word: 'outright', meaning: '完全的，直率的' },
    { unit: 5, part: 'A', word: 'payoff', meaning: '回报，结果' },
    { unit: 5, part: 'A', word: 'prerogative', meaning: '特权' },
    { unit: 5, part: 'A', word: 'ultimate', meaning: '最终的，根本的' },
    { unit: 5, part: 'A', word: 'anthropologist', meaning: '人类学家' },
    { unit: 5, part: 'A', word: 'literally', meaning: '字面上地，确实地' },
    { unit: 5, part: 'A', word: 'pro-forma', meaning: '形式上的' },
    { unit: 5, part: 'B', word: 'specify', meaning: '指定，详述' },
    { unit: 5, part: 'B', word: 'deem', meaning: '认为，视为' },
    { unit: 5, part: 'B', word: 'sumptuous', meaning: '奢华的，豪华的' },
    { unit: 5, part: 'B', word: 'protocol', meaning: '礼仪，协议' },
    { unit: 5, part: 'B', word: 'crude', meaning: '粗糙的，粗俗的' },
    { unit: 5, part: 'B', word: 'debase', meaning: '贬低，降低' },
    { unit: 5, part: 'B', word: 'subtlety', meaning: '微妙，精妙' }
]

// ———————————————— 单词书配置 ————————————————
const books = [
    { id: 'book1', name: '大学英语综合', data: book1Data, description: '包含 Unit 1-12 的核心词汇' },
    { id: 'book2', name: '学术英语词汇', data: book2Data, description: '演讲与写作相关词汇' }
]

// 当前选择的书籍
const currentBookId = ref('book1')
const BOOK_STORAGE_KEY = 'vocabulary_current_book'

// 从 localStorage 加载当前书籍
const loadCurrentBook = () => {
    try {
        const saved = localStorage.getItem(BOOK_STORAGE_KEY)
        if (saved && books.find(b => b.id === saved)) {
            currentBookId.value = saved
        }
    } catch {
        // ignore
    }
}

// 保存当前书籍到 localStorage
const saveCurrentBook = (bookId) => {
    try {
        localStorage.setItem(BOOK_STORAGE_KEY, bookId)
    } catch {
        // ignore
    }
}

// 获取当前书籍数据
const currentBook = computed(() => books.find(b => b.id === currentBookId.value) || books[0])
const fullVocabData = computed(() => currentBook.value.data)

// 获取当前书籍的可用单元
const availableUnits = computed(() => {
    const units = [...new Set(fullVocabData.value.map(v => v.unit))]
    return units.sort((a, b) => a - b)
})

// 切换书籍
const changeBook = (bookId) => {
    currentBookId.value = bookId
    saveCurrentBook(bookId)
    currentUnit.value = 'all'
    currentIndex.value = 0
    isFlipped.value = false
}

// ———————————————— localStorage 相关 ————————————————
// 按书籍存储已记住的单词
const getStorageKey = (bookId) => `vocabulary_mastered_words_${bookId}`

// 从 localStorage 加载已记住的单词
const loadMasteredWords = () => {
    try {
        const saved = localStorage.getItem(getStorageKey(currentBookId.value))
        return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
        return new Set()
    }
}

// 保存到 localStorage
const saveMasteredWords = (words) => {
    try {
        localStorage.setItem(getStorageKey(currentBookId.value), JSON.stringify([...words]))
    } catch (e) {
        console.error('保存失败:', e)
    }
}

// 已记住的单词集合
const masteredWords = ref(new Set())

// 初始化
onMounted(() => {
    loadCurrentBook()
    masteredWords.value = loadMasteredWords()
})

// 监听书籍变化，重新加载已记住的单词
watch(currentBookId, () => {
    masteredWords.value = loadMasteredWords()
})

// ———————————————— 主应用状态 ————————————————
const currentUnit = ref('all')
const activeTab = ref('flashcards') // 'flashcards', 'quiz', 'list', 'mastered'
const reviewMode = ref('en-zh') // 'en-zh' or 'zh-en'
const showMastered = ref(false) // 是否显示已记住的单词

// 过滤数据（按单元）
const vocabListByUnit = computed(() => {
    return currentUnit.value === 'all'
        ? fullVocabData.value
        : fullVocabData.value.filter(v => v.unit === parseInt(currentUnit.value))
})

// 过滤数据（排除已记住的单词，用于背单词模式）
const vocabList = computed(() => {
    if (showMastered.value) {
        return vocabListByUnit.value
    }
    return vocabListByUnit.value.filter(v => !masteredWords.value.has(v.word))
})

// 已记住的单词数量
const masteredCount = computed(() => {
    return vocabListByUnit.value.filter(v => masteredWords.value.has(v.word)).length
})

// 总单词数量
const totalCount = computed(() => vocabListByUnit.value.length)

// 标记当前单词为已记住
const markAsMastered = () => {
    if (!currentCard.value) return
    const currentWord = currentCard.value.word
    const newSet = new Set(masteredWords.value)
    newSet.add(currentWord)
    masteredWords.value = newSet
    saveMasteredWords(newSet)
    
    // 单词会从列表中移除，索引自动指向下一个
    // watch 会处理列表更新和索引边界检查
    isFlipped.value = false
}

// 标记当前单词为未记住（取消标记）
const unmarkAsMastered = () => {
    if (!currentCard.value) return
    const newSet = new Set(masteredWords.value)
    newSet.delete(currentCard.value.word)
    masteredWords.value = newSet
    saveMasteredWords(newSet)
}

// 从已掌握列表中移除指定单词
const removeFromMastered = (word) => {
    const newSet = new Set(masteredWords.value)
    newSet.delete(word)
    masteredWords.value = newSet
    saveMasteredWords(newSet)
}

// 重置所有已记住的单词
const resetMastered = () => {
    if (confirm(`确定要重置所有已记住的单词吗？\n当前已记住 ${masteredWords.value.size} 个单词`)) {
        masteredWords.value = new Set()
        saveMasteredWords(new Set())
        currentIndex.value = 0
        isFlipped.value = false
    }
}

// 切换显示/隐藏已记住的单词
const toggleShowMastered = () => {
    showMastered.value = !showMastered.value
}

// 检查当前单词是否已记住
const isCurrentMastered = computed(() => {
    return currentCard.value ? masteredWords.value.has(currentCard.value.word) : false
})

// 检查某个单词是否已记住
const isWordMastered = (word) => {
    return masteredWords.value.has(word)
}

const toggleReviewMode = () => {
    reviewMode.value = reviewMode.value === 'en-zh' ? 'zh-en' : 'en-zh'
}

// 导航标签配置
const tabs = [
    { id: 'flashcards', label: '背单词', icon: 'BookOpen' },
    { id: 'quiz', label: '测验模式', icon: 'Brain' },
    { id: 'list', label: '词汇表', icon: 'List' },
    { id: 'mastered', label: '已掌握', icon: 'Check' },
]

// 已掌握的单词列表
const masteredVocabList = computed(() => {
    return vocabListByUnit.value.filter(v => masteredWords.value.has(v.word))
})

// ———————————————— Flashcard Mode 状态 ————————————————
const currentIndex = ref(0)
const isFlipped = ref(false)
const shuffledList = ref([])

// 监听 vocabList 变化，更新卡片列表（保持当前进度）
watch(vocabList, (newList, oldList) => {
    const oldLength = oldList?.length || 0
    const newLength = newList.length
    
    // 如果是切换单元或初始加载，重置索引
    if (oldLength === 0 || Math.abs(newLength - oldLength) > 1) {
        shuffledList.value = [...newList]
        currentIndex.value = 0
        isFlipped.value = false
    } else {
        // 如果只是标记了一个单词，保持当前位置
        shuffledList.value = [...newList]
        // 确保索引不会越界
        if (currentIndex.value >= newLength) {
            currentIndex.value = Math.max(0, newLength - 1)
        }
        isFlipped.value = false
    }
}, { immediate: true })

const currentCard = computed(() => shuffledList.value[currentIndex.value])

const frontContent = computed(() => 
    reviewMode.value === 'en-zh' ? currentCard.value?.word : currentCard.value?.meaning
)
const backContent = computed(() => 
    reviewMode.value === 'en-zh' ? currentCard.value?.meaning : currentCard.value?.word
)
const frontLabel = computed(() => 
    reviewMode.value === 'en-zh' ? 'English' : '中文'
)

const handleNext = () => {
    isFlipped.value = false
    setTimeout(() => {
        currentIndex.value = (currentIndex.value + 1) % shuffledList.value.length
    }, 150)
}


const handlePrev = () => {
    isFlipped.value = false
    setTimeout(() => {
        currentIndex.value = (currentIndex.value - 1 + shuffledList.value.length) % shuffledList.value.length
    }, 150)
}

const handleShuffle = () => {
    const newOrder = [...shuffledList.value]
    for (let i = newOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]]
    }
    shuffledList.value = newOrder
    currentIndex.value = 0
    isFlipped.value = false
}

const flipCard = () => {
    isFlipped.value = !isFlipped.value
}

// ———————————————— Quiz Mode 状态 ————————————————
const currentQIndex = ref(0)
const options = ref([])
const selectedOption = ref(null)
const score = ref(0)
const showResult = ref(false)
const quizFinished = ref(false)
const questions = ref([])

// 测验用的单词列表（始终排除已记住的单词）
const quizVocabList = computed(() => {
    return vocabListByUnit.value.filter(v => !masteredWords.value.has(v.word))
})

// 生成测验题目
const generateQuestions = () => {
    const list = [...quizVocabList.value]
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]]
    }
    questions.value = list
}

// 初始化测验
const initQuiz = () => {
    generateQuestions()
    currentQIndex.value = 0
    score.value = 0
    quizFinished.value = false
    showResult.value = false
    selectedOption.value = null
    generateOptions()
}

// 生成选项
const generateOptions = () => {
    const currentQuestion = questions.value[currentQIndex.value]
    if (!currentQuestion) return

    const distractors = []
    const vocabData = fullVocabData.value
    while (distractors.length < 3) {
        const randomItem = vocabData[Math.floor(Math.random() * vocabData.length)]
        if (randomItem.word !== currentQuestion.word && !distractors.find(d => d.word === randomItem.word)) {
            distractors.push(randomItem)
        }
    }

    const allOptions = [...distractors, currentQuestion]
    for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]]
    }

    options.value = allOptions
    selectedOption.value = null
    showResult.value = false
}

const currentQuestion = computed(() => questions.value[currentQIndex.value])

const getQuestionText = (item) => reviewMode.value === 'en-zh' ? item.word : item.meaning
const getOptionText = (item) => reviewMode.value === 'en-zh' ? item.meaning : item.word

const handleOptionClick = (option) => {
    if (showResult.value) return
    selectedOption.value = option
    showResult.value = true
    if (option.word === currentQuestion.value.word) {
        score.value++
    }
}

const nextQuestion = () => {
    if (currentQIndex.value < questions.value.length - 1) {
        currentQIndex.value++
        generateOptions()
    } else {
        quizFinished.value = true
    }
}

const restartQuiz = () => {
    initQuiz()
}

// 监听 quizVocabList 和 reviewMode 变化，重新初始化测验
watch([quizVocabList, reviewMode], () => {
    if (activeTab.value === 'quiz') {
        initQuiz()
    }
}, { immediate: false })

// 监听 tab 切换到 quiz 时初始化
watch(activeTab, (newTab) => {
    if (newTab === 'quiz') {
        initQuiz()
    }
})

// 获取选项样式类
const getOptionClass = (opt) => {
    if (!showResult.value) {
        return 'option-default'
    }
    if (opt.word === currentQuestion.value.word) {
        return 'option-correct'
    }
    if (selectedOption.value === opt && opt.word !== currentQuestion.value.word) {
        return 'option-wrong'
    }
    return 'option-disabled'
}
</script>

<template>
    <div class="vocabulary-page">
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <div class="logo">
                    <h1 class="title">🐛🐛背单词</h1>
                </div>

                <div class="controls">
                    <!-- 书籍选择 -->
                    <select v-model="currentBookId" @change="changeBook(currentBookId)" class="book-select">
                        <option v-for="book in books" :key="book.id" :value="book.id">
                            📚 {{ book.name }}
                        </option>
                    </select>

                    <div class="divider"></div>

                    <button @click="toggleReviewMode" class="mode-btn">
                        <!-- ArrowLeftRight Icon -->
                        <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
                        {{ reviewMode === 'en-zh' ? '英 → 汉' : '汉 → 英' }}
                    </button>

                    <div class="divider"></div>

                    <label class="unit-label">单元:</label>
                    <select v-model="currentUnit" class="unit-select">
                        <option value="all">全部 ({{ fullVocabData.length }}词)</option>
                        <option v-for="u in availableUnits" :key="u" :value="u">Unit {{ u }}</option>
                    </select>
                </div>
            </div>

            <!-- Navigation Tabs -->
            <div class="tabs-container">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    @click="activeTab = tab.id"
                    :class="['tab-btn', { active: activeTab === tab.id }]"
                >
                    <!-- BookOpen Icon -->
                    <svg v-if="tab.icon === 'BookOpen'" class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    <!-- Brain Icon -->
                    <svg v-if="tab.icon === 'Brain'" class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.97-1.375"/><path d="M18 18a4 4 0 0 0 1.97-1.375"/></svg>
                    <!-- List Icon -->
                    <svg v-if="tab.icon === 'List'" class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    <!-- Check Icon -->
                    <svg v-if="tab.icon === 'Check'" class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    {{ tab.label }}
                </button>
            </div>
        </header>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Flashcard Mode -->
            <div v-if="activeTab === 'flashcards'" class="flashcard-container">
                <!-- 掌握进度统计 -->
                <div class="mastery-stats">
                    <div class="stats-info">
                        <span class="stats-label">已掌握:</span>
                        <span class="stats-value">{{ masteredCount }} / {{ totalCount }}</span>
                        <div class="stats-bar">
                            <div class="stats-bar-fill" :style="{ width: totalCount > 0 ? (masteredCount / totalCount * 100) + '%' : '0%' }"></div>
                        </div>
                    </div>
                    <div class="stats-actions">
                        <button @click="toggleShowMastered" :class="['toggle-mastered-btn', { active: showMastered }]">
                            <!-- Eye Icon -->
                            <svg v-if="showMastered" class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            <svg v-else class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                            {{ showMastered ? '隐藏已掌握' : '显示已掌握' }}
                        </button>
                        <button @click="resetMastered" class="reset-btn" :disabled="masteredWords.size === 0">
                            <!-- Trash Icon -->
                            <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            重置进度
                        </button>
                    </div>
                </div>

                <template v-if="shuffledList.length > 0">
                    <div class="progress-bar">
                        <span>进度: {{ currentIndex + 1 }} / {{ shuffledList.length }}</span>
                        <button @click="handleShuffle" class="shuffle-btn">
                            <!-- Shuffle Icon -->
                            <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>
                            打乱顺序
                        </button>
                    </div>

                    <div class="card-wrapper" @click="flipCard">
                        <div :class="['card-inner', { flipped: isFlipped }]">
                            <!-- Front -->
                            <div class="card-face card-front">
                                <div class="card-badge">
                                    <span>Unit {{ currentCard?.unit }}</span>
                                    <span class="badge-dot"></span>
                                    <span>{{ frontLabel }}</span>
                                </div>
                                <h2 :class="['card-word', { 'text-lg': reviewMode === 'en-zh', 'text-md': reviewMode !== 'en-zh' }]">
                                    {{ frontContent }}
                                </h2>
                                <p class="card-hint">点击查看答案</p>
                            </div>

                            <!-- Back -->
                            <div class="card-face card-back">
                                <h3 :class="['card-answer', { 'text-md': reviewMode === 'en-zh', 'text-lg': reviewMode !== 'en-zh' }]">
                                    {{ backContent }}
                                </h3>
                                <div class="card-divider"></div>
                                <p class="card-back-label">
                                    {{ reviewMode === 'en-zh' ? '中文释义' : 'English' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="card-controls">
                        <button @click.stop="handlePrev" class="nav-btn">
                            <!-- ChevronLeft Icon -->
                            <svg class="icon-md" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>

                        <button @click="flipCard" class="flip-btn">
                            <!-- RotateCw Icon -->
                            <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                            翻转卡片
                        </button>

                        <button @click.stop="handleNext" class="nav-btn">
                            <!-- ChevronRight Icon -->
                            <svg class="icon-md" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </div>

                    <!-- 记住按钮 -->
                    <div class="mastery-controls">
                        <button 
                            v-if="!isCurrentMastered" 
                            @click="markAsMastered" 
                            class="mastered-btn mark"
                        >
                            <!-- Check Icon -->
                            <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            记住了！
                        </button>
                        <button 
                            v-else 
                            @click="unmarkAsMastered" 
                            class="mastered-btn unmark"
                        >
                            <!-- X Icon -->
                            <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            取消标记
                        </button>
                    </div>
                </template>

                <!-- Empty State (所有单词都记住了) -->
                <div v-else class="empty-state congratulations">
                    <div class="congrats-icon">🎉</div>
                    <h3>太棒了！</h3>
                    <p v-if="masteredCount > 0">你已经掌握了当前选择的所有 {{ masteredCount }} 个单词！</p>
                    <p v-else>暂无数据</p>
                    <button v-if="masteredCount > 0" @click="toggleShowMastered" class="review-btn">
                        复习已掌握的单词
                    </button>
                </div>
            </div>

            <!-- Quiz Mode -->
            <div v-if="activeTab === 'quiz'" class="quiz-container">
                <!-- Not enough words -->
                <div v-if="quizVocabList.length < 4" class="empty-state">
                    <template v-if="masteredCount > 0 && quizVocabList.length === 0">
                        <div class="congrats-icon">🎉</div>
                        <h3>太棒了！</h3>
                        <p>你已经掌握了所有单词，没有需要测验的内容了！</p>
                    </template>
                    <template v-else>
                        单词数量太少，无法开始测验（至少需要4个未掌握的单词）。
                    </template>
                </div>

                <!-- Quiz Finished -->
                <div v-else-if="quizFinished" class="quiz-finished">
                    <div class="trophy-circle">
                        <!-- Trophy Icon -->
                        <svg class="trophy-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                    </div>
                    <h2 class="quiz-finished-title">测验完成!</h2>
                    <p class="quiz-score-text">
                        你的得分: <span class="score-highlight">{{ score }}</span> / {{ questions.length }}
                    </p>
                    <button @click="restartQuiz" class="restart-btn">
                        再测一次
                    </button>
                </div>

                <!-- Quiz In Progress -->
                <template v-else-if="currentQuestion">
                    <div class="quiz-header">
                        <div class="quiz-progress">
                            问题 {{ currentQIndex + 1 }} / {{ questions.length }}
                        </div>
                        <div class="quiz-score">
                            得分: {{ score }}
                        </div>
                    </div>

                    <div class="question-card">
                        <span class="question-label">
                            请选择正确的{{ reviewMode === 'en-zh' ? '中文释义' : 'English Word' }}
                        </span>
                        <h2 :class="['question-text', { 'text-lg': reviewMode === 'en-zh', 'text-md': reviewMode !== 'en-zh' }]">
                            {{ getQuestionText(currentQuestion) }}
                        </h2>
                    </div>

                    <div class="options-grid">
                        <button
                            v-for="(opt, idx) in options"
                            :key="idx"
                            @click="handleOptionClick(opt)"
                            :disabled="showResult"
                            :class="['option-btn', getOptionClass(opt)]"
                        >
                            <span class="option-text">
                                {{ getOptionText(opt) }}
                            </span>
                            <!-- CheckCircle Icon -->
                            <svg v-if="showResult && opt.word === currentQuestion.word" class="result-icon correct" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <!-- XCircle Icon -->
                            <svg v-if="showResult && selectedOption === opt && opt.word !== currentQuestion.word" class="result-icon wrong" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        </button>
                    </div>

                    <div v-if="showResult" class="next-btn-container">
                        <button @click="nextQuestion" class="next-btn">
                            {{ currentQIndex < questions.length - 1 ? '下一题' : '查看结果' }}
                            <!-- ChevronRight Icon -->
                            <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </div>
                </template>
            </div>

            <!-- List Mode -->
            <div v-if="activeTab === 'list'" class="list-container">
                <div class="list-header">
                    <div class="list-col-status">状态</div>
                    <div class="list-col-unit">Unit</div>
                    <div class="list-col-word">单词</div>
                    <div class="list-col-meaning">释义</div>
                </div>
                <div class="list-body">
                    <div
                        v-for="(item, idx) in vocabListByUnit"
                        :key="idx"
                        :class="['list-row', { mastered: isWordMastered(item.word) }]"
                    >
                        <div class="list-col-status">
                            <span v-if="isWordMastered(item.word)" class="status-mastered" title="已掌握">✓</span>
                            <span v-else class="status-pending" title="未掌握">○</span>
                        </div>
                        <div class="list-col-unit">
                            <span class="unit-badge">{{ item.unit }}-{{ item.part }}</span>
                        </div>
                        <div class="list-col-word word-text">
                            {{ item.word }}
                        </div>
                        <div class="list-col-meaning meaning-text">
                            {{ item.meaning }}
                        </div>
                    </div>
                </div>
                <!-- Empty State -->
                <div v-if="vocabListByUnit.length === 0" class="empty-state">
                    <p>暂无数据</p>
                </div>
            </div>

            <!-- Mastered Mode (已掌握) -->
            <div v-if="activeTab === 'mastered'" class="mastered-container">
                <!-- 统计信息 -->
                <div class="mastered-header">
                    <div class="mastered-stats-card">
                        <div class="stats-number">{{ masteredCount }}</div>
                        <div class="stats-desc">已掌握单词</div>
                    </div>
                    <div class="mastered-stats-card secondary">
                        <div class="stats-number">{{ totalCount - masteredCount }}</div>
                        <div class="stats-desc">待学习单词</div>
                    </div>
                    <div class="mastered-stats-card accent">
                        <div class="stats-number">{{ totalCount > 0 ? Math.round(masteredCount / totalCount * 100) : 0 }}%</div>
                        <div class="stats-desc">完成度</div>
                    </div>
                </div>

                <!-- 已掌握单词列表 -->
                <div v-if="masteredVocabList.length > 0" class="mastered-list">
                    <div class="mastered-list-header">
                        <span>已掌握的单词 ({{ masteredVocabList.length }})</span>
                        <button @click="resetMastered" class="clear-all-btn">
                            <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            清空全部
                        </button>
                    </div>
                    <div class="mastered-grid">
                        <div
                            v-for="(item, idx) in masteredVocabList"
                            :key="idx"
                            class="mastered-card"
                        >
                            <div class="mastered-card-header">
                                <span class="mastered-unit-badge">Unit {{ item.unit }}</span>
                                <button 
                                    @click="removeFromMastered(item.word)" 
                                    class="remove-btn"
                                    title="移除"
                                >
                                    <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>
                            <div class="mastered-card-word">{{ item.word }}</div>
                            <div class="mastered-card-meaning">{{ item.meaning }}</div>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else class="empty-state mastered-empty">
                    <div class="empty-icon">📚</div>
                    <h3>还没有掌握的单词</h3>
                    <p>在背单词模式中点击"记住了"来添加已掌握的单词</p>
                    <button @click="activeTab = 'flashcards'" class="start-learning-btn">
                        开始背单词
                    </button>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
/* ===== 基础样式 ===== */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

.vocabulary-page {
    min-height: 100vh;
    min-height: 100dvh; /* 动态视口高度，解决移动端地址栏问题 */
    background-color: #f8fafc;
    color: #1e293b;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-tap-highlight-color: transparent; /* 移除移动端点击高亮 */
    -webkit-text-size-adjust: 100%; /* 防止 iOS 横屏时字体放大 */
    overflow-x: hidden;
}

.vocabulary-page ::selection {
    background-color: #e0e7ff;
}

/* ===== Header ===== */
.header {
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 10;
}

.header-content {
    max-width: 56rem;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

@media (min-width: 768px) {
    .header-content {
        flex-direction: row;
    }
}

.logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.title {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(to right, #4f46e5, #7c3aed);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}

.mode-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background-color: #eef2ff;
    color: #4338ca;
    font-size: 0.875rem;
    font-weight: 600;
    border: 1px solid #c7d2fe;
    cursor: pointer;
    transition: background-color 0.2s;
}

.mode-btn:hover {
    background-color: #e0e7ff;
}

.divider {
    height: 1.5rem;
    width: 1px;
    background-color: #e2e8f0;
    display: none;
}

@media (min-width: 640px) {
    .divider {
        display: block;
    }
}

.unit-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
}

.unit-select {
    background-color: #f1f5f9;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}

.unit-select:hover {
    background-color: #e2e8f0;
}

.unit-select:focus {
    outline: none;
    box-shadow: 0 0 0 2px #6366f1;
}

.book-select {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
}

.book-select:hover {
    box-shadow: 0 4px 8px rgba(79, 70, 229, 0.4);
    transform: translateY(-1px);
}

.book-select:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3);
}

.book-select option {
    background-color: #fff;
    color: #1e293b;
    padding: 0.5rem;
}

/* ===== Tabs ===== */
.tabs-container {
    max-width: 56rem;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    gap: 0.25rem;
    margin-top: 0.5rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
}

.tabs-container::-webkit-scrollbar {
    display: none; /* Chrome/Safari/Opera */
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-btn:hover {
    color: #4f46e5;
    background-color: #f8fafc;
}

.tab-btn.active {
    border-bottom-color: #4f46e5;
    color: #4f46e5;
    background-color: rgba(238, 242, 255, 0.5);
}

/* ===== Main Content ===== */
.main-content {
    max-width: 56rem;
    margin: 0 auto;
    padding: 2rem 1rem;
}

/* ===== Icons ===== */
.icon-sm {
    width: 1rem;
    height: 1rem;
}

.icon-md {
    width: 1.5rem;
    height: 1.5rem;
}

/* ===== Flashcard Mode ===== */
.flashcard-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 32rem;
    margin: 0 auto;
}

.progress-bar {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
}

.shuffle-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    transition: color 0.2s;
}

.shuffle-btn:hover {
    color: #4f46e5;
}

.card-wrapper {
    perspective: 1000px;
    width: 100%;
    height: 20rem;
    cursor: pointer;
    margin-bottom: 2rem;
    user-select: none;
}

.card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.5s;
    transform-style: preserve-3d;
}

.card-inner.flipped {
    transform: rotateY(180deg);
}

.card-face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.card-front {
    background-color: #fff;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
}

.card-front:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

.card-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #6366f1;
    background-color: #eef2ff;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.badge-dot {
    width: 0.25rem;
    height: 0.25rem;
    background-color: #a5b4fc;
    border-radius: 50%;
}

.card-word {
    font-weight: 700;
    color: #1e293b;
    text-align: center;
    word-break: break-word;
    margin-bottom: 0.5rem;
}

.text-lg {
    font-size: 2.25rem;
}

.text-md {
    font-size: 1.875rem;
}

.card-hint {
    color: #94a3b8;
    font-size: 0.875rem;
    margin-top: 1rem;
    font-weight: 500;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.card-back {
    background: linear-gradient(to bottom right, #4f46e5, #7c3aed);
    transform: rotateY(180deg);
    color: #fff;
}

.card-answer {
    font-weight: 700;
    text-align: center;
    line-height: 1.6;
}

.card-divider {
    margin-top: 1.5rem;
    width: 3rem;
    height: 0.25rem;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 9999px;
}

.card-back-label {
    color: #a5b4fc;
    font-size: 0.875rem;
    margin-top: 1rem;
    opacity: 0.75;
}

.card-controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.nav-btn {
    padding: 1rem;
    border-radius: 9999px;
    background-color: #fff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s;
}

.nav-btn:hover {
    background-color: #f8fafc;
    color: #4f46e5;
}

.nav-btn:active {
    transform: scale(0.95);
}

.flip-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 2rem;
    border-radius: 0.75rem;
    background-color: #4f46e5;
    color: #fff;
    font-weight: 600;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s;
}

.flip-btn:hover {
    background-color: #4338ca;
}

.flip-btn:active {
    transform: scale(0.95);
}

/* ===== Mastery Stats ===== */
.mastery-stats {
    width: 100%;
    background-color: #fff;
    border-radius: 1rem;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
}

.stats-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
}

.stats-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
}

.stats-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: #22c55e;
}

.stats-bar {
    flex: 1;
    min-width: 100px;
    height: 0.5rem;
    background-color: #e2e8f0;
    border-radius: 9999px;
    overflow: hidden;
}

.stats-bar-fill {
    height: 100%;
    background: linear-gradient(to right, #22c55e, #16a34a);
    border-radius: 9999px;
    transition: width 0.3s ease;
}

.stats-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.toggle-mastered-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
}

.toggle-mastered-btn:hover {
    background-color: #e2e8f0;
    color: #475569;
}

.toggle-mastered-btn.active {
    background-color: #eef2ff;
    border-color: #c7d2fe;
    color: #4f46e5;
}

.reset-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: #fff;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    color: #ef4444;
    cursor: pointer;
    transition: all 0.2s;
}

.reset-btn:hover:not(:disabled) {
    background-color: #fef2f2;
}

.reset-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ===== Mastery Controls (记住按钮) ===== */
.mastery-controls {
    margin-top: 1.5rem;
    display: flex;
    justify-content: center;
}

.mastered-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.mastered-btn.mark {
    background-color: #22c55e;
    color: #fff;
}

.mastered-btn.mark:hover {
    background-color: #16a34a;
}

.mastered-btn.mark:active {
    transform: scale(0.95);
}

.mastered-btn.unmark {
    background-color: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.mastered-btn.unmark:hover {
    background-color: #e2e8f0;
    color: #475569;
}

/* ===== Congratulations State ===== */
.empty-state.congratulations {
    background-color: #fff;
    border-radius: 1rem;
    padding: 3rem 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
}

.congrats-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.empty-state.congratulations h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.empty-state.congratulations p {
    color: #64748b;
    margin-bottom: 1.5rem;
}

.review-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}

.review-btn:hover {
    background-color: #4338ca;
}

/* ===== Quiz Mode ===== */
.quiz-container {
    max-width: 42rem;
    margin: 0 auto;
}

.quiz-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.quiz-progress {
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
}

.quiz-score {
    font-size: 0.875rem;
    font-weight: 700;
    color: #4f46e5;
    background-color: #eef2ff;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
}

.question-card {
    background-color: #fff;
    border-radius: 1rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
    padding: 2rem;
    margin-bottom: 2rem;
    text-align: center;
    min-height: 10rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.question-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.75rem;
    display: block;
}

.question-text {
    font-weight: 700;
    color: #1e293b;
    line-height: 1.4;
}

.options-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

@media (min-width: 768px) {
    .options-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

.option-btn {
    padding: 1rem;
    border-radius: 0.75rem;
    border: 2px solid #e2e8f0;
    font-size: 1.125rem;
    font-weight: 500;
    transition: all 0.2s;
    min-height: 5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    background-color: #fff;
}

.option-btn:not(:disabled) {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.option-text {
    word-break: break-word;
    width: 100%;
}

.option-default {
    background-color: #fff;
    border-color: #e2e8f0;
}

.option-default:hover:not(:disabled) {
    border-color: #a5b4fc;
    background-color: #eef2ff;
}

.option-correct {
    background-color: #dcfce7;
    border-color: #22c55e;
    color: #166534;
    box-shadow: 0 0 0 1px #22c55e;
}

.option-wrong {
    background-color: #fef2f2;
    border-color: #fca5a5;
    color: #991b1b;
    opacity: 0.6;
}

.option-disabled {
    background-color: #f8fafc;
    border-color: #f1f5f9;
    color: #94a3b8;
}

.result-icon {
    flex-shrink: 0;
    margin-left: 0.5rem;
    width: 1.25rem;
    height: 1.25rem;
}

.result-icon.correct {
    color: #16a34a;
}

.result-icon.wrong {
    color: #ef4444;
}

.next-btn-container {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
    animation: fadeInUp 0.5s ease-out forwards;
}

.next-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 2.5rem;
    background-color: #1e293b;
    color: #fff;
    border-radius: 0.75rem;
    font-weight: 700;
    border: none;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s;
}

.next-btn:hover {
    background-color: #0f172a;
}

/* Quiz Finished */
.quiz-finished {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
    text-align: center;
    animation: fadeIn 0.5s ease-out forwards;
}

.trophy-circle {
    width: 6rem;
    height: 6rem;
    background-color: #fef9c3;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
}

.trophy-icon {
    width: 3rem;
    height: 3rem;
    color: #eab308;
}

.quiz-finished-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.quiz-score-text {
    color: #64748b;
    margin-bottom: 2rem;
}

.score-highlight {
    font-size: 1.5rem;
    font-weight: 700;
    color: #4f46e5;
}

.restart-btn {
    padding: 0.75rem 2rem;
    background-color: #4f46e5;
    color: #fff;
    border-radius: 0.75rem;
    font-weight: 600;
    border: none;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background-color 0.2s;
}

.restart-btn:hover {
    background-color: #4338ca;
}

/* ===== List Mode ===== */
.list-container {
    background-color: #fff;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    overflow: hidden;
}

.list-header {
    display: grid;
    grid-template-columns: 1fr 2fr 3fr 6fr;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

@media (min-width: 768px) {
    .list-header {
        grid-template-columns: 0.5fr 1fr 2fr 8fr;
    }
}

.list-body {
    max-height: 60vh;
    overflow-y: auto;
}

.list-row {
    display: grid;
    grid-template-columns: 1fr 2fr 3fr 6fr;
    padding: 1rem;
    align-items: center;
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.2s;
}

@media (min-width: 768px) {
    .list-row {
        grid-template-columns: 0.5fr 1fr 2fr 8fr;
    }
}

.list-row:hover {
    background-color: rgba(238, 242, 255, 0.3);
}

.list-row:hover .meaning-text {
    color: #1e293b;
}

.list-row.mastered {
    background-color: rgba(220, 252, 231, 0.3);
}

.list-row.mastered:hover {
    background-color: rgba(220, 252, 231, 0.5);
}

.list-col-status {
    text-align: center;
}

.status-mastered {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    background-color: #22c55e;
    color: #fff;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 700;
}

.status-pending {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    color: #cbd5e1;
    font-size: 1rem;
}

.unit-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    background-color: #f1f5f9;
    color: #475569;
    font-size: 0.75rem;
    font-weight: 500;
}

.word-text {
    font-weight: 700;
    color: #4338ca;
    font-size: 1.125rem;
}

.meaning-text {
    color: #475569;
    transition: color 0.2s;
}

/* ===== Mastered Mode (已掌握页面) ===== */
.mastered-container {
    max-width: 56rem;
    margin: 0 auto;
}

.mastered-header {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
}

.mastered-stats-card {
    background-color: #fff;
    border-radius: 1rem;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
}

.mastered-stats-card .stats-number {
    font-size: 2rem;
    font-weight: 700;
    color: #22c55e;
    margin-bottom: 0.25rem;
}

.mastered-stats-card.secondary .stats-number {
    color: #f59e0b;
}

.mastered-stats-card.accent .stats-number {
    color: #4f46e5;
}

.mastered-stats-card .stats-desc {
    font-size: 0.875rem;
    color: #64748b;
}

.mastered-list {
    background-color: #fff;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    overflow: hidden;
}

.mastered-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 600;
    color: #1e293b;
}

.clear-all-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: #fff;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    color: #ef4444;
    cursor: pointer;
    transition: all 0.2s;
}

.clear-all-btn:hover {
    background-color: #fef2f2;
}

.mastered-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    padding: 1.5rem;
}

.mastered-card {
    background-color: #f8fafc;
    border-radius: 0.75rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
}

.mastered-card:hover {
    background-color: #fff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.mastered-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.mastered-unit-badge {
    font-size: 0.625rem;
    font-weight: 600;
    color: #22c55e;
    background-color: #dcfce7;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    border-radius: 0.25rem;
    transition: all 0.2s;
}

.remove-btn:hover {
    background-color: #fef2f2;
    color: #ef4444;
}

.mastered-card-word {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.375rem;
}

.mastered-card-meaning {
    font-size: 0.875rem;
    color: #64748b;
}

.mastered-empty {
    background-color: #fff;
    border-radius: 1rem;
    padding: 4rem 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.mastered-empty h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.mastered-empty p {
    color: #64748b;
    margin-bottom: 1.5rem;
}

.start-learning-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}

.start-learning-btn:hover {
    background-color: #4338ca;
}

/* ===== Empty State ===== */
.empty-state {
    text-align: center;
    padding: 5rem 0;
    color: #94a3b8;
}

/* ===== 响应式设计 - 移动端适配 ===== */

/* 小屏幕手机 (max-width: 480px) */
@media (max-width: 480px) {
    .header-content {
        padding: 0.75rem;
        gap: 0.75rem;
    }

    .title {
        font-size: 1.25rem;
    }

    .controls {
        width: 100%;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .mode-btn {
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
    }

    .unit-select {
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
    }

    .book-select {
        padding: 0.375rem 0.625rem;
        font-size: 0.75rem;
        width: 100%;
        max-width: 150px;
    }

    .unit-label {
        font-size: 0.75rem;
    }

    .tabs-container {
        padding: 0 0.5rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .tab-btn {
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
        white-space: nowrap;
    }

    .tab-btn .icon-sm {
        width: 0.875rem;
        height: 0.875rem;
    }

    .main-content {
        padding: 1rem 0.75rem;
    }

    /* Mastery Stats 移动端 */
    .mastery-stats {
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
    }

    .stats-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .stats-bar {
        width: 100%;
        min-width: unset;
    }

    .stats-actions {
        width: 100%;
        justify-content: space-between;
    }

    .toggle-mastered-btn,
    .reset-btn {
        flex: 1;
        justify-content: center;
        padding: 0.5rem;
    }

    /* Flashcard 移动端 */
    .card-wrapper {
        height: 16rem;
    }

    .card-face {
        padding: 1.25rem;
    }

    .card-badge {
        font-size: 0.625rem;
        padding: 0.25rem 0.375rem;
        top: 0.75rem;
        left: 0.75rem;
    }

    .text-lg {
        font-size: 1.75rem;
    }

    .text-md {
        font-size: 1.5rem;
    }

    .card-hint {
        font-size: 0.75rem;
    }

    .card-controls {
        gap: 0.75rem;
    }

    .nav-btn {
        padding: 0.75rem;
    }

    .nav-btn .icon-md {
        width: 1.25rem;
        height: 1.25rem;
    }

    .flip-btn {
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
    }

    .mastery-controls {
        margin-top: 1rem;
    }

    .mastered-btn {
        padding: 0.625rem 1.5rem;
        font-size: 0.875rem;
    }

    /* Quiz 移动端 */
    .question-card {
        padding: 1.25rem;
        min-height: 8rem;
    }

    .question-label {
        font-size: 0.625rem;
    }

    .option-btn {
        padding: 0.75rem;
        font-size: 1rem;
        min-height: 4rem;
    }

    .next-btn {
        padding: 0.625rem 1.5rem;
        font-size: 0.875rem;
    }

    /* List 移动端 */
    .list-header,
    .list-row {
        grid-template-columns: 0.8fr 1.5fr 2fr 4fr;
        padding: 0.75rem 0.5rem;
        font-size: 0.75rem;
    }

    .unit-badge {
        font-size: 0.625rem;
        padding: 0.125rem 0.25rem;
    }

    .word-text {
        font-size: 0.875rem;
    }

    .meaning-text {
        font-size: 0.75rem;
    }

    /* Mastered 移动端 */
    .mastered-header {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }

    .mastered-stats-card {
        padding: 1rem;
    }

    .mastered-stats-card .stats-number {
        font-size: 1.5rem;
    }

    .mastered-list-header {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
        padding: 1rem;
    }

    .mastered-grid {
        grid-template-columns: 1fr;
        padding: 1rem;
        gap: 0.75rem;
    }

    .mastered-card {
        padding: 0.875rem;
    }

    .mastered-card-word {
        font-size: 1rem;
    }

    .mastered-card-meaning {
        font-size: 0.75rem;
    }

    .mastered-empty {
        padding: 2rem 1rem;
    }

    .empty-icon {
        font-size: 3rem;
    }

    .status-mastered,
    .status-pending {
        width: 1.25rem;
        height: 1.25rem;
        font-size: 0.625rem;
    }

    /* Empty State 移动端 */
    .empty-state {
        padding: 3rem 1rem;
    }

    .empty-state.congratulations {
        padding: 2rem 1rem;
    }

    .congrats-icon {
        font-size: 3rem;
    }

    .empty-state.congratulations h3 {
        font-size: 1.25rem;
    }

    .quiz-finished {
        padding: 2rem 0;
    }

    .trophy-circle {
        width: 4rem;
        height: 4rem;
    }

    .trophy-icon {
        width: 2rem;
        height: 2rem;
    }

    .quiz-finished-title {
        font-size: 1.5rem;
    }
}

/* 中等屏幕手机 (481px - 640px) */
@media (min-width: 481px) and (max-width: 640px) {
    .card-wrapper {
        height: 18rem;
    }

    .text-lg {
        font-size: 2rem;
    }

    .text-md {
        font-size: 1.625rem;
    }

    .stats-actions {
        justify-content: flex-start;
    }
}

/* 平板竖屏 (641px - 768px) */
@media (min-width: 641px) and (max-width: 768px) {
    .flashcard-container {
        max-width: 28rem;
    }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
    /* 增大触摸目标 */
    .nav-btn {
        min-width: 48px;
        min-height: 48px;
    }

    .tab-btn {
        min-height: 44px;
    }

    .option-btn {
        min-height: 56px;
    }

    .mode-btn,
    .toggle-mastered-btn,
    .reset-btn {
        min-height: 40px;
    }

    /* 移除 hover 效果在触摸设备上 */
    .nav-btn:hover,
    .flip-btn:hover,
    .tab-btn:hover,
    .option-btn:hover,
    .mode-btn:hover {
        background-color: inherit;
    }

    .nav-btn:active {
        background-color: #f8fafc;
        color: #4f46e5;
    }

    .flip-btn:active {
        background-color: #4338ca;
    }

    .tab-btn:active {
        background-color: #f8fafc;
        color: #4f46e5;
    }

    .option-btn.option-default:active {
        border-color: #a5b4fc;
        background-color: #eef2ff;
    }

    .mode-btn:active {
        background-color: #e0e7ff;
    }
}

/* 横屏模式优化 */
@media (max-height: 500px) and (orientation: landscape) {
    .header {
        position: relative;
    }

    .card-wrapper {
        height: 14rem;
    }

    .main-content {
        padding: 1rem;
    }

    .mastery-stats {
        margin-bottom: 1rem;
    }

    .mastery-controls {
        margin-top: 1rem;
    }
}

/* 大屏幕桌面优化 (1200px+) */
@media (min-width: 1200px) {
    .flashcard-container {
        max-width: 36rem;
    }

    .card-wrapper {
        height: 22rem;
    }

    .text-lg {
        font-size: 2.5rem;
    }

    .text-md {
        font-size: 2rem;
    }

    .quiz-container {
        max-width: 48rem;
    }
}

/* ===== Animations ===== */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeInUp {
    from { 
        opacity: 0; 
        transform: translateY(20px); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0); 
    }
}
</style>

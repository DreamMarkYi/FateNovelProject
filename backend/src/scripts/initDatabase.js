const mysql = require('mysql2/promise');
const config = require('../../config');

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔧 开始初始化数据库...\n');
    
    // 连接到MySQL（不指定数据库）
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password
    });
    
    console.log('✅ 已连接到MySQL服务器');
    
    // 创建数据库
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 "${config.database.database}" 已创建或已存在`);
    
    // 使用数据库
    await connection.query(`USE ${config.database.database}`);
    
    // 创建内容表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL COMMENT '标题',
        content TEXT NOT NULL COMMENT 'Markdown内容',
        content_type VARCHAR(50) NOT NULL COMMENT '内容类型: story, room, concept等',
        author VARCHAR(100) DEFAULT '匿名' COMMENT '作者',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_content_type (content_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='内容表'
    `);
    console.log('✅ 表 "contents" 已创建');
    
    // 创建story_sections表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS story_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        header_title VARCHAR(255) NOT NULL COMMENT '故事标题（如：そわかの物語）',
        subtitle VARCHAR(255) NOT NULL COMMENT '副标题（如：STORY OF SOWAKA）',
        story_text TEXT NOT NULL COMMENT '故事正文内容（支持多段落，段落间用||分隔）',
        author_signature VARCHAR(255) DEFAULT '— SOWAKA KYOTO' COMMENT '作者签名',
        image_url VARCHAR(500) COMMENT '左侧图片URL或路径',
        is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活显示（1=是，0=否）',
        display_order INT DEFAULT 0 COMMENT '显示顺序',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_is_active (is_active),
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='故事章节表'
    `);
    console.log('✅ 表 "story_sections" 已创建');
    
    // 插入示例数据
    const sampleData = [
      {
        title: 'そわかの物語',
        content: `# そわかの物語

京都の静かな朝、打ち水のされた石畳を歩くと、そこには時を超えた美しさが息づいています。

「そわか」は、古き良き日本の伝統と現代の洗練が調和した、特別な空間です。

## 歴史と伝統

歴史的な建築を大切に保存しながら、現代の快適さを融合させました。

四季折々の京都の風景を感じながら、心安らぐひとときをお過ごしいただけます。

## 五感で感じる日本の美

- 坪庭の緑
- 石畳の音
- 風の香り

五感すべてで感じる日本の美がここにあります。

私たちは、訪れるすべての方に「幸あれ」という祝福の心を込めて、最高のおもてなしを提供いたします。

*— SOWAKA KYOTO*`,
        content_type: 'story',
        author: 'SOWAKA KYOTO'
      },
      {
        title: '庭園の間',
        content: `# 庭園の間

## スモールラグジュアリーホテル「SOWAKA（そわか）」

世界の一流ホテルを格付けするトラベルガイド「ラグジュアス・トラベルガイド2025」の「ホテル部門」で、全100年を超える建築を再生した日本のホテルとして初の4つ星を獲得しました。

### 評価のポイント

- 歴史的建築を改修した唯一性
- グローバルスタンダードと日本的な品格さを融合したホスピタリティ
- 日本の歴史ある資産や自然の保護・継承

日本の歴史ある資産や自然の保護・継承、及び新しいアートや価値の創出を、ホテル事業を通じて行い、日本が持つ唯一無二の魅力が世界でより認められるよう、一層の研鑽に励んでまいります。`,
        content_type: 'room',
        author: 'SOWAKA KYOTO'
      },
      {
        title: '月見の間',
        content: `# 月見の間

## 静謐な空間で月の移ろいを感じる特別な客室

月見の間は、古来より日本人が愛でてきた月の美しさを堪能できるよう設計された客室です。

### 特徴

大きな窓からは京都の夜空を一望でき、満月の夜には格別の風情をお楽しみいただけます。

伝統的な数寄屋造りの美しさと、現代の快適さが調和した空間で、特別なひとときをお過ごしください。

### 客室情報

- **客室面積**: 45㎡
- **定員**: 2名様
- **設備**: 檜風呂、露天風呂、庭園ビュー`,
        content_type: 'room',
        author: 'SOWAKA KYOTO'
      },
      {
        title: '花鳥の間',
        content: `# 花鳥の間

## 四季折々の花と鳥のモチーフに彩られた優雅な空間

花鳥の間は、日本の伝統的な花鳥画からインスピレーションを得た、華やかで優雅な客室です。

### デザイン

四季折々の草花と鳥のモチーフが随所に施され、京都の自然美を室内で感じることができます。

専用の坪庭からは、季節ごとに表情を変える庭園をご覧いただけます。

### 客室情報

- **客室面積**: 50㎡
- **定員**: 2-3名様
- **設備**: 専用坪庭、石風呂、茶室スペース`,
        content_type: 'room',
        author: 'SOWAKA KYOTO'
      },
      {
        title: '伝統と革新',
        content: `# 伝統と革新

京都祇園八坂に佇む、歴史ある建築と現代的な快適さが調和した空間。

古き良き日本の美意識を守りながら、新しい価値を創造します。`,
        content_type: 'concept',
        author: 'SOWAKA KYOTO'
      },
      {
        title: '五感の饗宴',
        content: `# 五感の饗宴

四季折々の旬の食材、心地よい空間、丁寧なおもてなし。

五感すべてで感じる、日本の美しさと豊かさをご堪能ください。`,
        content_type: 'concept',
        author: 'SOWAKA KYOTO'
      },
      {
        title: '心の安らぎ',
        content: `# 心の安らぎ

喧騒を離れた静謐な空間で、ゆったりとした時間を。

心と体が解きほぐされる、特別な寛ぎのひとときを提供いたします。`,
        content_type: 'concept',
        author: 'SOWAKA KYOTO'
      }
    ];
    
    for (const data of sampleData) {
      await connection.query(
        'INSERT INTO contents (title, content, content_type, author) VALUES (?, ?, ?, ?)',
        [data.title, data.content, data.content_type, data.author]
      );
    }
    
    console.log(`✅ 已插入 ${sampleData.length} 条示例数据`);
    
    // 插入story_sections示例数据
    const storySections = [
      {
        header_title: 'そわかの物語',
        subtitle: 'STORY OF SOWAKA',
        story_text: '京都の静かな朝、打ち水のされた石畳を歩くと、そこには時を超えた美しさが息づいています。||「そわか」は、古き良き日本の伝統と現代の洗練が調和した、特別な空間です。歴史的な建築を大切に保存しながら、現代の快適さを融合させました。||四季折々の京都の風景を感じながら、心安らぐひとときをお過ごしいただけます。坪庭の緑、石畳の音、風の香り。五感すべてで感じる日本の美がここにあります。||私たちは、訪れるすべての方に「幸あれ」という祝福の心を込めて、最高のおもてなしを提供いたします。',
        author_signature: '— SOWAKA KYOTO',
        image_url: '/images/sowaka-story.jpg',
        is_active: 1,
        display_order: 1
      }
    ];
    
    for (const section of storySections) {
      await connection.query(
        'INSERT INTO story_sections (header_title, subtitle, story_text, author_signature, image_url, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [section.header_title, section.subtitle, section.story_text, section.author_signature, section.image_url, section.is_active, section.display_order]
      );
    }
    
    console.log(`✅ 已插入 ${storySections.length} 条故事章节示例数据`);
    
    console.log('\n✨ 数据库初始化完成！\n');
    console.log('现在可以启动服务器了:');
    console.log('  npm start  或  npm run dev\n');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();



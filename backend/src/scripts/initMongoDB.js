const { connectMongoDB, mongoose } = require('../config/mongodb');
const Novel = require('../schemas/novelSchema');
const Chapter = require('../schemas/chapterSchema');
const StorySection = require('../schemas/storySectionSchema');
const Room = require('../schemas/roomSchema');
const Concept = require('../schemas/conceptSchema');

async function initMongoDB() {
  try {
    console.log('🔧 开始初始化MongoDB数据库...\n');
    
    // 连接到MongoDB
    const connected = await connectMongoDB();
    if (!connected) {
      throw new Error('MongoDB连接失败');
    }
    
    // 清空现有数据（可选）
    console.log('🗑️  清空现有数据...');
    await Promise.all([
      Novel.deleteMany({}),
      Chapter.deleteMany({}),
      StorySection.deleteMany({}),
      Room.deleteMany({}),
      Concept.deleteMany({})
    ]);
    console.log('✅ 数据已清空\n');
    
    // 插入小说示例数据
    console.log('📚 插入小说数据...');
    const novels = await Novel.insertMany([
      {
        title: 'そわかの物語 - 完全版',
        author: 'SOWAKA KYOTO',
        description: '京都の静かな朝、打ち水のされた石畳を歩くと、そこには時を超えた美しさが息づいています。',
        category: 'romance',
        tags: ['京都', '日本文化', '伝統'],
        status: 'completed',
        isPublished: true,
        totalChapters: 0,
        metadata: {
          language: 'ja',
          publishedDate: new Date('2025-01-01')
        }
      },
      {
        title: '月夜の物語',
        author: '匿名',
        description: '月明かりに照らされた京都の夜、そこには数多くの物語が隠されています。',
        category: 'fantasy',
        tags: ['ファンタジー', '京都', '夜'],
        status: 'ongoing',
        isPublished: true,
        totalChapters: 0
      }
    ]);
    console.log(`✅ ${novels.length}個の小説を挿入\n`);
    
    // 插入章节示例数据
    console.log('📖 插入章节数据...');
    const chapters = await Chapter.insertMany([
      {
        novelId: novels[0]._id,
        chapterNumber: 1,
        title: '京都の朝',
        content: `京都の静かな朝、打ち水のされた石畳を歩くと、そこには時を超えた美しさが息づいています。\n\n「そわか」は、古き良き日本の伝統と現代の洗練が調和した、特別な空間です。歴史的な建築を大切に保存しながら、現代の快適さを融合させました。\n\n四季折々の京都の風景を感じながら、心安らぐひとときをお過ごしいただけます。坪庭の緑、石畳の音、風の香り。五感すべてで感じる日本の美がここにあります。`,
        isPublished: true,
        contentFormat: 'plain',
        publishedAt: new Date()
      },
      {
        novelId: novels[0]._id,
        chapterNumber: 2,
        title: '伝統と革新',
        content: `日本の歴史ある資産や自然の保護・継承、及び新しいアートや価値の創出を、ホテル事業を通じて行い、日本が持つ唯一無二の魅力が世界でより認められるよう、一層の研鑽に励んでまいります。`,
        isPublished: true,
        contentFormat: 'plain',
        publishedAt: new Date()
      }
    ]);
    console.log(`✅ ${chapters.length}個の章节を挿入\n`);
    
    // 更新小说的章节数
    novels[0].totalChapters = 2;
    await novels[0].save();
    
    // 插入故事章节数据
    console.log('📜 插入故事章节数据...');
    const storySections = await StorySection.insertMany([
      {
        headerTitle: 'そわかの物語',
        subtitle: 'STORY OF SOWAKA',
        paragraphs: [
          '京都の静かな朝、打ち水のされた石畳を歩くと、そこには時を超えた美しさが息づいています。',
          '「そわか」は、古き良き日本の伝統と現代の洗練が調和した、特別な空間です。歴史的な建築を大切に保存しながら、現代の快適さを融合させました。',
          '四季折々の京都の風景を感じながら、心安らぐひとときをお過ごしいただけます。坪庭の緑、石畳の音、風の香り。五感すべてで感じる日本の美がここにあります。',
          '私たちは、訪れるすべての方に「幸あれ」という祝福の心を込めて、最高のおもてなしを提供いたします。'
        ],
        authorSignature: '— SOWAKA KYOTO',
        imageUrl: '/images/sowaka-story.jpg',
        isActive: true,
        displayOrder: 1
      }
    ]);
    console.log(`✅ ${storySections.length}個の故事章节を挿入\n`);
    
    // 插入房间数据
    console.log('🏠 插入房间数据...');
    const rooms = await Room.insertMany([
      {
        name: '庭園の間',
        title: 'スモールラグジュアリーホテル「SOWAKA（そわか）」',
        description: [
          '世界の一流ホテルを格付けするトラベルガイド「ラグジュアス・トラベルガイド2025」の「ホテル部門」で、全100年を超える建築を再生した日本のホテルとして初の4つ星を獲得しました。',
          '歴史的建築を改修した唯一性や、グローバルスタンダードと日本的な品格さを融合したホスピタリティの形を評価いただいた背景、大変光栄に思っております。'
        ],
        details: [
          '客室面積: 45㎡',
          '定員: 2名様',
          '設備: 檜風呂、露天風呂、庭園ビュー'
        ],
        date: '2025.02.13',
        pricing: {
          basePrice: 50000,
          currency: 'JPY'
        },
        capacity: 2,
        isAvailable: true,
        displayOrder: 1
      },
      {
        name: '月見の間',
        title: '静謐な空間で月の移ろいを感じる特別な客室',
        description: [
          '月見の間は、古来より日本人が愛でてきた月の美しさを堪能できるよう設計された客室です。',
          '大きな窓からは京都の夜空を一望でき、満月の夜には格別の風情をお楽しみいただけます。'
        ],
        details: [
          '客室面積: 45㎡',
          '定員: 2名様',
          '設備: 檜風呂、露天風呂、庭園ビュー'
        ],
        pricing: {
          basePrice: 55000,
          currency: 'JPY'
        },
        capacity: 2,
        isAvailable: true,
        displayOrder: 2
      },
      {
        name: '花鳥の間',
        title: '四季折々の花と鳥のモチーフに彩られた優雅な空間',
        description: [
          '花鳥の間は、日本の伝統的な花鳥画からインスピレーションを得た、華やかで優雅な客室です。',
          '四季折々の草花と鳥のモチーフが随所に施され、京都の自然美を室内で感じることができます。'
        ],
        details: [
          '客室面積: 50㎡',
          '定員: 2-3名様',
          '設備: 専用坪庭、石風呂、茶室スペース'
        ],
        pricing: {
          basePrice: 60000,
          currency: 'JPY'
        },
        capacity: 3,
        isAvailable: true,
        displayOrder: 3
      }
    ]);
    console.log(`✅ ${rooms.length}個の房间を挿入\n`);
    
    // 插入概念数据
    console.log('💡 插入概念数据...');
    const concepts = await Concept.insertMany([
      {
        title: '伝統と革新',
        description: '京都祇園八坂に佇む、歴史ある建築と現代的な快適さが調和した空間。古き良き日本の美意識を守りながら、新しい価値を創造します。',
        isActive: true,
        displayOrder: 1
      },
      {
        title: '五感の饗宴',
        description: '四季折々の旬の食材、心地よい空間、丁寧なおもてなし。五感すべてで感じる、日本の美しさと豊かさをご堪能ください。',
        isActive: true,
        displayOrder: 2
      },
      {
        title: '心の安らぎ',
        description: '喧騒を離れた静謐な空間で、ゆったりとした時間を。心と体が解きほぐされる、特別な寛ぎのひとときを提供いたします。',
        isActive: true,
        displayOrder: 3
      }
    ]);
    console.log(`✅ ${concepts.length}個の概念を挿入\n`);
    
    console.log('\n✨ MongoDB数据库初始化完成！\n');
    console.log('数据统计:');
    console.log(`  小说: ${novels.length}个`);
    console.log(`  章节: ${chapters.length}个`);
    console.log(`  故事章节: ${storySections.length}个`);
    console.log(`  房间: ${rooms.length}个`);
    console.log(`  概念: ${concepts.length}个\n`);
    console.log('现在可以启动服务器了:');
    console.log('  npm start  或  npm run dev\n');
    
    // 关闭连接
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initMongoDB();


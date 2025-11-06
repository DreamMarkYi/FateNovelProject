import { ref, computed, onMounted } from 'vue'
import { roomApi, conceptApi, sowakaStoryApi } from '../api/mongoApi'

export function useSowakaPage() {
  // API基础URL（仅用于旧的MySQL数据，如果需要）
  const API_BASE_URL = 'http://localhost:3000/api'

  // 移动端菜单状态
  const mobileMenuOpen = ref(false)

  // 当前选中的房间
  const activeRoom = ref('garden')

  // 当前房间索引
  const activeRoomIndex = ref(0)

  // 加载状态
  const loading = ref(true)
  const error = ref(null)

  // 房间数据（从数据库加载）
  const rooms = ref([])

  // 概念卡片数据（从数据库加载）
  const concepts = ref([])

  // Sowaka故事数据（从MongoDB加载）
  const sowakaStory = ref({
    title: 'そわかの物語',
    subtitle: 'STORY OF SOWAKA',
    storyImageLeft: '',
    storyTextRight: [
      '京都の静かな朝、打ち水のされた石畳を歩くと、そこには時を超えた美しさが息づいています。',
      '「そわか」は、古き良き日本の伝統と現代の洗練が調和した、特別な空間です。歴史的な建築を大切に保存しながら、現代の快適さを融合させました。',
      '四季折々の京都の風景を感じながら、心安らぐひとときをお過ごしいただけます。坪庭の緑、石畳の音、風の香り。五感すべてで感じる日本の美がここにあります。',
      '私たちは、訪れるすべての方に「幸あれ」という祝福の心を込めて、最高のおもてなしを提供いたします。'
    ],
    authorSignature: '— SOWAKA KYOTO'
  })

  // 从数据库加载内容
  async function loadContents() {
    try {
      loading.value = true
      error.value = null
      
      // 从MongoDB加载房间数据
      console.log('🏠 开始加载房间数据...')
      const roomsResponse = await roomApi.getAvailableRooms()
      console.log('房间API响应：', roomsResponse.data)
      
      if (roomsResponse.data.success && roomsResponse.data.data.length > 0) {
        rooms.value = roomsResponse.data.data.map((room, index) => {
          // 生成房间ID（使用MongoDB的_id或基于索引）
          const roomId = room._id || `room-${index}`
          
          // 格式化日期
          let dateStr = ''
          if (room.date) {
            dateStr = room.date
          } else if (room.createdAt) {
            dateStr = new Date(room.createdAt).toLocaleDateString('ja-JP').replace(/\//g, '.')
          }
          
          return {
            id: roomId,
            name: room.name || '客室',
            date: dateStr,
            title: room.title || room.name,
            description: Array.isArray(room.description) ? room.description : [room.description || ''],
            details: room.details || [],
            pricing: room.pricing,
            capacity: room.capacity
          }
        })
        
        console.log(`✅ 成功加载 ${rooms.value.length} 个房间`)
        
        // 设置默认选中第一个房间
        if (rooms.value.length > 0) {
          activeRoom.value = rooms.value[0].id
        }
      } else {
        console.warn('⚠️ 房间数据为空或加载失败')
      }
      
      // 从MongoDB加载概念数据
      const conceptsResponse = await conceptApi.getActiveConcepts()
      if (conceptsResponse.data.success && conceptsResponse.data.data.length > 0) {
        concepts.value = conceptsResponse.data.data.map(concept => ({
          id: concept._id,
          title: concept.title,
          description: concept.description
        }))
      }
      
      // 从MongoDB加载Sowaka故事数据
      console.log('📖 开始加载Sowaka故事数据...')
      const sowakaStoryResponse = await sowakaStoryApi.getCurrentSowakaStory()
      console.log('Sowaka故事API响应：', sowakaStoryResponse.data)
      
      if (sowakaStoryResponse.data.success && sowakaStoryResponse.data.data) {
        const story = sowakaStoryResponse.data.data
        sowakaStory.value = {
          title: story.title || 'そわかの物語',
          subtitle: story.subtitle || 'STORY OF SOWAKA',
          storyImageLeft: story.storyImageLeft || '',
          storyTextRight: story.storyTextRight || sowakaStory.value.storyTextRight,
          authorSignature: story.authorSignature || '— SOWAKA KYOTO'
        }
        console.log("✅ Sowaka故事数据加载成功：", sowakaStory.value)
        console.log("标题：", sowakaStory.value.title)
        console.log("段落数量：", sowakaStory.value.storyTextRight.length)
      } else {
        console.warn('⚠️ Sowaka故事数据为空或加载失败，使用默认数据')
      }
      
    } catch (err) {
      console.error('加载内容失败:', err)
      error.value = '加载内容失败，请确保后端服务器正在运行'
      
      // 使用默认数据作为后备
      loadDefaultData()
    } finally {
      loading.value = false
    }
  }

  // 加载默认数据（后备方案）
  function loadDefaultData() {
    rooms.value = [
      {
        id: 'garden',
        name: '庭園の間',
        date: '2025.02.13',
        title: 'スモールラグジュアリーホテル「SOWAKA（そわか）」',
        description: [
          '世界の一流ホテルを格付けするトラベルガイド「ラグジュアス・トラベルガイド2025」の「ホテル部門」で、全100年を超える建築を再生した日本のホテルとして初の4つ星を獲得しました。',
          '歴史的建築を改修した唯一性や、グローバルスタンダードと日本的な品格さを融合したホスピタリティの形を評価いただいた背景、大変光栄に思っております。'
        ],
        details: [
          '客室面積: 45㎡',
          '定員: 2名様',
          '設備: 檜風呂、露天風呂、庭園ビュー'
        ]
      },
      {
        id: 'tsukimi',
        name: '月見の間',
        date: '2025.02.13',
        title: '静謐な空間で月の移ろいを感じる特別な客室',
        description: [
          '月見の間は、古来より日本人が愛でてきた月の美しさを堪能できるよう設計された客室です。',
          '大きな窓からは京都の夜空を一望でき、満月の夜には格別の風情をお楽しみいただけます。'
        ],
        details: [
          '客室面積: 45㎡',
          '定員: 2名様',
          '設備: 檜風呂、露天風呂、庭園ビュー'
        ]
      },
      {
        id: 'kacho',
        name: '花鳥の間',
        date: '2025.02.13',
        title: '四季折々の花と鳥のモチーフに彩られた優雅な空間',
        description: [
          '花鳥の間は、日本の伝統的な花鳥画からインスピレーションを得た、華やかで優雅な客室です。',
          '四季折々の草花と鳥のモチーフが随所に施され、京都の自然美を室内で感じることができます。'
        ],
        details: [
          '客室面積: 50㎡',
          '定員: 2-3名様',
          '設備: 専用坪庭、石風呂、茶室スペース'
        ]
      }
    ]
    
    concepts.value = [
      {
        id: 'tradition',
        title: '伝統と革新',
        description: '京都祇園八坂に佇む、歴史ある建築と現代的な快適さが調和した空間。古き良き日本の美意識を守りながら、新しい価値を創造します。'
      },
      {
        id: 'senses',
        title: '五感の饗宴',
        description: '四季折々の旬の食材、心地よい空間、丁寧なおもてなし。五感すべてで感じる、日本の美しさと豊かさをご堪能ください。'
      },
      {
        id: 'peace',
        title: '心の安らぎ',
        description: '喧騒を離れた静謐な空間で、ゆったりとした時間を。心と体が解きほぐされる、特別な寛ぎのひとときを提供いたします。'
      }
    ]
  }

  // 新闻内容对齐方式
  const newsContentAlignment = computed(() => {
    const alignments = ['align-left', 'align-center', 'align-right']
    return alignments[activeRoomIndex.value] || 'align-left'
  })

  // 获取当前激活的房间数据
  const activeRoomData = computed(() => {
    return rooms.value.find(room => room.id === activeRoom.value) || rooms.value[0] || {
      id: 'default',
      name: '読み込み中...',
      date: '',
      title: '',
      description: [],
      details: []
    }
  })

  // 切换移动端菜单
  const toggleMobileMenu = () => {
    mobileMenuOpen.value = !mobileMenuOpen.value
  }

  // 选择房间
  const selectRoom = (roomId, index) => {
    activeRoom.value = roomId
    activeRoomIndex.value = index
  }

  // 滚动到指定区域
  const scrollToSection = (event) => {
    event.preventDefault()
    const href = event.target.getAttribute('href')
    if (href && href.startsWith('#')) {
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
        // 关闭移动端菜单
        mobileMenuOpen.value = false
      }
    }
  }

  // 初始化滚动动画
  const initScrollAnimations = () => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -80px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el)
    })
  }

  // 初始化函数
  const initialize = async () => {
    await loadContents()
    initScrollAnimations()
  }

  return {
    // 状态
    mobileMenuOpen,
    activeRoom,
    activeRoomIndex,
    loading,
    error,
    rooms,
    concepts,
    sowakaStory,
    
    // 计算属性
    newsContentAlignment,
    activeRoomData,
    
    // 方法
    loadContents,
    loadDefaultData,
    toggleMobileMenu,
    selectRoom,
    scrollToSection,
    initScrollAnimations,
    initialize
  }
}

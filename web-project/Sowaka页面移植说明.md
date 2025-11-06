# Sowaka 页面移植说明

## 📋 移植概述

已成功将 `sowaka-final-design.html` 的全部内容移植到 Vue 项目中。

## 📁 新增文件

### 1. 主组件文件
- **路径**: `src/views/SowakaPage.vue`
- **功能**: 完整的 Sowaka 网站页面组件

### 2. 路由配置
- **路径**: `src/router/index.js`
- **新增路由**: `/sowaka`

## 🎯 功能实现

### ✅ 已实现的功能

1. **导航栏**
   - 固定顶部导航
   - 响应式移动端菜单
   - 平滑滚动锚点跳转

2. **Hero 区域**
   - 渐变背景
   - 标题动画效果

3. **垂直文字展示区**
   - 垂直排列的日文文字
   - SOWAKA Logo 黑色背景展示

4. **统一内容区块**
   - 介绍文字
   - 故事展示（带图片占位区）
   - 结束语

5. **客室选择区（房间卡片）**
   - 三个房间卡片：庭園の間、月見の間、花鳥の間
   - 卡片悬停和激活效果
   - 点击切换激活状态

6. **新闻/房间详情区**
   - 根据选中房间动态显示内容
   - 内容框位置跟随选中卡片移动（左、中、右对齐）
   - 平滑过渡动画

7. **概念区块**
   - 三个概念卡片
   - 悬停效果

8. **页脚**
   - 完整的页脚信息
   - 导航链接

9. **滚动动画**
   - 元素进入视口时淡入效果

10. **响应式设计**
    - 移动端适配
    - 平板和桌面端优化

## 🚀 使用方法

### 启动开发服务器

```bash
cd web-project
npm install  # 如果还未安装依赖
npm run dev
```

### 访问页面

- **本地开发地址**: `http://localhost:5173/sowaka`
- **从主页跳转**: 可以在其他页面添加路由链接

### 在其他组件中添加链接

```vue
<router-link to="/sowaka">前往 Sowaka 页面</router-link>
```

或在脚本中编程式导航：

```javascript
import { useRouter } from 'vue-router'

const router = useRouter()
router.push('/sowaka')
```

## 🎨 样式特点

### 设计系统

- **主色调**: 米白色 (#faf9f7)、深灰色 (#333)
- **字体**: Yu Mincho, YuMincho, Hiragino Mincho Pro
- **间距**: 宽松的行高和字间距
- **动画**: 平滑的过渡效果

### 交互效果

1. **导航栏**: 半透明背景，模糊效果
2. **卡片悬停**: 轻微上移，阴影增强
3. **房间切换**: 内容淡入淡出，位置平滑移动
4. **滚动动画**: 元素从下方淡入

## 🔧 数据结构

### 房间数据

页面使用 Vue 3 的响应式数据管理三个房间的信息：

```javascript
rooms = [
  {
    id: 'garden',      // 庭園の間
    name: '庭園の間',
    date: '2025.02.13',
    title: '...',
    description: [...],
    details: null
  },
  {
    id: 'moon',        // 月見の間
    name: '月見の間',
    date: '...',
    title: '...',
    description: [...],
    details: [...]
  },
  {
    id: 'flower',      // 花鳥の間
    name: '花鳥の間',
    date: '...',
    title: '...',
    description: [...],
    details: [...]
  }
]
```

### 概念数据

```javascript
concepts = [
  {
    id: 'tradition',
    title: '伝統と革新',
    description: '...'
  },
  {
    id: 'senses',
    title: '五感の饗宴',
    description: '...'
  },
  {
    id: 'peace',
    title: '心の安らぎ',
    description: '...'
  }
]
```

## 📱 响应式断点

- **桌面端**: > 768px
- **移动端**: ≤ 768px

移动端自动切换到单列布局，导航变为汉堡菜单。

## ⚙️ 关键功能说明

### 1. 房间切换逻辑

```javascript
const selectRoom = (roomId, index) => {
  activeRoom.value = roomId      // 更新激活房间
  activeRoomIndex.value = index  // 更新索引用于位置计算
}
```

### 2. 新闻内容位置

```javascript
const newsContentAlignment = computed(() => {
  const alignments = ['align-left', 'align-center', 'align-right']
  return alignments[activeRoomIndex.value] || 'align-left'
})
```

### 3. 平滑滚动

```javascript
const scrollToSection = (event) => {
  event.preventDefault()
  const target = document.querySelector(href)
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
```

## 🎯 与原 HTML 的差异

### 改进点

1. **组件化**: Vue 组件结构，易于维护
2. **响应式数据**: 使用 Vue 3 Composition API
3. **类型安全**: 清晰的数据结构
4. **过渡动画**: Vue transition 组件实现内容切换
5. **代码复用**: 使用 v-for 循环渲染重复内容

### 保持一致

1. ✅ 所有视觉效果完全一致
2. ✅ 交互行为完全一致
3. ✅ 响应式布局完全一致
4. ✅ 动画效果完全一致

## 📝 后续优化建议

### 可选增强

1. **图片添加**: 在 `story-image-left` 区域添加实际图片
   ```vue
   <div class="story-image-left">
     <img src="/path/to/image.jpg" alt="Story image" />
   </div>
   ```

2. **图片资源**: 可以为客室卡片添加背景图片
   ```css
   .character-card {
     background-image: url('/path/to/room-image.jpg');
     background-size: cover;
   }
   ```

3. **数据外部化**: 将房间和概念数据移至单独的 JSON 文件或 API

4. **国际化**: 添加多语言支持（中文/英文/日文切换）

5. **动态路由**: 为每个房间创建独立详情页
   ```javascript
   {
     path: '/sowaka/rooms/:id',
     component: RoomDetail
   }
   ```

## 🐛 已知问题

目前没有已知问题，所有功能正常运行。

## 📞 支持

如有任何问题，请检查：
1. Node.js 版本 >= 16
2. 所有依赖已正确安装
3. 开发服务器正常运行

---

**移植完成时间**: 2025-11-04  
**Vue 版本**: 3.x  
**构建工具**: Vite



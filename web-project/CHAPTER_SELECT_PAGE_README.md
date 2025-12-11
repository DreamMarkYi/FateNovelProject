# 章节选择页面 Vue 迁移说明

## 概述

已成功将 `chapter_select_page.html` 转换为 Vue 组件，保持了原始页面的所有样式和视觉效果。

## 文件结构

### 新增文件

1. **`src/views/ChapterSelectPage.vue`** - 主页面组件
2. **`src/components/ChapterNode.vue`** - 章节节点组件

### 修改文件

1. **`src/router/index.js`** - 添加了路由配置
2. **`index.html`** - 添加了必要的 Google Fonts 字体

## 访问方式

访问路径：`/chapter-select`

例如：`http://localhost:5173/chapter-select`

## 功能特性

### 页面样式
- ✅ 完全保留原始的复古羊皮纸风格
- ✅ 纸张纹理和噪点效果
- ✅ 角落魔法阵装饰
- ✅ 手写字体效果 (Gloria Hallelujah, Architects Daughter)

### 交互功能
- ✅ 返回按钮（支持路由返回）
- ✅ 章节节点点击
- ✅ 锁定/解锁状态显示
- ✅ 星级评分显示
- ✅ 节点间连接线（自动计算）
- ✅ 响应式设计（支持移动端）

## 组件数据结构

### 章节节点 (ChapterNode)

```javascript
{
  id: '1-1',              // 节点 ID
  name: 'Conflict\nZone', // 节点名称（\n 换行）
  stars: 3,               // 星级（0-3）
  locked: false,          // 是否锁定
  position: {             // 位置
    top: '40%',
    left: '20%'
  },
  rotation: '-2deg',      // 旋转角度
  highlighted: true,      // 是否高亮标记
  image: null             // 图片路径（可选）
}
```

### 箭头提示

```javascript
{
  id: 1,
  text: 'Keep going! ->',
  style: {
    top: '50%',
    left: '32%',
    transform: 'rotate(8deg)'
  }
}
```

## 自定义配置

### 修改章节信息

在 `ChapterSelectPage.vue` 的 `<script setup>` 中修改：

```javascript
// 顶部章节信息
const chapterNumber = ref('01')
const chapterTitle = ref('Graffiti Art')
const difficulty = ref('Normal')
const progressPercentage = ref(9)

// 激励文本
const motivationalText = ref('keep going！！！')

// 收藏信息
const collectionCurrent = ref(3)
const collectionTotal = ref(36)
```

### 添加新节点

在 `nodes` 数组中添加新的节点对象：

```javascript
const nodes = ref([
  // 现有节点...
  {
    id: '1-3',
    name: 'New\nArea',
    stars: 2,
    locked: false,
    position: { top: '50%', left: '70%' },
    rotation: '1deg',
    highlighted: false,
    image: null
  }
])
```

### 修改连接线

连接线会自动根据节点位置计算。如需自定义连接逻辑，修改 `calculateConnections` 函数。

## 响应式断点

- **桌面端**: > 768px
- **移动端**: ≤ 768px

## 使用的字体

- **Architects Daughter** - 正文和UI元素
- **Gloria Hallelujah** - 标题和节点名称
- **Zhi Mang Xing** - （已加载，备用）

## 路由集成

### 返回按钮

```javascript
const goBack = () => {
  router.back()  // 返回上一页
  // 或指定页面
  // router.push('/')
}
```

### 节点跳转

```javascript
const handleNodeClick = (node) => {
  if (node.locked) {
    alert('Locked')
  } else {
    // 跳转到章节详情页
    router.push(`/chapter/${node.id}`)
  }
}
```

## 注意事项

1. **字体加载**: 确保 `index.html` 中已正确加载 Google Fonts
2. **节点位置**: 使用百分比定位，自动适配不同屏幕
3. **连接线**: 在 `onMounted` 时延迟 100ms 计算，确保 DOM 已渲染
4. **窗口调整**: 监听 `resize` 事件，自动重新计算连接线

## 样式定制

所有颜色和样式变量定义在 `.chapter-select-page` 根元素上：

```css
--bg-paper: #e6e2d6;          /* 羊皮纸背景 */
--pencil-stroke: #362f2d;     /* 笔触颜色 */
--pencil-light: #7a6e66;      /* 浅色笔触 */
--highlight-red: #c92a2a;     /* 高亮红色 */
--font-body: 'Architects Daughter', cursive;
--font-title: 'Gloria Hallelujah', cursive;
```

## 与原始 HTML 的对比

| 特性 | 原始 HTML | Vue 版本 |
|------|-----------|----------|
| 样式 | ✅ 完全一致 | ✅ 完全一致 |
| 字体 | ✅ | ✅ |
| 动画效果 | ✅ | ✅ |
| 路由支持 | ❌ | ✅ |
| 组件化 | ❌ | ✅ |
| 数据驱动 | ❌ | ✅ |
| 响应式 | ✅ | ✅ |

## 下一步优化建议

1. 连接数据库，动态加载章节数据
2. 添加章节解锁动画
3. 实现进度保存功能
4. 添加音效和背景音乐
5. 优化移动端手势操作

## 问题排查

### 字体未显示
检查 `index.html` 是否正确加载了 Google Fonts：
```html
<link href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Gloria+Hallelujah&family=Zhi+Mang+Xing&display=swap" rel="stylesheet">
```

### 连接线位置不正确
确保在 DOM 完全渲染后计算连接线，可以增加延迟时间：
```javascript
setTimeout(() => {
  calculateConnections()
}, 200) // 增加延迟
```

### 节点位置不正确
检查节点的 `position` 样式是否使用百分比，并确保父容器 `.map-container` 有正确的尺寸。


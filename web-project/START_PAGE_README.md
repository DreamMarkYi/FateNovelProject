# Start Page 使用说明

## 概述
`StartPage.vue` 是从 `pageTest3.html` 转换而来的 Vue 3 组件，完全保留了原始HTML的所有功能和样式。

## 访问路由
- 路径：`/start`
- 完整URL示例：`http://localhost:5173/start`

## 功能特性

### 1. **选项卡片组件** ✨ 新组件
- 路径：`src/components/visualNovel/ChoiceCard.vue`
- 特点：
  - 竖排文字显示（writing-mode: vertical-rl）
  - 渐入动画（每个卡片延迟0.3秒）
  - hover悬浮效果
  - 点击事件穿透处理

### 2. **完整的交互系统**
- ✅ 开场动画（眨眼效果）
- ✅ 身份选择（刻下名讳/化为虚无）
- ✅ 输入姓名系统
- ✅ 选择分支系统（使用ChoiceCard组件）
- ✅ 分数计算和多结局

### 3. **主题系统**
- `gate` - 门扉主题（默认）
- `void` - 虚空主题
- `ink` - 墨色主题
- `light` - 光明主题
- `dark` - 黑暗主题

### 4. **动画效果**
- `blink-long` - 长眨眼动画（4秒）
- `blink-fast` - 快速眨眼动画（2.5秒）
- `fade-in` - 淡入效果（1.5秒）
- 选项卡片渐入动画（1秒）

## 技术实现

### 核心修复
1. **选项卡片显示问题**
   - 创建独立的 `ChoiceCard.vue` 组件
   - 使用 `showChoices` ref 控制显示/隐藏
   - 在 `renderQuiz` 中延迟300ms显示选项，获得更好的动画效果

2. **状态管理**
   ```javascript
   const showChoices = ref(false)        // 控制选项卡片显示
   const currentLayer = ref('')          // 当前活动图层
   const currentChoices = ref([])        // 当前选项数据
   ```

3. **选择逻辑**
   ```javascript
   function renderQuiz(scene) {
     currentLayer.value = 'dialogue'     // 显示问题文本
     dialogueText.value = scene.text
     currentChoices.value = scene.choices
     showChoices.value = false
     
     nextTick(() => {
       setTimeout(() => {
         showChoices.value = true        // 延迟显示选项卡片
       }, 300)
     })
   }
   ```

### 组件通信
```vue
<!-- 父组件 (StartPage.vue) -->
<ChoiceCard
  v-for="(choice, index) in currentChoices"
  :key="index"
  :text="choice.text"
  :delay="index * 0.3"
  @select="selectChoice(choice)"
/>

<!-- 子组件 (ChoiceCard.vue) -->
const emit = defineEmits(['select'])
function handleClick(e) {
  e.stopPropagation()
  emit('select')
}
```

## 样式特性

### 字体
- 中文：`Noto Serif SC` (200/400/700)
- 英文：`Playfair Display` (italic, 400/700)

### 静态背景图
- 图片：`/start_page_BG_alpha.png`
- 透明度：0.2
- 混合模式：normal
- z-index：10000（最上层，但鼠标穿透）

### 选项卡片样式
- 尺寸：240px × 340px
- 边框：1px solid #333
- 间隔：3rem
- hover效果：向上移动5px，边框变亮

## 调试建议

如果选项卡片不显示，检查：
1. `showChoices` 是否正确切换为 `true`
2. `currentChoices` 数组是否有数据
3. 浏览器控制台是否有报错
4. CSS 的 `z-index` 是否被覆盖
5. `active` class 是否正确应用

## 开发计划
- [x] 转换HTML为Vue组件
- [x] 创建ChoiceCard组件
- [x] 修复选项卡片显示问题
- [x] 添加路由配置
- [ ] 添加音效支持（可选）
- [ ] 添加存档功能（可选）
- [ ] 添加快进/回退功能（可选）


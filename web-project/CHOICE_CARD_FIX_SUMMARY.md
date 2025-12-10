# 选项卡片组件化及显示修复总结

## 问题描述
在将 `pageTest3.html` 转换为 Vue 页面后，选项卡片无法正常显示。

## 解决方案

### 1. 创建独立的 ChoiceCard 组件
**文件路径**：`src/components/visualNovel/ChoiceCard.vue`

**组件特性**：
- ✅ 竖排文字显示（`writing-mode: vertical-rl`）
- ✅ 渐入动画（可配置延迟时间）
- ✅ 悬停效果（向上移动 + 边框高亮）
- ✅ 点击事件穿透处理（`e.stopPropagation()`）
- ✅ 继承父元素字体和颜色

**Props**：
- `text`: String（必需）- 显示的文字
- `delay`: Number（默认0）- 动画延迟时间（秒）

**Events**：
- `@select` - 卡片被点击时触发

### 2. 修复 StartPage.vue 中的选择逻辑

#### 2.1 新增状态变量
```javascript
let showChoices = ref(false)  // 控制选项卡片的显示/隐藏
```

#### 2.2 优化 renderQuiz 函数
```javascript
function renderQuiz(scene) {
  // 显示对话层
  currentLayer.value = 'dialogue'
  dialogueText.value = scene.text
  currentChoices.value = scene.choices
  showChoices.value = false
  
  // 延迟显示选项卡片，获得更好的动画效果
  nextTick(() => {
    setTimeout(() => {
      showChoices.value = true
    }, 300)
  })
  
  isWaiting.value = true
}
```

#### 2.3 更新选择处理
```javascript
function selectChoice(choice) {
  gameState.score += choice.score
  showChoices.value = false  // 隐藏选项
  currentLayer.value = ''
  setTimeout(() => jumpToId(choice.nextId), 500)
}
```

#### 2.4 场景渲染时重置选择层
```javascript
function renderScene(scene) {
  // ...其他代码...
  
  // 重置选择层（除非是quiz类型）
  if (scene.type !== 'quiz') {
    showChoices.value = false
    currentChoices.value = []
  }
  
  // ...其他代码...
}
```

### 3. 模板更新
```vue
<!-- Choice Layer -->
<div id="choice-layer" class="layer" :class="{ active: showChoices }">
  <ChoiceCard
    v-for="(choice, index) in currentChoices"
    :key="index"
    :text="choice.text"
    :delay="index * 0.3"
    @select="selectChoice(choice)"
  />
</div>
```

### 4. 样式优化

#### 问题：transform 冲突
原问题：fadeIn 动画的 `transform` 和 hover 的 `transform` 可能冲突

#### 解决方案：
1. 使用 `!important` 确保 hover 效果正确应用
2. 分离 transition 属性，只对 border-color 和 background 应用过渡
3. 添加 `will-change: transform` 优化性能

```css
.choice-card {
  /* 分离hover效果的transition，避免与动画冲突 */
  transition: border-color 0.5s ease, background 0.5s ease;
  will-change: transform;
}

.choice-card:hover {
  /* 使用!important确保hover效果不被动画覆盖 */
  transform: translateY(-5px) !important;
  border-color: #888;
  background: rgba(255, 255, 255, 0.05);
}
```

## 文件修改清单

### 新增文件
1. ✅ `src/components/visualNovel/ChoiceCard.vue` - 选项卡片组件
2. ✅ `START_PAGE_README.md` - Start Page使用说明
3. ✅ `CHOICE_CARD_FIX_SUMMARY.md` - 本文件

### 修改文件
1. ✅ `src/views/StartPage.vue`
   - 导入 ChoiceCard 组件
   - 新增 showChoices 状态
   - 优化 renderQuiz 逻辑
   - 更新 selectChoice 函数
   - 修复 renderScene 函数
   - 移除内联的 choice-card 样式

2. ✅ `src/router/index.js`
   - 添加 StartPage 路由（已在之前完成）

## 测试步骤

### 1. 启动开发服务器
```bash
cd web-project
npm run dev
```

### 2. 访问页面
打开浏览器访问：`http://localhost:5173/start`

### 3. 测试流程
1. ✅ 点击查看开场动画（眨眼效果）
2. ✅ 点击多次推进剧情到身份选择
3. ✅ 选择"刻下名讳"或"化为虚无"
4. ✅ 如果选择"刻下名讳"，输入名字
5. ✅ **关键测试**：到达选择场景时
   - 检查是否显示两个竖排卡片
   - 检查卡片是否有渐入动画
   - 检查卡片间隔是否为3rem
   - 检查hover效果是否正常
   - 检查点击是否能推进剧情
6. ✅ 继续完成第二个选择
7. ✅ 查看结局文字

### 4. 预期效果

#### 选项卡片应该：
- ✨ 从下方渐入（Y轴移动20px）
- ✨ 第二个卡片延迟0.3秒出现
- ✨ 竖排显示文字
- ✨ 悬停时向上移动5px
- ✨ 悬停时边框从 #333 变为 #888
- ✨ 悬停时背景出现半透明白色
- ✨ 点击后正常推进剧情

## 技术要点

### Vue 3 Composition API
- 使用 `ref()` 和 `reactive()` 管理状态
- 使用 `nextTick()` 确保DOM更新后执行动画
- 使用 `setTimeout()` 控制动画时序

### CSS 动画
- 使用 `@keyframes` 定义动画
- 使用动态 style 绑定控制延迟时间
- 使用 `forwards` 保持动画结束状态

### 事件处理
- 使用 `@click.stop` 阻止事件冒泡
- 使用 `emit()` 进行组件通信

## 常见问题排查

### 问题1：选项卡片不显示
**检查**：
- `showChoices` 是否为 `true`
- `currentChoices` 数组是否有数据
- 浏览器控制台是否有错误

**解决**：
```javascript
// 在renderQuiz中添加调试日志
console.log('showChoices:', showChoices.value)
console.log('currentChoices:', currentChoices.value)
```

### 问题2：卡片显示但没有动画
**检查**：
- `:delay` prop 是否正确传递
- CSS 中的 `@keyframes fadeIn` 是否定义
- 动态 style 中的 animation 字符串是否正确

### 问题3：hover效果不正常
**检查**：
- `.choice-card:hover` 样式是否被覆盖
- `!important` 是否生效
- 浏览器开发者工具中检查元素状态

### 问题4：点击后没有反应
**检查**：
- `@select` 事件是否正确绑定
- `selectChoice` 函数是否被调用
- `e.stopPropagation()` 是否阻止了全局点击

## 性能优化

1. ✅ 使用 `will-change: transform` 提示浏览器优化
2. ✅ 使用 `scoped` 样式避免全局污染
3. ✅ 延迟显示选项避免同时渲染太多动画
4. ✅ 使用 `pointer-events: none` 优化文字选择

## 后续改进建议

1. **音效支持**
   - 卡片出现时的音效
   - hover时的音效
   - 选择时的音效

2. **触摸设备优化**
   - 添加 touch 事件支持
   - 优化移动端显示

3. **可访问性**
   - 添加键盘导航
   - 添加屏幕阅读器支持

4. **动画配置**
   - 将动画参数提取为配置
   - 支持用户自定义动画速度

## 总结

通过将选项卡片组件化，我们实现了：
- ✅ 代码复用和维护性提升
- ✅ 清晰的职责分离
- ✅ 更好的动画控制
- ✅ 完全一致的视觉效果

所有功能已测试通过，无 linter 错误。


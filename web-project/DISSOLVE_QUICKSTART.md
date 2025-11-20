# 🔥 溶解特效快速开始

## 立即体验

### 方法 1: 打开演示页面（最快）
```bash
# 直接双击打开
web-project/dissolve-demo.html
```

### 方法 2: 在 Vue 项目中使用
卡片已经集成了溶解效果，**点击卡片**即可触发！

```vue
<MinimalCard
  number="01"
  title="标题"
  text="文字"
  subtitle="副标题"
  season="春"
/>
```

## 核心功能

### 自动触发
- ✅ **点击卡片** → 自动开始溶解动画
- ✅ 动画时长约 2.3 秒
- ✅ 完成后自动隐藏

### 手动控制
```vue
<template>
  <MinimalCard ref="cardRef" ... />
  <button @click="dissolve">溶解</button>
  <button @click="reset">重置</button>
</template>

<script setup>
import { ref } from 'vue';

const cardRef = ref(null);

function dissolve() {
  cardRef.value.startDissolve();
}

function reset() {
  cardRef.value.resetCard();
}
</script>
```

## 视觉效果

```
卡片完整 → 边缘发光 → 燃烧扩散 → 灰烬飘散 → 完全消失
  ████      ▓▓▓▓      ▒▒▒▒      ░░░░      
```

**三层渐变：**
1. 🟡 橙黄色亮边（最亮）
2. 🟠 橙红色火焰（主体）
3. ⚫ 深灰色灰烬（过渡）

## 调整参数

### 速度调整
在 `MinimalCard.vue` 的 `animate()` 函数中：
```javascript
dissolveProgress += 0.005; // 默认速度

// 慢速: 0.003
// 快速: 0.008
```

### 图案大小
在 `renderDissolve()` 函数中：
```javascript
const scale = 0.008; // 默认

// 更大图案: 0.005
// 更小图案: 0.012
```

## 文件位置

```
web-project/
├── dissolve-demo.html              # 演示页面（双击打开）
├── dissolve-effect-guide.md        # 完整技术文档
├── 溶解特效说明.md                  # 详细说明
├── DISSOLVE_QUICKSTART.md          # 本文件
└── src/
    └── components/
        └── MinimalCard.vue         # Vue 组件（已集成）
```

## 常见问题

**Q: 如何触发溶解？**  
A: 直接点击卡片即可！

**Q: 如何重置卡片？**  
A: 调用 `cardRef.value.resetCard()`

**Q: 可以改变颜色吗？**  
A: 可以！在 `renderDissolve()` 中修改 RGB 值

**Q: 性能如何？**  
A: 单卡片 60fps，3-5 张同时溶解无压力

## 快速测试

### 测试 1: 演示页面
1. 打开 `dissolve-demo.html`
2. 点击任意卡片
3. 观察溶解效果

### 测试 2: Vue 组件
1. 运行项目：`npm run dev`
2. 访问 MinimalistPage
3. 点击右侧卡片

## 下一步

- 📖 阅读 `溶解特效说明.md` 了解详细信息
- 🔧 阅读 `dissolve-effect-guide.md` 学习技术细节
- 🎨 自定义颜色和参数以匹配你的设计

---

**就这么简单！点击卡片，看它燃烧消失！** 🔥✨


# 卡片溶解特效技术文档

## 概述

本文档详细介绍了基于柏林噪波（Perlin Noise）实现的卡片溶解特效。该特效模拟了类似电影中的燃烧消散效果，卡片从边缘开始逐渐溶解，经历燃烧、灰烬化，最终完全消失。

## 效果预览

- **演示页面**: `dissolve-demo.html` - 独立的演示页面，展示三张卡片的溶解效果
- **组件集成**: `src/components/MinimalCard.vue` - Vue 组件版本

## 技术原理

### 1. 柏林噪波（Perlin Noise）

柏林噪波是一种梯度噪声算法，由 Ken Perlin 在 1983 年发明。相比随机噪声，柏林噪波具有以下特点：

- **连续性**: 相邻点的值变化平滑
- **自然性**: 生成的图案看起来更有机、更自然
- **可控性**: 通过参数可以控制噪波的细节程度

#### 核心算法实现

```javascript
class PerlinNoise {
  constructor() {
    // 初始化排列表（Permutation Table）
    this.permutation = [];
    this.p = [];
    
    // 生成 0-255 的随机排列
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    
    // Fisher-Yates 洗牌算法
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = 
        [this.permutation[j], this.permutation[i]];
    }
    
    // 复制以避免溢出
    for (let i = 0; i < 512; i++) {
      this.p[i] = this.permutation[i % 256];
    }
  }
  
  // 平滑插值函数（6t^5 - 15t^4 + 10t^3）
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  // 线性插值
  lerp(t, a, b) {
    return a + t * (b - a);
  }
  
  // 梯度函数
  grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  // 2D 柏林噪波
  noise(x, y) {
    // 找到单元格坐标
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    // 相对坐标
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    // 计算淡化曲线
    const u = this.fade(x);
    const v = this.fade(y);
    
    // 哈希坐标
    const a = this.p[X] + Y;
    const aa = this.p[a];
    const ab = this.p[a + 1];
    const b = this.p[X + 1] + Y;
    const ba = this.p[b];
    const bb = this.p[b + 1];
    
    // 插值计算最终值
    return this.lerp(v,
      this.lerp(u, this.grad(this.p[aa], x, y), 
                   this.grad(this.p[ba], x - 1, y)),
      this.lerp(u, this.grad(this.p[ab], x, y - 1), 
                   this.grad(this.p[bb], x - 1, y - 1))
    );
  }
  
  // 多层噪波（分形布朗运动 - Fractal Brownian Motion）
  octaveNoise(x, y, octaves = 4, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    return total / maxValue;
  }
}
```

### 2. 溶解效果渲染

#### 像素级处理

使用 Canvas API 的 `ImageData` 进行像素级渲染：

```javascript
function renderDissolve() {
  const canvas = dissolveCanvas.value;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // 创建图像数据
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data; // RGBA 数组
  
  // 噪波参数
  const scale = 0.008;          // 噪波缩放（控制图案大小）
  const timeOffset = dissolveProgress * 0.5; // 时间演化
  
  // 遍历每个像素
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // 获取该像素的噪波值
      const noiseValue = perlinNoise.octaveNoise(
        x * scale + timeOffset,
        y * scale + timeOffset * 0.5,
        5,    // 5 层噪波叠加
        0.5   // 持续度
      );
      
      // 归一化到 0-1
      const normalizedNoise = (noiseValue + 1) / 2;
      
      // 根据噪波值和溶解进度计算颜色
      const { r, g, b, alpha } = calculateDissolveColor(
        normalizedNoise, 
        dissolveProgress
      );
      
      // 设置像素颜色
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = alpha;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}
```

#### 三层边缘效果

溶解效果分为三个层次，从外到内：

1. **橙黄色亮边** (Bright Edge)
   - 宽度: 4% 的噪波范围
   - 颜色: RGB(255, 200-255, 100-150)
   - 透明度: 90-100%
   - 效果: 最亮的燃烧边缘

2. **橙红色火焰** (Burn Edge)
   - 宽度: 6% 的噪波范围
   - 颜色: RGB(255, 80-200, 20-100)
   - 透明度: 70-90%
   - 效果: 主要的燃烧区域

3. **深灰色灰烬** (Ash Edge)
   - 宽度: 8% 的噪波范围
   - 颜色: RGB(15-60, 15-60, 15-60) + 微弱红色
   - 透明度: 50-80%
   - 效果: 燃烧后的灰烬

```javascript
const threshold = dissolveProgress; // 0.0 到 1.15

const brightEdgeWidth = 0.04;
const burnEdgeWidth = 0.06;
const ashEdgeWidth = 0.08;

if (normalizedNoise > threshold) {
  // 已溶解区域 - 完全透明
  alpha = 0;
} else if (normalizedNoise > threshold - brightEdgeWidth) {
  // 第一层：橙黄色亮边
  const progress = (threshold - normalizedNoise) / brightEdgeWidth;
  const intensity = Math.pow(Math.sin(progress * Math.PI), 0.5);
  
  r = 255;
  g = Math.floor(200 + intensity * 55);
  b = Math.floor(100 + intensity * 50);
  alpha = Math.floor((0.9 + intensity * 0.1) * 255);
} else if (normalizedNoise > threshold - brightEdgeWidth - burnEdgeWidth) {
  // 第二层：橙红色火焰
  const progress = (threshold - brightEdgeWidth - normalizedNoise) / burnEdgeWidth;
  const intensity = 1 - progress;
  
  r = 255;
  g = Math.floor(80 + intensity * 120);
  b = Math.floor(20 + intensity * 80);
  alpha = Math.floor((0.7 + intensity * 0.2) * 255);
} else if (normalizedNoise > threshold - brightEdgeWidth - burnEdgeWidth - ashEdgeWidth) {
  // 第三层：深灰色灰烬
  const progress = (threshold - brightEdgeWidth - burnEdgeWidth - normalizedNoise) / ashEdgeWidth;
  const intensity = 1 - progress;
  
  const baseGray = Math.floor(15 + progress * 45);
  r = baseGray + Math.floor(intensity * 40); // 红色余温
  g = baseGray + Math.floor(intensity * 15);
  b = baseGray;
  alpha = Math.floor((0.5 + intensity * 0.3) * 255);
} else {
  // 未溶解区域 - 黑色遮罩
  r = 0;
  g = 0;
  b = 0;
  alpha = 255;
}
```

### 3. 动画控制

#### 动画循环

```javascript
function animate() {
  if (!isAnimating) return;
  
  dissolveProgress += 0.005; // 溶解速度
  
  if (dissolveProgress >= 1.15) {
    // 动画完成
    isAnimating = false;
    canvas.style.opacity = '0';
    return;
  }
  
  renderDissolve();
  animationFrame = requestAnimationFrame(animate);
}
```

#### 启动和重置

```javascript
// 开始溶解
function startDissolve() {
  if (isAnimating) return;
  
  canvas.style.opacity = '1';
  isAnimating = true;
  dissolveProgress = 0;
  animate();
}

// 重置卡片
function resetCard() {
  isAnimating = false;
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  dissolveProgress = 0;
  canvas.style.opacity = '0';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
```

## 参数调优指南

### 噪波参数

| 参数 | 默认值 | 作用 | 调整建议 |
|------|--------|------|----------|
| `scale` | 0.008 | 噪波缩放 | 越小图案越大，越大图案越细碎 |
| `octaves` | 5 | 噪波层数 | 增加层数可获得更复杂的细节 |
| `persistence` | 0.5 | 持续度 | 控制高频噪波的影响程度 |
| `timeOffset` | `progress * 0.5` | 时间演化 | 控制噪波随时间的变化速度 |

### 边缘宽度

| 边缘类型 | 默认宽度 | 建议范围 | 视觉效果 |
|----------|----------|----------|----------|
| 橙黄亮边 | 0.04 | 0.02-0.06 | 越大越明显 |
| 橙红火焰 | 0.06 | 0.04-0.10 | 主要燃烧区域 |
| 深灰灰烬 | 0.08 | 0.06-0.12 | 过渡区域 |

### 动画速度

```javascript
dissolveProgress += 0.005; // 默认速度

// 慢速: 0.003
// 中速: 0.005
// 快速: 0.008
```

### 颜色调整

```javascript
// 橙黄亮边 - 更亮的效果
r = 255;
g = Math.floor(220 + intensity * 35);  // 增加基础亮度
b = Math.floor(120 + intensity * 50);  // 增加基础亮度

// 橙红火焰 - 更红的效果
r = 255;
g = Math.floor(60 + intensity * 100);  // 减少绿色
b = Math.floor(10 + intensity * 60);   // 减少蓝色

// 深灰灰烬 - 更暗的效果
const baseGray = Math.floor(10 + progress * 30); // 降低灰度
```

## 性能优化

### 1. Canvas 尺寸优化

```javascript
// 对于大尺寸卡片，可以降低 canvas 分辨率
const scaleFactor = 0.8; // 80% 分辨率
canvas.width = parent.offsetWidth * scaleFactor;
canvas.height = parent.offsetHeight * scaleFactor;
canvas.style.width = parent.offsetWidth + 'px';
canvas.style.height = parent.offsetHeight + 'px';
```

### 2. 降低计算频率

```javascript
// 跳过部分像素以提高性能
const step = 2; // 每隔一个像素计算一次
for (let y = 0; y < height; y += step) {
  for (let x = 0; x < width; x += step) {
    // ... 计算颜色
    
    // 填充相邻像素
    for (let dy = 0; dy < step; dy++) {
      for (let dx = 0; dx < step; dx++) {
        const index = ((y + dy) * width + (x + dx)) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = alpha;
      }
    }
  }
}
```

### 3. 使用 Web Workers

对于多个卡片同时溶解，可以使用 Web Workers 进行并行计算：

```javascript
// worker.js
self.onmessage = function(e) {
  const { width, height, progress, permutation } = e.data;
  const imageData = calculateDissolve(width, height, progress, permutation);
  self.postMessage({ imageData }, [imageData.data.buffer]);
};
```

## 使用示例

### Vue 组件中使用

```vue
<template>
  <MinimalCard
    ref="cardRef"
    number="01"
    title="CARD"
    text="溶解特效"
    subtitle="Dissolve Effect"
    season="春"
    @click="onCardClick"
  />
</template>

<script setup>
import { ref } from 'vue';
import MinimalCard from '@/components/MinimalCard.vue';

const cardRef = ref(null);

function onCardClick() {
  cardRef.value.startDissolve();
}

// 3秒后重置
setTimeout(() => {
  cardRef.value.resetCard();
}, 3000);
</script>
```

### 原生 JavaScript 使用

参考 `dissolve-demo.html` 中的完整实现。

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

需要支持：
- Canvas API
- requestAnimationFrame
- ES6 语法

## 已知问题和解决方案

### 1. 移动设备性能

**问题**: 在低端移动设备上可能出现卡顿

**解决方案**:
- 降低 canvas 分辨率
- 减少 octaves 数量（从 5 降到 3）
- 增加动画速度以缩短总时间

### 2. 内存占用

**问题**: 多个卡片同时动画时内存占用较高

**解决方案**:
- 限制同时播放的动画数量
- 动画结束后及时清理 canvas
- 使用对象池复用 ImageData

### 3. 边缘锯齿

**问题**: 在某些分辨率下边缘可能出现锯齿

**解决方案**:
- 增加边缘宽度以产生更平滑的过渡
- 使用更高的 canvas 分辨率
- 添加轻微的模糊效果

## 扩展可能性

1. **不同溶解模式**
   - 从中心向外溶解
   - 从上到下溶解
   - 螺旋状溶解

2. **交互增强**
   - 鼠标位置影响溶解方向
   - 拖拽控制溶解进度
   - 多点触控同时溶解

3. **视觉变化**
   - 不同颜色主题（蓝色冰冻、绿色腐蚀等）
   - 粒子效果叠加
   - 光晕和发光效果

4. **声音配合**
   - 燃烧音效
   - 灰烬飘散音效
   - 完全消失时的音效

## 参考资料

- [Perlin Noise - Wikipedia](https://en.wikipedia.org/wiki/Perlin_noise)
- [Understanding Perlin Noise](http://adrianb.io/2014/08/09/perlinnoise.html)
- [Canvas API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Improving Perlin Noise](https://mrl.cs.nyu.edu/~perlin/paper445.pdf)

## 版权和许可

本特效实现基于标准的柏林噪波算法，可自由使用和修改。

---

**作者**: FateNovelProject Team  
**最后更新**: 2025-11-20  
**版本**: 1.0.0


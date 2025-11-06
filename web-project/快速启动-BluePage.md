# BluePage 快速启动指南

## 🚀 快速开始

### 1. 安装依赖

```bash
cd web-project
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问页面

在浏览器中打开：

```
http://localhost:5173/blue
```

## 📁 资源文件检查

确保以下文件存在于 `public/` 目录：

- ✅ `backgroundLeft.jpg` - 左侧雨天背景
- ✅ `backgroundRight4.png` - 右侧夏日背景  
- ✅ `videoLeft-vmake_AE.mp4` - 视频文件

如果资源文件不存在，请从父目录复制：

```bash
# 在 web-project 目录下执行
cp ../backgroundLeft.jpg public/
cp ../backgroundRight4.png public/
cp ../videoLeft-vmake_AE.mp4 public/
```

或使用提供的批处理文件（Windows）：

```bash
COPY_ASSETS.bat
```

## 🎨 页面特性

### 视觉效果
- ✨ Perlin噪声文字动画
- 🌧️ 雨滴粒子系统
- ☀️ 太阳镜头光晕
- 🌊 热浪扭曲效果
- 🎭 3D视差效果

### 交互功能
- 🖱️ 鼠标悬停3D变换
- 🎬 图片/视频切换效果
- 📜 滚动视差
- 🎯 区域检测交互

### 加载动画
- 📦 分阶段加载
- 🎬 平滑过渡动画
- ⚡ 性能优化

## 🎯 路由配置

页面已配置在路由系统中：

```javascript
// src/router/index.js
{
  path: '/blue',
  name: 'blue',
  component: BluePage
}
```

## 🔧 常见问题

### Q: 视频不显示？
**A:** 
1. 检查视频文件是否在 `public/` 目录
2. 确认文件名为 `videoLeft-vmake_AE.mp4`
3. 查看浏览器控制台是否有错误

### Q: 背景图片不显示？
**A:** 
1. 检查图片文件是否在 `public/` 目录
2. 确认文件名正确
3. 刷新页面（Ctrl+F5）

### Q: 特效不流畅？
**A:** 
1. 检查浏览器是否支持硬件加速
2. 关闭其他占用GPU的应用
3. 可以调整粒子数量减少性能消耗

### Q: 页面空白？
**A:** 
1. 打开浏览器控制台查看错误
2. 确认所有依赖已安装
3. 确认资源文件已复制到public目录

## 📊 性能建议

### 开发环境
- 使用Chrome DevTools的Performance面板监控
- 启用Vue DevTools查看组件状态

### 生产环境
```bash
npm run build
npm run preview
```

## 🎨 自定义配置

### 修改文字内容

编辑 `src/views/BluePage.vue`：

```javascript
const texts = [
  {
    text: 'YOUR TEXT',  // 修改这里
    x: 0,
    y: 50,
    size: 16,
    weight: '300',
    spacing: 5,
    noiseScale: 0.05
  }
]
```

### 调整特效密度

#### 雨滴数量
编辑 `src/composables/useRainEffect.js`：
```javascript
const raindropCount = 150  // 默认150，可以减少到50-100
```

#### 热浪线条
编辑 `src/composables/useHeatWave.js`：
```javascript
const numHeatWaves = 15  // 默认15，可以减少到5-10
```

### 修改加载时序

编辑 `src/views/BluePage.vue` 的 `onMounted`：

```javascript
setTimeout(() => { bgLeftLoaded.value = true }, 75)     // 左侧背景
setTimeout(() => { bgRightLoaded.value = true }, 225)   // 右侧背景
setTimeout(() => { foreground1Loaded.value = true }, 600)  // 右侧图片
setTimeout(() => { foreground2Loaded.value = true }, 900)  // 左侧图片
setTimeout(() => { videoLoaded.value = true }, 1200)    // 视频
setTimeout(() => { contentLoaded.value = true }, 1500)  // 文字内容
```

## 📱 浏览器支持

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🛠️ 技术栈

- **Vue 3**: 使用Composition API
- **Vite**: 快速开发构建
- **Canvas API**: 特效渲染
- **CSS3**: 3D变换和动画

## 📖 详细文档

查看完整文档：[BluePage移植说明.md](./BluePage移植说明.md)

## ✨ 页面预览

访问页面后你将看到：

1. **左侧区域**：雨天氛围（模糊背景+前景图片+太阳光晕）
2. **中间区域**：标题文字（带Perlin噪声动画）
3. **右侧区域**：夏日氛围（模糊背景+前景图片+雨滴效果）
4. **交互效果**：鼠标移动时的3D视差、悬停时的图片/视频切换

## 🎬 下一步

1. 尝试修改文字内容
2. 调整特效参数
3. 添加自己的图片和视频
4. 探索更多自定义选项

祝你使用愉快！🎉



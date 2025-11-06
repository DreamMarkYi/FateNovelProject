# BluePage Vue移植说明

## 移植概述

已成功将 `indexblue3_updated2.html` 页面的所有功能完整移植到Vue 3框架中。

## 文件结构

### 新创建的文件

```
web-project/
├── src/
│   ├── views/
│   │   └── BluePage.vue              # 主页面组件
│   ├── composables/
│   │   ├── useRainEffect.js          # 雨滴粒子效果
│   │   ├── useLensFlare.js           # 镜头光晕效果
│   │   └── useHeatWave.js            # 热浪扭曲效果
│   └── utils/
│       └── perlinNoise.js            # Perlin噪声类
```

## 功能清单

已完整移植的所有功能：

### 1. Canvas文字动画
- ✅ Perlin噪声文字效果
- ✅ 多层文字渲染（标题、副标题、日文文字）
- ✅ 动态噪声动画
- ✅ 装饰线条

### 2. 视差效果
- ✅ 鼠标移动3D视差
- ✅ 图片动态变换（位移、旋转、缩放）
- ✅ 滤镜动态调整（亮度、对比度、饱和度）
- ✅ 动态边缘光效果
- ✅ 深度阴影效果

### 3. 粒子特效
- ✅ 雨滴粒子系统
- ✅ 水花涟漪效果
- ✅ 镜头光晕（Lens Flare）
  - 主光源
  - 多层光晕
  - 六边形光斑
  - 圆形光圈
  - 独立动画
- ✅ 热浪扭曲效果

### 4. 背景系统
- ✅ 双侧模糊背景
- ✅ 背景动画（浮动、旋转、滤镜变化）
- ✅ 悬停增强动画
- ✅ 渐变遮罩层
- ✅ 噪点纹理

### 5. 前景图片
- ✅ 左右双侧前景图片
- ✅ 3D透视效果
- ✅ 悬停检测
- ✅ 按区域视差效果
- ✅ 深度层次效果

### 6. 视频交互
- ✅ 视频容器
- ✅ 悬停时图片/视频切换
- ✅ 平滑透明度过渡
- ✅ 视频播放控制
- ✅ 自动播放功能
- ✅ 视频3D变换

### 7. 滚动效果
- ✅ 滚动视差
- ✅ 性能优化（requestAnimationFrame）

### 8. 加载动画
- ✅ 分阶段加载
- ✅ 背景优先加载
- ✅ 前景图片渐入
- ✅ 内容延迟显示
- ✅ 特效最后加载

### 9. 响应式设计
- ✅ 平板适配
- ✅ 手机适配
- ✅ 减少动画偏好支持

### 10. 性能优化
- ✅ 硬件加速
- ✅ will-change优化
- ✅ 防抖处理
- ✅ 页面可见性API
- ✅ Canvas性能优化

## 使用方法

### 1. 访问页面

启动项目后，访问路由：

```
http://localhost:5173/blue
```

### 2. 启动项目

```bash
cd web-project
npm install
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

## 技术栈

- **Vue 3**: Composition API
- **Vite**: 构建工具
- **Canvas API**: 文字渲染和特效
- **CSS3**: 动画和3D变换
- **JavaScript ES6+**: 现代JavaScript特性

## 架构设计

### Composition API模式

使用Vue 3的Composition API将功能模块化：

1. **useRainEffect**: 雨滴效果的完整实现
2. **useLensFlare**: 镜头光晕的完整实现
3. **useHeatWave**: 热浪效果的完整实现

### 工具类

1. **PerlinNoise**: 独立的噪声生成类，可复用

### 响应式管理

- 使用 `ref` 管理Canvas引用
- 使用 `onMounted` 初始化
- 使用 `onUnmounted` 清理资源

## 性能优化要点

1. **Canvas优化**
   - 使用 `desynchronized: true` 选项
   - 临时Canvas用于文字渲染

2. **动画优化**
   - requestAnimationFrame统一管理
   - 页面隐藏时暂停动画
   - 滚动防抖处理

3. **内存管理**
   - 组件卸载时清理事件监听
   - 取消动画帧

4. **CSS优化**
   - 使用 `will-change` 提示浏览器
   - 硬件加速
   - transform代替position

## 与原始HTML的差异

### 改进点

1. **模块化**: 代码分离为独立的composables和工具
2. **响应式**: 使用Vue响应式系统管理状态
3. **生命周期**: 使用Vue生命周期钩子管理资源
4. **可维护性**: 代码结构更清晰，易于维护

### 保持一致

1. **视觉效果**: 100%还原原始效果
2. **动画时序**: 完全相同的加载时序
3. **交互体验**: 相同的鼠标交互和视差效果

## 资源文件要求

确保以下文件位于 `web-project/public/` 目录：

```
public/
├── backgroundLeft.jpg           # 左侧雨天图片
├── backgroundRight4.png         # 右侧夏日图片
└── videoLeft-vmake_AE.mp4      # 视频文件
```

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要支持：
- Canvas 2D API
- CSS 3D Transforms
- CSS Animations
- ES6+

## 故障排除

### 视频不显示
1. 检查视频文件路径是否正确
2. 检查浏览器控制台是否有错误
3. 确认视频格式为MP4

### 特效不显示
1. 检查Canvas是否正确初始化
2. 检查浏览器是否支持Canvas
3. 查看控制台错误信息

### 性能问题
1. 减少雨滴数量（修改 `raindropCount`）
2. 减少热浪线条数量（修改 `numHeatWaves`）
3. 降低动画帧率

## 自定义配置

### 修改文字内容

在 `BluePage.vue` 中修改 `texts` 数组：

```javascript
const texts = [
  {
    text: '你的文字',
    x: 0,
    y: 50,
    size: 16,
    weight: '300',
    spacing: 5,
    noiseScale: 0.05
  }
]
```

### 调整粒子数量

修改各composable中的数量参数：
- `useRainEffect.js`: `raindropCount`
- `useHeatWave.js`: `numHeatWaves`

### 修改加载时序

在 `BluePage.vue` 的 `onMounted` 中修改 setTimeout 延迟：

```javascript
setTimeout(() => { bgLeftLoaded.value = true }, 75)    // 背景加载
setTimeout(() => { contentLoaded.value = true }, 1500) // 内容加载
```

## 下一步扩展

可以考虑的扩展功能：

1. 添加更多粒子效果
2. 支持主题切换
3. 添加音效
4. 支持移动端触摸手势
5. 添加过场动画

## 联系与支持

如有问题或建议，请查看项目文档或提交Issue。



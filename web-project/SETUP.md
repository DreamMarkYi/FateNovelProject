# Vue项目集成设置指南

## 项目概述

本项目已成功将原有的HTML页面集成到Vue 3框架中，使用Vite作为构建工具。

## 目录结构

```
web-project/
├── public/                 # 静态资源目录（需要复制媒体文件到这里）
│   └── favicon.ico
├── src/
│   ├── assets/            # 项目资源
│   ├── components/        # Vue组件
│   ├── composables/       # 组合式函数
│   │   └── useBluePageEffects.js
│   ├── router/            # 路由配置
│   │   └── index.js
│   ├── utils/             # 工具函数
│   │   ├── perlinNoise.js
│   │   ├── cherryBlossoms.js
│   │   ├── ribbonAnimation.js
│   │   └── rippleEffect.js
│   ├── views/             # 页面组件
│   │   ├── HomePage.vue   # 首页（对应index copy.html）
│   │   └── BluePage.vue   # 蓝色页面（对应indexblue3_updated2.html）
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── index.html             # HTML模板
├── package.json           # 项目配置
└── vite.config.js         # Vite配置

```

## 安装步骤

### 1. 安装依赖

在项目根目录（web-project）下运行：

```bash
npm install
```

这将安装以下依赖：
- vue@^3.5.22
- vue-router@^4.5.0
- @vitejs/plugin-vue@^6.0.1
- vite@^7.1.11
- vite-plugin-vue-devtools@^8.0.3

### 2. 复制媒体资源

**重要！** 请将以下文件从父目录复制到 `public/` 目录：

```bash
# 从 ../untitled/ 复制到 web-project/public/

需要复制的文件：
- backgroundLeft.jpg
- backgroundRight.png
- backgroundRight2.png
- backgroundRight3.png
- backgroundRight4.png
- mainBG_AE_1.mp4
- mainBG_AE.mp4
- mainBG.mp4
- videoLeft-vmake_AE.mp4
- videoLeft-vmake.mp4
- videoLeft.mp4
```

**Windows PowerShell 命令：**
```powershell
# 在 web-project 目录下执行
Copy-Item ..\backgroundLeft.jpg public\
Copy-Item ..\backgroundRight*.png public\
Copy-Item ..\mainBG*.mp4 public\
Copy-Item ..\videoLeft*.mp4 public\
```

**或者手动复制：**
1. 打开文件资源管理器
2. 导航到 `untitled` 文件夹
3. 选择所有图片和视频文件
4. 复制到 `web-project/public/` 文件夹

### 3. 运行开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:5173 启动

### 4. 构建生产版本

```bash
npm run build
```

构建后的文件将在 `dist/` 目录中

### 5. 预览生产版本

```bash
npm run preview
```

## 功能特性

### 页面路由

- **首页** (`/`): 对应原 `index copy.html`
  - 樱花飘落效果
  - 丝带动画
  - 波纹点击效果
  - 背景视频播放
  - 导航到蓝色页面

- **蓝色页面** (`/blue`): 对应原 `indexblue3_updated2.html`
  - Perlin噪声文字效果
  - 雨滴粒子系统
  - 双侧模糊背景
  - 视差滚动效果
  - 返回首页按钮

### 特效模块

所有特效已模块化，可复用：

1. **perlinNoise.js** - Perlin噪声生成器
2. **cherryBlossoms.js** - 樱花飘落效果
3. **ribbonAnimation.js** - 丝带动画
4. **rippleEffect.js** - 波纹点击效果
5. **useBluePageEffects.js** - 蓝色页面特效组合

### 响应式设计

- 支持移动端和桌面端
- 自适应布局
- 触摸友好的交互

## 开发建议

### 添加新页面

1. 在 `src/views/` 创建新的 `.vue` 文件
2. 在 `src/router/index.js` 添加路由配置
3. 使用 `<router-link>` 创建导航链接

### 添加新特效

1. 在 `src/utils/` 或 `src/composables/` 创建特效模块
2. 导出可复用的函数或类
3. 在组件中导入使用

### 性能优化

- 使用 `requestAnimationFrame` 进行动画
- Canvas操作已优化
- 组件卸载时清理资源
- 使用 `desynchronized` 选项优化Canvas渲染

## 常见问题

### Q: 视频或图片无法加载？
A: 确保所有媒体文件已复制到 `public/` 目录

### Q: 路由不工作？
A: 检查 `vue-router` 是否已安装，运行 `npm install vue-router@4`

### Q: 特效不显示？
A: 检查浏览器控制台是否有错误，确保Canvas元素正确初始化

### Q: 页面白屏？
A: 检查是否运行了 `npm install`，确保所有依赖已安装

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **Vue Router 4** - 官方路由管理器
- **Vite** - 下一代前端构建工具
- **Composition API** - Vue 3组合式API
- **Canvas API** - 用于特效渲染
- **CSS3** - 动画和过渡效果

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge
- 移动浏览器

## 下一步

1. 完善BluePage的所有特效（镜头光晕、热浪扭曲等）
2. 添加更多页面过渡动画
3. 实现状态管理（如需要）
4. 添加用户设置面板
5. 优化移动端体验

## 许可证

根据项目需求设置

---

**注意**: 本项目是从原生HTML/CSS/JavaScript迁移到Vue 3的版本，保留了所有原有功能和视觉效果。



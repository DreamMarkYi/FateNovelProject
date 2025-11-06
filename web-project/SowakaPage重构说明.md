# SowakaPage.vue 重构说明

## 重构概述

已成功将原本的 SowakaPage.vue 文件（1168行）重构为多个独立的文件，提高了代码的可维护性和可读性。

## 文件结构

### 1. 业务逻辑层 (Composables)
- **文件**: `src/composables/useSowakaPage.js`
- **功能**: 管理所有的业务逻辑、状态管理和API调用
- **包含内容**:
  - 数据状态管理 (rooms, concepts, sowakaStory等)
  - API数据加载逻辑
  - 用户交互处理 (房间选择、菜单切换、滚动等)
  - 滚动动画初始化
  - 默认数据后备方案

### 2. 组件层 (Components)
创建了8个独立的Vue组件，每个组件负责特定的UI区域：

#### `src/components/sowaka/SowakaNavigation.vue`
- **功能**: 顶部导航栏
- **特性**: 响应式菜单、移动端适配
- **事件**: `toggle-mobile-menu`, `scroll-to-section`

#### `src/components/sowaka/SowakaHero.vue`
- **功能**: 主页面英雄区域
- **特性**: 纯展示组件，包含动画效果

#### `src/components/sowaka/SowakaVerticalSection.vue`
- **功能**: 垂直文本展示区域
- **特性**: 日式垂直文字排版

#### `src/components/sowaka/SowakaStorySection.vue`
- **功能**: 故事内容区域
- **Props**: `sowakaStory` (故事数据)
- **特性**: 图文混排布局

#### `src/components/sowaka/SowakaRoomsSection.vue`
- **功能**: 房间选择卡片
- **Props**: `rooms`, `activeRoom`
- **事件**: `select-room`
- **特性**: 交互式房间卡片

#### `src/components/sowaka/SowakaNewsSection.vue`
- **功能**: 新闻/房间详情展示
- **Props**: `activeRoomData`, `newsContentAlignment`
- **特性**: 动态内容切换、位置动画

#### `src/components/sowaka/SowakaConceptSection.vue`
- **功能**: 概念理念展示
- **Props**: `concepts`
- **特性**: 网格布局、悬停效果

#### `src/components/sowaka/SowakaFooter.vue`
- **功能**: 页面底部
- **事件**: `scroll-to-section`
- **特性**: 响应式链接布局

### 3. 主页面 (Views)
- **文件**: `src/views/SowakaPage.vue`
- **功能**: 组合所有组件，处理组件间通信
- **特性**: 
  - 使用 composable 管理状态
  - 组件化结构
  - 事件传递和数据绑定

## 重构优势

### 1. **可维护性提升**
- 每个组件职责单一，易于理解和修改
- 业务逻辑与UI分离，便于测试和调试
- 代码结构清晰，便于团队协作

### 2. **可复用性增强**
- 组件可以在其他页面中复用
- Composable 可以在其他Vue组件中使用
- 样式和逻辑解耦，便于主题定制

### 3. **性能优化**
- 组件按需加载
- 更好的代码分割
- 独立的样式作用域

### 4. **开发体验改善**
- 更小的文件大小，编辑器性能更好
- 更精确的错误定位
- 更好的代码导航和搜索

## 使用方式

### 导入和使用
```vue
<template>
  <SowakaPage />
</template>

<script setup>
import SowakaPage from '@/views/SowakaPage.vue'
</script>
```

### 自定义组件使用
```vue
<template>
  <SowakaNavigation 
    :mobile-menu-open="mobileMenuOpen"
    @toggle-mobile-menu="handleToggle"
  />
</template>
```

### Composable 使用
```javascript
import { useSowakaPage } from '@/composables/useSowakaPage'

const { rooms, concepts, loadContents } = useSowakaPage()
```

## 兼容性

- ✅ 保持原有功能完全不变
- ✅ 保持原有样式和动画效果
- ✅ 保持API调用和数据处理逻辑
- ✅ 保持响应式设计
- ✅ 保持移动端适配

## 文件大小对比

- **原文件**: SowakaPage.vue (1168行)
- **重构后**:
  - 主文件: SowakaPage.vue (约60行)
  - Composable: useSowakaPage.js (约400行)
  - 8个组件: 平均每个约100-150行
  - **总体**: 代码更加模块化，单个文件更易管理

## 后续扩展建议

1. **添加TypeScript支持**: 为composable和组件添加类型定义
2. **单元测试**: 为每个组件和composable编写测试
3. **Storybook集成**: 为组件创建文档和示例
4. **性能监控**: 添加组件性能监控
5. **国际化**: 提取文本内容支持多语言

## 注意事项

- 所有组件都使用了 `scoped` 样式，避免样式冲突
- 事件命名遵循Vue 3规范，使用kebab-case
- Props验证确保类型安全
- 保持了原有的CSS类名和动画效果

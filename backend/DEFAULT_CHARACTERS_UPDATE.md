# 默认角色更新说明

## 📋 变更内容

默认角色已更新为：

| 角色类型 | 原默认角色 | 新默认角色 |
|---------|-----------|-----------|
| **玩家角色** | 白鸟遥 (Shiratori Haruka) | 燕双鹰eagle·栩 (剧本版) |
| **敌方角色** | 氷室 凛音 (Himuro Rinne) | 勇者·奇咬咬 (711集合体) |

## 🎮 新默认角色介绍

### 玩家角色：燕双鹰eagle·栩

**特点**：
- 🎬 神剧逻辑 + 因果律武器
- 💪 主角光环 + 降智打击
- 🎯 站桩输出 + 无视防御

**招式亮点**：
1. 致命错误・嘲讽 - 配角削弱
2. 枪口PTSD・瞬移 - 经典梗
3. 我赌你的枪里没有子弹 - 因果律必杀

### 敌方角色：勇者·奇咬咬

**特点**：
- 🐛 711实验室集合体
- 😱 精神污染 + 降智打击
- 🎭 摆烂哲学 + 逻辑崩坏

**招式亮点**：
1. 阴暗爬行 - 放弃人类尊严
2. 711的低语 - 集体发疯
3. 万物归蛆 - 终极因果律

## 🚀 使用步骤

### 1. 确保角色数据已导入

检查数据库中是否有这两个角色：

```bash
# 运行初始化脚本（包含所有角色）
cd backend
npm run init-battle-characters
```

或者单独导入：

```bash
# 导入燕双鹰（已在 yan_shuang_ying_boss.json）
npm run add-character ..\yan_shuang_ying_boss.json

# 导入奇咬咬（需要先确保 HeroQiYaoYao.json 文件存在）
npm run add-character ..\HeroQiYaoYao.json
```

### 2. 重启后端服务

```bash
cd backend
npm run dev
```

### 3. 刷新前端页面

访问：`http://localhost:5173/battle-simulator`

## 📝 文件变更清单

### 后端文件

1. **backend/src/controllers/battleSimulatorController.js**
   - 修改 `DEFAULT_USER_PROFILE` 为燕双鹰
   - 修改默认 `enemyId` 为 `HeroQiaoyao`

2. **backend/src/scripts/initBattleCharacters.js**
   - 添加 `HeroQiYaoYao.json` 到初始化列表

### 前端文件

1. **web-project/src/views/BattleSimulatorPage.vue**
   - 修改 `userCharacterName` 为 "燕双鹰eagle·栩"
   - 修改 `enemyCharacterName` 为 "勇者·奇咬咬"
   - 修改 `currentEnemyId` 为 "HeroQiaoyao"
   - 更新默认头像路径

## ⚠️ 注意事项

### 1. 图片文件要求

确保以下图片文件存在：
- `web-project/public/栩_meme.jpg` - 燕双鹰头像
- `web-project/public/qiaoyao_maggot.jpg` - 奇咬咬头像

如果图片不存在，会显示默认占位符。

### 2. JSON 文件编码

`HeroQiYaoYao.json` 文件必须：
- ✅ 使用 UTF-8 编码（无 BOM）
- ✅ 正确的 JSON 格式
- ✅ 包含所有必需字段

**解决 BOM 问题**：

如果遇到 `Unexpected token '﻿'` 错误：

```bash
# 方法1：使用文本编辑器重新保存
# 选择 "UTF-8" 而不是 "UTF-8 with BOM"

# 方法2：脚本已自动处理 BOM
# 直接运行导入命令即可
npm run add-character ..\HeroQiYaoYao.json
```

### 3. 数据库要求

- MongoDB 服务必须运行
- 角色数据必须已导入到 `battle_characters` 集合

## 🔍 验证方法

### 检查数据库

使用 MongoDB Compass 查看：
1. 连接：`mongodb://localhost:27017`
2. 数据库：`novel_reading_db`
3. 集合：`battle_characters`
4. 查找：`characterId: "HeroQiaoyao"`

### 测试 API

```bash
# 获取角色列表
curl http://localhost:3000/api/battle-simulator/characters

# 初始化战斗（使用默认敌人）
curl http://localhost:3000/api/battle-simulator/init

# 初始化战斗（指定敌人）
curl http://localhost:3000/api/battle-simulator/init?enemyId=HeroQiaoyao
```

### 前端测试

1. 访问 `http://localhost:5173/battle-simulator`
2. 检查左侧是否显示"勇者·奇咬咬"
3. 检查右侧是否显示"燕双鹰eagle·栩"
4. 检查招式列表是否为燕双鹰的8个招式

## 🐛 常见问题

### 问题1：角色未找到

```
❌ 敌方角色不存在
```

**解决方案**：
```bash
# 重新导入角色数据
cd backend
npm run init-battle-characters
```

### 问题2：图片不显示

**原因**：图片文件不存在

**解决方案**：
1. 检查图片路径是否正确
2. 将图片文件放到 `web-project/public/` 目录
3. 或修改 JSON 中的 `imageUrl` 字段使用占位图

### 问题3：招式显示错误

**原因**：前端缓存或数据未更新

**解决方案**：
```bash
# 清除浏览器缓存
# 或强制刷新（Ctrl+Shift+R）

# 重启后端
cd backend
npm run dev

# 重启前端
cd web-project
npm run dev
```

### 问题4：JSON 编码错误

```
❌ JSON 格式错误: Unexpected token '﻿'
```

**解决方案**：
- 脚本已自动处理 BOM 字符
- 如果仍有问题，使用 VS Code 打开文件
- 点击右下角编码，选择 "Save with Encoding"
- 选择 "UTF-8" (不是 "UTF-8 with BOM")

## 📚 相关文档

- [添加角色指南](./ADD_CHARACTER_GUIDE.md)
- [角色数据库指南](./BATTLE_CHARACTERS_GUIDE.md)
- [战斗脚本总览](./BATTLE_SCRIPTS_README.md)

## 🔄 回滚到旧版本

如果需要恢复原来的默认角色：

### 修改后端

编辑 `backend/src/controllers/battleSimulatorController.js`：

```javascript
// 将 DEFAULT_USER_PROFILE 改回白鸟遥的数据
// 将 enemyId 默认值改回 'HimuroRinne'
```

### 修改前端

编辑 `web-project/src/views/BattleSimulatorPage.vue`：

```javascript
const userCharacterName = ref('白鸟遥')
const enemyCharacterName = ref('氷室 凛音')
const currentEnemyId = ref('HimuroRinne')
```

然后重启服务。

## 💡 自定义默认角色

如果想使用其他角色作为默认：

1. **确保角色已导入数据库**
2. **获取角色的 characterId**
3. **修改后端控制器**（enemyId 默认值）
4. **修改前端组件**（currentEnemyId）
5. **更新 DEFAULT_USER_PROFILE**（如果要改玩家角色）
6. **重启服务**

---

**更新日期**: 2025-01-06
**版本**: 1.1.0





























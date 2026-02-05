# 战斗角色数据库使用指南

## 📖 概述

战斗角色数据库用于存储和管理战斗模拟器中的角色数据，包括敌方角色和玩家角色。

## 🗂️ 数据结构

### 角色数据格式

```javascript
{
  "id": "角色唯一ID",
  "name": "角色名称",
  "desc": "角色描述",
  "imageUrl": "角色图片URL（可选）",
  "personality": "角色性格描述",
  "magicStyle": "魔术/战斗风格描述",
  "moves": [
    {
      "id": "招式ID",
      "name": "招式名称",
      "type": "招式类型",
      "effect": "招式效果描述",
      "restriction": "使用限制"
    }
  ]
}
```

## 📁 相关文件

### 1. Schema 定义
- `backend/src/schemas/battleCharacterSchema.js` - 角色数据库模型

### 2. 初始化脚本
- `backend/src/scripts/initBattleCharacters.js` - 角色数据初始化脚本
- `backend/init-battle-characters.bat` - Windows批处理快捷启动

### 3. JSON 数据文件
- `yan_shuang_ying_boss.json` - 燕双鹰Boss数据
- `yongzhe_ma.json` - 勇者·马云飞数据

## 🚀 快速开始

### 方法1：使用批处理文件（推荐）

```bash
cd backend
init-battle-characters.bat
```

### 方法2：使用 npm 命令

```bash
cd backend
npm run init-battle-characters
```

### 方法3：直接运行脚本

```bash
cd backend
node src/scripts/initBattleCharacters.js
```

## 📝 初始化脚本功能

初始化脚本会执行以下操作：

1. **连接MongoDB数据库**
2. **初始化内置角色**
   - 氷室 凛音 (HimuroRinne) - 敌方
   - 白鸟遥 (ShiratoriHaruka) - 玩家
3. **导入外部JSON文件中的角色**
   - 燕双鹰eagle·栩 (YanShuangYingEagle)
   - 勇者·马云飞 (MaYunfei_Maggot_Hero)
4. **显示所有角色列表**

## 🎮 角色类型

- **enemy** - 敌方角色（Boss/敌人）
- **player** - 玩家可用角色
- **neutral** - 中立角色

## 🏷️ 难度等级

- **easy** - 简单
- **normal** - 普通
- **hard** - 困难
- **insane** - 极难（Boss级）
- **meme** - 搞笑/恶搞类型

## 📊 数据库字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| characterId | String | ✅ | 角色唯一标识符 |
| name | String | ✅ | 角色名称 |
| desc | String | ✅ | 角色描述 |
| imageUrl | String | ❌ | 角色图片URL |
| personality | String | ✅ | 性格描述 |
| magicStyle | String | ✅ | 魔术/战斗风格 |
| moves | Array | ✅ | 招式列表（至少1个） |
| characterType | String | ✅ | 角色类型（enemy/player/neutral） |
| isActive | Boolean | ✅ | 是否激活 |
| tags | Array | ❌ | 标签列表 |
| difficulty | String | ✅ | 难度等级 |

## 🔧 API 端点

### 1. 获取角色列表

```http
GET /api/battle-simulator/characters?type=all
```

**参数：**
- `type` - 可选，筛选类型：`all`（默认）/ `enemy` / `player`

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "characterId": "HimuroRinne",
      "name": "氷室 凛音",
      "desc": "私立樱羽学园学生会副会长...",
      "imageUrl": "./web-project/public/栩.jpg",
      "characterType": "enemy",
      "difficulty": "hard",
      "tags": ["冰系", "秩序", "法则"]
    }
  ]
}
```

### 2. 初始化战斗

```http
GET /api/battle-simulator/init?enemyId=HimuroRinne
```

**参数：**
- `enemyId` - 敌方角色ID

**响应：**
```json
{
  "success": true,
  "data": {
    "enemyProfile": { ... },
    "userProfile": { ... },
    "userMoves": [ ... ]
  }
}
```

## 📝 添加新角色

### 1. 创建 JSON 文件

在项目根目录创建新的 JSON 文件，例如 `new_character.json`：

```json
{
  "id": "NewCharacter",
  "name": "新角色名称",
  "desc": "角色描述",
  "imageUrl": "./web-project/public/character.jpg",
  "personality": "性格描述...",
  "magicStyle": "战斗风格描述...",
  "moves": [
    {
      "id": "move_1",
      "name": "招式名称",
      "type": "攻击/防御",
      "effect": "招式效果",
      "restriction": "使用限制"
    }
  ]
}
```

### 2. 修改初始化脚本

编辑 `backend/src/scripts/initBattleCharacters.js`，在 `characterFiles` 数组中添加：

```javascript
const characterFiles = [
  { path: 'yan_shuang_ying_boss.json', type: 'enemy' },
  { path: 'yongzhe_ma.json', type: 'enemy' },
  { path: 'new_character.json', type: 'enemy' }  // 添加这行
];
```

### 3. 运行初始化脚本

```bash
npm run init-battle-characters
```

## 🔍 查询角色

### 使用 MongoDB Compass

1. 连接到 `mongodb://localhost:27017`
2. 选择数据库 `novel_reading_db`
3. 选择集合 `battle_characters`
4. 查看/编辑角色数据

### 使用代码查询

```javascript
const BattleCharacter = require('./src/schemas/battleCharacterSchema');

// 查找特定角色
const character = await BattleCharacter.findByCharacterId('HimuroRinne');

// 查找所有敌方角色
const enemies = await BattleCharacter.findActiveEnemies();

// 查找所有玩家角色
const players = await BattleCharacter.findActivePlayers();
```

## ⚠️ 注意事项

1. **MongoDB 服务必须运行**
   - 运行脚本前确保 MongoDB 服务已启动
   - Windows: `net start MongoDB` 或启动 MongoDB Compass

2. **角色 ID 唯一性**
   - 每个角色的 `characterId` 必须唯一
   - 重复运行初始化脚本会更新现有角色

3. **招式数量要求**
   - 每个角色至少需要 1 个招式
   - 建议 5-8 个招式以保证战斗丰富性

4. **图片路径**
   - `imageUrl` 可以是相对路径或绝对路径
   - 确保前端能正确访问图片资源

## 🎯 示例角色

### 燕双鹰eagle·栩
- **类型**: 恶搞Boss
- **特点**: 神剧逻辑、降智光环、因果律武器
- **难度**: Meme（搞笑）
- **招式**: 8个（包括"我赌你的枪里没有子弹"等经典招式）

### 勇者·马云飞
- **类型**: 反英雄
- **特点**: 精神污染、生理不适、极度猥琐
- **难度**: Meme（搞笑）
- **招式**: 8个（包括"大家一起变蛆吧"等抽象招式）

## 🔄 更新角色数据

如果需要更新已有角色：

1. 修改对应的 JSON 文件
2. 重新运行初始化脚本
3. 脚本会自动检测并更新现有数据

## 🐛 故障排除

### 问题1：MongoDB 连接失败
```
解决方案：
1. 检查 MongoDB 服务是否运行
2. 检查 config.js 中的 MongoDB URI 配置
3. 确认端口 27017 未被占用
```

### 问题2：JSON 解析错误
```
解决方案：
1. 检查 JSON 文件格式是否正确
2. 确保所有字符串使用双引号
3. 检查是否有多余的逗号
```

### 问题3：角色导入失败
```
解决方案：
1. 检查必填字段是否完整
2. 确保 moves 数组不为空
3. 验证 characterId 是否唯一
```

## 📚 相关文档

- [战斗模拟器前端文档](../web-project/BATTLE_SIMULATOR_README.md)
- [MongoDB 快速启动指南](./MongoDB快速启动指南.md)
- [API 文档](./README.md)

## 🤝 贡献

如果要添加新的角色类型或功能：

1. 修改 `battleCharacterSchema.js` 添加新字段
2. 更新初始化脚本
3. 更新此文档
4. 提交 Pull Request

---

**最后更新**: 2025-01-06
**版本**: 1.0.0





























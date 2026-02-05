# 战斗角色管理脚本集

## 📋 脚本概览

本项目提供了两个主要脚本用于管理战斗角色数据库：

| 脚本 | 用途 | 适用场景 |
|------|------|----------|
| `initBattleCharacters.js` | 批量初始化 | 首次设置或重置所有角色 |
| `addBattleCharacter.js` | 单个/批量添加 | 添加新角色或更新现有角色 |

## 🚀 快速命令

### Windows 用户（推荐）

```bash
# 初始化所有内置角色和默认角色
init-battle-characters.bat

# 添加单个角色
add-battle-character.bat yan_shuang_ying_boss.json

# 添加多个角色
add-battle-character.bat file1.json file2.json file3.json

# 强制更新角色
add-battle-character.bat character.json --force
```

### 使用 npm 命令

```bash
# 初始化所有角色
npm run init-battle-characters

# 添加角色
npm run add-character yan_shuang_ying_boss.json

# 添加多个角色
npm run add-character file1.json file2.json

# 强制更新
npm run add-character character.json -- --force
```

### 直接运行 Node.js

```bash
# 初始化
node src/scripts/initBattleCharacters.js

# 添加角色
node src/scripts/addBattleCharacter.js character.json

# 查看帮助
node src/scripts/addBattleCharacter.js --help
```

## 📖 详细文档

### 1. 初始化脚本 (initBattleCharacters.js)

**功能**:
- 批量导入所有内置角色
- 从项目根目录读取预定义的 JSON 文件
- 自动创建或更新角色数据

**使用场景**:
- ✅ 首次设置数据库
- ✅ 重置所有角色数据
- ✅ 部署到新环境

**执行**:
```bash
npm run init-battle-characters
```

**文档**: [BATTLE_CHARACTERS_GUIDE.md](./BATTLE_CHARACTERS_GUIDE.md)

### 2. 添加角色脚本 (addBattleCharacter.js)

**功能**:
- 添加单个或多个角色
- 验证 JSON 格式
- 自动提取标签
- 支持更新现有角色

**使用场景**:
- ✅ 添加新的自定义角色
- ✅ 更新已有角色数据
- ✅ 批量导入角色文件

**执行**:
```bash
npm run add-character <文件路径> [选项]
```

**文档**: [ADD_CHARACTER_GUIDE.md](./ADD_CHARACTER_GUIDE.md)

## 🎯 常见使用场景

### 场景1: 首次设置

```bash
# 1. 启动 MongoDB
net start MongoDB

# 2. 初始化内置角色
cd backend
npm run init-battle-characters
```

### 场景2: 添加新角色

```bash
# 1. 创建 JSON 文件（如 my_character.json）
# 2. 导入角色
npm run add-character my_character.json
```

### 场景3: 更新已有角色

```bash
# 1. 修改 JSON 文件
# 2. 强制更新
npm run add-character my_character.json -- --force
```

### 场景4: 批量导入角色

```bash
# 导入多个文件
npm run add-character char1.json char2.json char3.json
```

### 场景5: 导入带选项的角色

```bash
# 指定类型和难度
npm run add-character boss.json -- --type enemy --difficulty insane

# 添加标签
npm run add-character char.json -- --tags "冰系,Boss,精英"
```

## 📝 JSON 文件格式

### 最小示例

```json
{
  "id": "MyCharacter",
  "name": "我的角色",
  "desc": "角色描述",
  "moves": [
    {
      "id": "move_1",
      "name": "招式名称",
      "type": "攻击",
      "effect": "造成伤害",
      "restriction": "无限制"
    }
  ]
}
```

### 完整示例

```json
{
  "id": "IceQueen",
  "name": "冰霜女王",
  "desc": "强大的冰系魔法使用者，拥有冻结一切的力量。",
  "imageUrl": "./web-project/public/ice_queen.jpg",
  "personality": "冷酷、高傲、完美主义者",
  "magicStyle": "冰系魔法，范围控制与绝对零度",
  "moves": [
    {
      "id": "ice_storm",
      "name": "冰霜风暴",
      "type": "范围/控制",
      "effect": "召唤大范围冰暴，冻结区域内所有敌人",
      "restriction": "消耗大量魔力，需要蓄力"
    },
    {
      "id": "absolute_zero",
      "name": "绝对零度",
      "type": "终极/必杀",
      "effect": "释放绝对零度，冻结时间与空间",
      "restriction": "极大消耗，使用后虚弱"
    }
  ]
}
```

## 🔧 参数对照表

### addBattleCharacter.js 参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--type` | 角色类型 | `--type enemy` |
| `--difficulty` | 难度等级 | `--difficulty insane` |
| `--tags` | 标签列表 | `--tags "冰系,Boss"` |
| `--force` | 强制更新 | `--force` |
| `--inactive` | 设为未激活 | `--inactive` |
| `--help` | 显示帮助 | `--help` |

### 角色类型

- `enemy` - 敌方角色（默认）
- `player` - 玩家角色
- `neutral` - 中立角色

### 难度等级

- `easy` - 简单
- `normal` - 普通（默认）
- `hard` - 困难
- `insane` - 极难（Boss级）
- `meme` - 搞笑/恶搞

## 📊 数据库操作

### 查看所有角色

使用 MongoDB Compass:
1. 连接：`mongodb://localhost:27017`
2. 数据库：`novel_reading_db`
3. 集合：`battle_characters`

### 删除角色

```javascript
// 使用 MongoDB shell
use novel_reading_db
db.battle_characters.deleteOne({ characterId: "CharacterId" })
```

### 查询角色

```javascript
// 查询所有敌方角色
db.battle_characters.find({ characterType: "enemy" })

// 查询特定难度
db.battle_characters.find({ difficulty: "meme" })

// 查询包含特定标签
db.battle_characters.find({ tags: "神剧" })
```

## ⚠️ 注意事项

### 1. 前置要求
- ✅ MongoDB 服务必须运行
- ✅ Node.js 已安装
- ✅ 依赖已安装（`npm install`）

### 2. 数据安全
- 🔒 使用 `--force` 会覆盖现有数据
- 📦 建议先备份数据库
- 🔄 重要修改前先测试

### 3. ID 管理
- 🎯 角色 ID 必须唯一
- 📝 建议使用有意义的命名
- 🔤 使用 PascalCase 格式

## 🐛 故障排除

### MongoDB 未运行

```bash
# Windows
net start MongoDB

# 或打开 MongoDB Compass
```

### 文件路径错误

```bash
# 使用绝对路径
node src/scripts/addBattleCharacter.js D:\path\to\character.json

# 或确保在正确目录
cd D:\FateNovelProject\backend
npm run add-character ..\character.json
```

### JSON 格式错误

- 使用 JSON 验证工具检查
- 确保所有字符串用双引号
- 检查逗号和括号匹配

### 依赖缺失

```bash
cd backend
npm install
```

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [ADD_CHARACTER_GUIDE.md](./ADD_CHARACTER_GUIDE.md) | 添加角色详细指南 |
| [BATTLE_CHARACTERS_GUIDE.md](./BATTLE_CHARACTERS_GUIDE.md) | 角色数据库使用指南 |
| [BATTLE_SIMULATOR_MIGRATION_README.md](../BATTLE_SIMULATOR_MIGRATION_README.md) | 战斗系统总览 |
| [MongoDB快速启动指南.md](./MongoDB快速启动指南.md) | MongoDB 配置 |

## 💡 最佳实践

1. **文件组织**
   ```
   project/
   ├── characters/          # 角色JSON文件目录
   │   ├── enemies/
   │   ├── players/
   │   └── neutral/
   └── backend/
   ```

2. **命名规范**
   - 文件名：`character_name.json`
   - ID：`CharacterName` (PascalCase)
   - 招式ID：`move_name` (snake_case)

3. **版本控制**
   - 将角色 JSON 加入 Git
   - 使用有意义的 commit 信息
   - 重要修改前创建分支

4. **测试流程**
   ```bash
   # 1. 在测试环境导入
   npm run add-character test_character.json
   
   # 2. 验证数据
   # 使用 MongoDB Compass 查看
   
   # 3. 在游戏中测试
   # 访问战斗模拟器页面
   
   # 4. 确认无误后部署
   npm run add-character character.json -- --force
   ```

## 🎓 学习资源

### 示例文件

项目中包含的示例：
- `yan_shuang_ying_boss.json` - 搞笑Boss示例
- `yongzhe_ma.json` - 反英雄角色示例

### 模板

基础模板：
```json
{
  "id": "TemplateCharacter",
  "name": "模板角色",
  "desc": "这是一个角色模板",
  "personality": "性格描述",
  "magicStyle": "战斗风格",
  "moves": [
    {
      "id": "basic_attack",
      "name": "基础攻击",
      "type": "攻击",
      "effect": "造成物理伤害",
      "restriction": "无"
    }
  ]
}
```

## 🔄 更新日志

### v1.0.0 (2025-01-06)
- ✅ 初始版本
- ✅ 支持单个/批量导入
- ✅ 自动标签提取
- ✅ 数据验证
- ✅ 强制更新功能

---

**维护者**: FateNovelProject Team
**最后更新**: 2025-01-06





























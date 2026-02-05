# 添加战斗角色指南

## 📖 概述

本指南介绍如何使用 `addBattleCharacter.js` 脚本将自定义角色添加到战斗模拟器数据库中。

## 🚀 快速开始

### 方法1：使用批处理文件（Windows，推荐）

```bash
cd backend
add-battle-character.bat yan_shuang_ying_boss.json
```

### 方法2：使用 npm 命令

```bash
cd backend
npm run add-character yan_shuang_ying_boss.json
```

### 方法3：直接运行脚本

```bash
cd backend
node src/scripts/addBattleCharacter.js yan_shuang_ying_boss.json
```

## 📝 JSON 文件格式

### 必需字段

```json
{
  "id": "CharacterId",              // 唯一标识符（必需）
  "name": "角色名称",                // 角色显示名称（必需）
  "desc": "角色描述",                // 角色描述文本（必需）
  "moves": [                        // 招式列表（必需，至少1个）
    {
      "id": "move_id",              // 招式ID（必需）
      "name": "招式名称",            // 招式显示名称（必需）
      "type": "攻击/防御",           // 招式类型（必需）
      "effect": "招式效果描述",      // 效果说明（必需）
      "restriction": "使用限制"      // 使用条件/代价（必需）
    }
  ]
}
```

### 可选字段

```json
{
  "imageUrl": "./path/to/image.jpg",   // 角色图片URL
  "personality": "性格描述...",        // 性格/行为模式
  "magicStyle": "战斗风格..."         // 魔术体系/战斗风格
}
```

## 🎯 使用示例

### 示例1：导入单个角色

```bash
node src/scripts/addBattleCharacter.js yan_shuang_ying_boss.json
```

### 示例2：导入多个角色

```bash
node src/scripts/addBattleCharacter.js file1.json file2.json file3.json
```

### 示例3：指定角色类型

```bash
# 敌方角色（默认）
node src/scripts/addBattleCharacter.js character.json --type enemy

# 玩家角色
node src/scripts/addBattleCharacter.js character.json --type player

# 中立角色
node src/scripts/addBattleCharacter.js character.json --type neutral
```

### 示例4：指定难度等级

```bash
node src/scripts/addBattleCharacter.js character.json --difficulty insane
```

可用难度：
- `easy` - 简单
- `normal` - 普通
- `hard` - 困难
- `insane` - 极难（Boss级）
- `meme` - 搞笑/恶搞

### 示例5：添加标签

```bash
node src/scripts/addBattleCharacter.js character.json --tags "冰系,Boss,精英"
```

### 示例6：强制更新已存在的角色

```bash
node src/scripts/addBattleCharacter.js character.json --force
```

### 示例7：设置为未激活状态

```bash
node src/scripts/addBattleCharacter.js character.json --inactive
```

### 示例8：组合多个选项

```bash
node src/scripts/addBattleCharacter.js custom_boss.json \
  --type enemy \
  --difficulty insane \
  --tags "火系,Boss,终极" \
  --force
```

## 📋 完整参数说明

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--type` | `-t` | 角色类型（enemy/player/neutral） | `enemy` |
| `--difficulty` | `-d` | 难度等级（easy/normal/hard/insane/meme） | 自动判断 |
| `--tags` | - | 逗号分隔的标签列表 | 自动提取 |
| `--inactive` | - | 设置角色为未激活状态 | 激活 |
| `--force` | `-f` | 强制更新已存在的角色 | 不覆盖 |
| `--help` | `-h` | 显示帮助信息 | - |

## 🏷️ 自动标签提取

脚本会根据角色描述和魔术风格自动提取标签：

### 元素系标签
- 描述中包含"冰" → 添加"冰系"标签
- 描述中包含"火" → 添加"火系"标签
- 描述中包含"光" → 添加"光系"标签
- 描述中包含"暗" → 添加"暗系"标签
- 等等...

### 特殊标签
- 包含"恶搞"、"搞笑" → 添加"搞笑"标签
- 包含"因果" → 添加"因果系"标签
- 包含"精神" → 添加"精神系"标签
- 包含"物理" → 添加"物理系"标签
- 名称包含"燕双鹰" → 添加"神剧"标签

## 🎮 实际案例

### 案例1：燕双鹰Boss

**文件**: `yan_shuang_ying_boss.json`

```bash
node src/scripts/addBattleCharacter.js yan_shuang_ying_boss.json
```

**自动识别**:
- 难度：`meme`（因为描述包含"恶搞"）
- 标签：`["神剧", "因果系", "精神系"]`

### 案例2：勇者·马云飞

**文件**: `yongzhe_ma.json`

```bash
node src/scripts/addBattleCharacter.js yongzhe_ma.json --type enemy
```

**自动识别**:
- 难度：`meme`（因为描述包含"搞笑"）
- 标签：`["反英雄", "精神系"]`

### 案例3：自定义冰系Boss

**文件**: `ice_boss.json`

```json
{
  "id": "IceBossCustom",
  "name": "冰霜女王",
  "desc": "强大的冰系魔法使用者，拥有冻结一切的力量。",
  "personality": "冷酷、高傲、完美主义",
  "magicStyle": "冰系魔法，范围控制",
  "moves": [
    {
      "id": "ice_storm",
      "name": "冰霜风暴",
      "type": "范围/控制",
      "effect": "召唤大范围冰暴，冻结区域内所有敌人",
      "restriction": "消耗大量魔力，需要蓄力"
    }
  ]
}
```

```bash
node src/scripts/addBattleCharacter.js ice_boss.json \
  --type enemy \
  --difficulty hard \
  --tags "Boss,精英"
```

## ⚠️ 注意事项

### 1. ID 唯一性
- 每个角色的 `id` 必须唯一
- 如果导入相同 ID 的角色，默认会跳过
- 使用 `--force` 参数可以覆盖现有角色

### 2. 招式要求
- 至少需要 1 个招式
- 建议 5-8 个招式以保证战斗丰富性
- 每个招式必须包含所有必需字段

### 3. 文件路径
- 支持相对路径（从项目根目录开始）
- 支持绝对路径
- 路径中有空格请使用引号

### 4. MongoDB 要求
- 导入前确保 MongoDB 服务已启动
- 检查方法：`sc query MongoDB`（Windows）
- 启动方法：`net start MongoDB` 或打开 MongoDB Compass

## 🔍 验证与调试

### 数据验证

脚本会自动验证以下内容：

1. **必需字段检查**
   - `id`, `name`, `desc`, `moves` 必须存在
   - `moves` 必须是非空数组

2. **招式格式检查**
   - 每个招式必须包含 `id`, `name`, `type`, `effect`, `restriction`

3. **JSON 格式检查**
   - 文件必须是有效的 JSON 格式
   - 语法错误会被明确指出

### 查看导入结果

导入成功后，脚本会显示：

```
📋 角色信息
================================================================================
ID:           YanShuangYingEagle
名称:         燕双鹰eagle·栩 (剧本版)
类型:         enemy
难度:         meme
标签:         神剧, 因果系, 精神系
招式数量:     8
状态:         ✅ 激活
描述:         传说中的因果律恶搞Boss...

招式列表:
  1. [精神/Debuff] 致命错误・嘲讽
  2. [被动/反击] 枪口PTSD・瞬移
  ...
```

### 使用 MongoDB Compass 验证

1. 打开 MongoDB Compass
2. 连接到 `mongodb://localhost:27017`
3. 选择数据库 `novel_reading_db`
4. 选择集合 `battle_characters`
5. 查看新添加的角色

## 🐛 常见问题

### 问题1：文件不存在

```
❌ 文件不存在: character.json
```

**解决方案**:
- 检查文件路径是否正确
- 使用绝对路径或确保在正确的目录下运行
- 检查文件名拼写

### 问题2：JSON 格式错误

```
❌ JSON 格式错误: Unexpected token } in JSON at position 123
```

**解决方案**:
- 使用 JSON 验证工具检查文件
- 确保所有字符串使用双引号
- 检查是否有多余的逗号
- 验证括号匹配

### 问题3：数据验证失败

```
❌ 数据验证失败:
   - 缺少字段: id
   - 招式 1: 缺少 effect
```

**解决方案**:
- 按照错误提示补充缺失的字段
- 确保所有必需字段都存在

### 问题4：角色已存在

```
⚠️  角色已存在: 燕双鹰eagle·栩 (YanShuangYingEagle)
   使用 --force 参数强制更新
```

**解决方案**:
- 如果要更新，添加 `--force` 参数
- 如果是新角色，修改 `id` 字段

### 问题5：MongoDB 连接失败

```
❌ MongoDB 连接失败: connect ECONNREFUSED 127.0.0.1:27017
```

**解决方案**:
- 启动 MongoDB 服务：`net start MongoDB`
- 或打开 MongoDB Compass
- 检查 MongoDB 是否安装

## 📊 批量导入

### 导入多个文件

```bash
# 使用通配符（需要 bash）
node src/scripts/addBattleCharacter.js characters/*.json

# 逐个指定
node src/scripts/addBattleCharacter.js \
  char1.json \
  char2.json \
  char3.json
```

### 批量更新

```bash
# 强制更新所有文件
node src/scripts/addBattleCharacter.js *.json --force
```

## 🔄 更新现有角色

如果需要修改已导入的角色：

1. 修改对应的 JSON 文件
2. 使用 `--force` 参数重新导入

```bash
node src/scripts/addBattleCharacter.js character.json --force
```

## 📚 相关文档

- [角色数据库使用指南](./BATTLE_CHARACTERS_GUIDE.md)
- [战斗模拟器迁移说明](../BATTLE_SIMULATOR_MIGRATION_README.md)
- [MongoDB 快速启动指南](./MongoDB快速启动指南.md)

## 💡 最佳实践

1. **命名规范**
   - ID 使用 PascalCase（如：`IceQueen`）
   - 招式 ID 使用 snake_case（如：`ice_storm`）

2. **描述文本**
   - 描述应该简洁明了
   - 包含关键特征词（用于自动标签提取）

3. **招式设计**
   - 提供多样化的招式类型
   - 明确说明效果和限制
   - 平衡威力与代价

4. **文件管理**
   - 为每个角色创建单独的 JSON 文件
   - 使用有意义的文件名
   - 保持 JSON 格式整洁

5. **版本控制**
   - 将 JSON 文件加入 Git
   - 记录重要的修改说明

---

**最后更新**: 2025-01-06
**版本**: 1.0.0





























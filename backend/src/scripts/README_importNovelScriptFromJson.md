# Novel Script JSON 导入工具

这个脚本可以从JSON文件读取数据并填充到 `novel_scripts` 数据库集合中。

## 功能特性

- ✅ 从JSON文件导入novel_script数据
- ✅ 自动验证JSON格式和必需字段
- ✅ 支持创建新剧本或更新已存在的剧本
- ✅ 支持批量导入多个JSON文件
- ✅ 支持导入目录中的所有JSON文件
- ✅ 详细的导入日志和统计信息

## 使用方法

### 基本用法

```bash
# 导入单个JSON文件
node backend/src/scripts/importNovelScriptFromJson.js script.json

# 导入单个JSON文件（如果已存在则不更新）
node backend/src/scripts/importNovelScriptFromJson.js script.json --no-update

# 批量导入多个JSON文件
node backend/src/scripts/importNovelScriptFromJson.js script1.json script2.json script3.json --batch

# 批量导入目录中的所有JSON文件
node backend/src/scripts/importNovelScriptFromJson.js ./scripts/*.json --batch
```

### 选项说明

- `--no-update`: 如果剧本已存在，不更新（默认会更新已存在的剧本）
- `--batch`: 批量导入模式，可以指定多个文件或目录

## JSON文件格式

JSON文件必须符合以下格式：

### 必需字段

- `scriptId` (string): 剧本ID，用于唯一标识剧本
- `scriptName` (string): 剧本名称
- `scenes` (array): 场景数组，每个场景必须包含：
  - `index` (number): 场景索引
  - `type` (string): 场景类型，必须是 `'title'`, `'text'`, 或 `'choice'`

### 可选字段

- `description` (string): 剧本描述
- `summary` (string): 剧本简介，用于章节选择页面显示
- `thumbnailImage` (string): 剧本缩略图地址
- `unlockConditions` (array): 解锁条件，需要完成的剧本ID列表
- `visibility` (string): 可见性，`'all'` | `'day'` | `'night'`，默认为 `'all'`
- `connectNode` (array): 连接的节点ID列表
- `position` (object): 世界坐标位置，`{ x: number, y: number }`
- `isActive` (boolean): 剧本激活状态，默认为 `true`
- `displayOrder` (number): 显示顺序，默认为 `0`
- `metadata` (object): 元数据
  - `author` (string): 作者
  - `version` (string): 版本号
  - `language` (string): 语言
  - `totalScenes` (number): 场景总数（自动计算）
  - `estimatedPlayTime` (number): 预计游玩时长（分钟）

### 场景类型说明

#### 1. 标题场景 (type: 'title')

```json
{
  "index": 0,
  "type": "title",
  "title": "第一章",
  "subtitle": "故事的开始",
  "bgImage": "/storyImage/StoryBG/storyBG1.png",
  "theme": "dark"
}
```

#### 2. 对话场景 (type: 'text')

```json
{
  "index": 1,
  "type": "text",
  "speaker": "秋山痕",
  "text": "这是对话内容。",
  "bgImage": "/storyImage/StoryBG/storyBG2.png",
  "theme": "dark",
  "characterImageLeft": "/storyImage/Seraphina.png",
  "characterImageRight": "",
  "bgMusic": "/music/bgm1.mp3",
  "soundEffect": "/sound/click.mp3"
}
```

#### 3. 选择分支场景 (type: 'choice')

```json
{
  "index": 3,
  "type": "choice",
  "text": "请做出你的选择：",
  "bgImage": "/storyImage/StoryBG/storyBG2.png",
  "theme": "dark",
  "choices": [
    {
      "text": "选择选项1",
      "jumpTo": 4,
      "condition": ""
    },
    {
      "text": "选择选项2",
      "jumpTo": 5,
      "condition": ""
    }
  ]
}
```

## 完整示例

参考 `novel_script_example.json` 文件查看完整的JSON格式示例。

## 注意事项

1. **scriptId唯一性**: 每个剧本的 `scriptId` 必须是唯一的。如果导入时发现已存在相同 `scriptId` 的剧本，默认会更新现有剧本（除非使用 `--no-update` 选项）。

2. **场景索引**: 场景的 `index` 字段必须是数字，建议从0开始连续递增。

3. **场景类型验证**: 场景的 `type` 字段必须是 `'title'`, `'text'`, 或 `'choice'` 之一。

4. **数据验证**: 脚本会自动验证JSON格式和必需字段，如果验证失败会显示详细的错误信息。

5. **数据库连接**: 确保MongoDB服务正在运行，并且配置文件中的连接信息正确。

## 错误处理

如果导入过程中出现错误，脚本会：

1. 显示详细的错误信息
2. 在批量导入模式下，继续处理其他文件
3. 在最后显示成功和失败的统计信息

## 示例输出

```
🔧 开始从JSON文件导入novel_script数据...

📖 读取JSON文件: script.json
✅ JSON文件解析成功
   - 剧本ID: example-script-1
   - 剧本名称: 示例剧本
   - 场景数量: 6

📝 创建新剧本: example-script-1...
✅ 剧本创建成功: example-script-1
   MongoDB ID: 65a1b2c3d4e5f6g7h8i9j0k1
   - 场景总数: 6
   - 显示顺序: 1
   - 激活状态: 是

🔍 验证数据保存...
✅ 验证成功: 剧本已存在于数据库中
   - 剧本ID: example-script-1
   - 剧本名称: 示例剧本
   - 场景数量: 6
   - 创建时间: 2025-01-15T10:30:00.000Z
   - 更新时间: 2025-01-15T10:30:00.000Z

📊 数据库中共有 5 个剧本

📊 统计信息:
   - 剧本ID: example-script-1
   - 剧本名称: 示例剧本
   - 场景总数: 6
   - 标题场景: 1
   - 对话场景: 4
   - 选择场景: 1
   - 有对话者的场景: 4
   - 有背景图片的场景: 6
   - 有选择分支的场景: 1

✅ 数据库连接已关闭
```

## 相关文件

- 脚本文件: `backend/src/scripts/importNovelScriptFromJson.js`
- 示例文件: `backend/src/scripts/novel_script_example.json`
- Schema定义: `backend/src/schemas/novelScriptSchema.js`
- Controller: `backend/src/controllers/mongo/novelScriptController.js`

































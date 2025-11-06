# Story章节表（story_sections）使用说明

## 表结构

`story_sections` 表用于存储SowakaPage中"そわかの物語"部分的UI内容。

### 字段说明

| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `id` | INT | 主键，自动递增 | - |
| `header_title` | VARCHAR(255) | 故事标题（如：そわかの物語） | 必填 |
| `subtitle` | VARCHAR(255) | 副标题（如：STORY OF SOWAKA） | 必填 |
| `story_text` | TEXT | 故事正文内容（支持多段落，段落间用`\|\|`分隔） | 必填 |
| `author_signature` | VARCHAR(255) | 作者签名 | — SOWAKA KYOTO |
| `image_url` | VARCHAR(500) | 左侧图片URL或路径 | NULL |
| `is_active` | TINYINT(1) | 是否激活显示（1=是，0=否） | 1 |
| `display_order` | INT | 显示顺序 | 0 |
| `created_at` | TIMESTAMP | 创建时间 | 自动生成 |
| `updated_at` | TIMESTAMP | 更新时间 | 自动更新 |

### 索引

- `idx_is_active`: 对 `is_active` 字段建立索引
- `idx_display_order`: 对 `display_order` 字段建立索引

## API接口

### 1. 获取所有故事章节
```http
GET /api/story-sections
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "header_title": "そわかの物語",
      "subtitle": "STORY OF SOWAKA",
      "story_text": "京都の静かな朝...",
      "paragraphs": ["京都の静かな朝...", "「そわか」は..."],
      "author_signature": "— SOWAKA KYOTO",
      "image_url": "/images/sowaka-story.jpg",
      "is_active": 1,
      "display_order": 1
    }
  ]
}
```

### 2. 获取激活的故事章节
```http
GET /api/story-sections/active
```

只返回 `is_active = 1` 的章节。

### 3. 根据ID获取故事章节
```http
GET /api/story-sections/:id
```

### 4. 创建新故事章节
```http
POST /api/story-sections
Content-Type: application/json

{
  "header_title": "新的物語",
  "subtitle": "NEW STORY",
  "story_text": "第一段||第二段||第三段",
  "author_signature": "— SOWAKA KYOTO",
  "image_url": "/images/new-story.jpg",
  "is_active": 1,
  "display_order": 2
}
```

### 5. 更新故事章节
```http
PUT /api/story-sections/:id
Content-Type: application/json

{
  "header_title": "更新的标题",
  "subtitle": "UPDATED SUBTITLE",
  "story_text": "更新的内容..."
}
```

### 6. 删除故事章节
```http
DELETE /api/story-sections/:id
```

## 数据格式说明

### story_text 字段

`story_text` 字段使用 `||` 作为段落分隔符。

**示例：**
```
段落一的内容||段落二的内容||段落三的内容
```

API会自动将其转换为 `paragraphs` 数组：
```json
{
  "paragraphs": [
    "段落一的内容",
    "段落二的内容",
    "段落三的内容"
  ]
}
```

### image_url 字段

支持以下格式：
- 相对路径：`/images/sowaka-story.jpg`
- 绝对路径：`https://example.com/images/story.jpg`
- 公共目录路径：图片应放置在 `web-project/public/images/` 目录下

## 前端使用示例

在 `SowakaPage.vue` 中，故事章节数据会自动从API加载：

```javascript
// 加载故事章节数据
const storySectionResponse = await axios.get(`${API_BASE_URL}/story-sections/active`)
if (storySectionResponse.data.success && storySectionResponse.data.data.length > 0) {
  const section = storySectionResponse.data.data[0]
  storySection.value = {
    header_title: section.header_title,
    subtitle: section.subtitle,
    paragraphs: section.paragraphs || [],
    author_signature: section.author_signature,
    image_url: section.image_url
  }
}
```

模板中使用：
```vue
<div class="story-header-large">
  <h2>{{ storySection.header_title }}</h2>
  <p class="subtitle">{{ storySection.subtitle }}</p>
</div>

<div class="story-text-right">
  <p v-for="(paragraph, index) in storySection.paragraphs" :key="index">
    {{ paragraph }}
  </p>
  <p class="author-signature">{{ storySection.author_signature }}</p>
</div>
```

## 初始化数据库

运行以下命令来初始化数据库和创建表：

```bash
cd backend
node src/scripts/initDatabase.js
```

这将创建 `story_sections` 表并插入示例数据。

## 示例数据

初始化脚本会插入以下示例数据：

```javascript
{
  header_title: 'そわかの物語',
  subtitle: 'STORY OF SOWAKA',
  story_text: '京都の静かな朝、打ち水のされた石畳を歩くと、そこには時を超えた美しさが息づいています。||「そわか」は、古き良き日本の伝統と現代の洗練が調和した、特別な空間です。歴史的な建築を大切に保存しながら、現代の快適さを融合させました。||四季折々の京都の風景を感じながら、心安らぐひとときをお過ごしいただけます。坪庭の緑、石畳の音、風の香り。五感すべてで感じる日本の美がここにあります。||私たちは、訪れるすべての方に「幸あれ」という祝福の心を込めて、最高のおもてなしを提供いたします。',
  author_signature: '— SOWAKA KYOTO',
  image_url: '/images/sowaka-story.jpg',
  is_active: 1,
  display_order: 1
}
```

## 注意事项

1. **段落分隔符**：在数据库中存储时，必须使用 `||` 作为段落分隔符
2. **图片路径**：确保图片文件存在于正确的位置
3. **激活状态**：只有 `is_active = 1` 的章节会在前端显示
4. **显示顺序**：可以通过 `display_order` 字段控制多个章节的显示顺序
5. **必填字段**：`header_title`、`subtitle` 和 `story_text` 为必填字段

## 相关文件

- 数据库初始化脚本：`backend/src/scripts/initDatabase.js`
- 模型文件：`backend/src/models/storySectionModel.js`
- 控制器文件：`backend/src/controllers/storySectionController.js`
- 路由文件：`backend/src/routes/storySectionRoutes.js`
- 前端页面：`web-project/src/views/SowakaPage.vue`


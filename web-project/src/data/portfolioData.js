export const portfolioProjects = [
  {
    id: 'unity-urp-shadow',
    number: '01',
    typeClass: 'card-type-1',
    title: 'Unity URP 定制阴影管线',
    description:
      '深入研究并复现了《原神》级别的卡通渲染阴影技术。通过编写自定义的 ShadowMap Render Feature，接管了 URP 的默认阴影绘制流程，实现了更高精度的阴影投射与平滑过渡效果，优化了移动端的渲染性能。',
    tags: 'GRAPHICS / SHADER / UNITY',
    image: '',
    detail: {
      date: '2026.02.12',
      author: 'SYSTEM',
      coverImage:
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
      galleryImages: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1483058712412-4245e9b90334?q=80&w=1200&auto=format&fit=crop',
      ],
      markdown: `在现代游戏渲染架构中，阴影不仅仅是遮挡关系的物理体现，更是奠定视觉基调的重要手段。本项目旨在复现类似于《原神》的高质量卡通渲染（Toon Shading）阴影技术。

## 1. 核心架构设计
通过编写自定义的 \`ShadowMap Render Feature\`，我们成功接管了 URP 的默认阴影绘制流程。这意味着我们可以在投射阶段（Cast）和接收阶段（Receive）注入自定义的逻辑。

> "渲染管线的重构，本质上是对每一像素命运的重新裁决。" —— Developer Log

## 2. 代码实现细节
为了平滑阴影边缘，我们引入了基于 PCF（Percentage-Closer Filtering）的自定义滤波算法。以下是核心的 Shader 采样片段：

\`\`\`c
// 自定义阴影采样函数
half CustomShadowAttenuation(float3 worldPos) {
    float4 shadowCoord = TransformWorldToShadowCoord(worldPos);

    // 使用非线性采样偏移实现卡通硬阴影与软边缘的过渡
    half attenuation = MainLightRealtimeShadow(shadowCoord);
    return step(0.5, attenuation);
}
\`\`\`

### 性能优化
- 将深度图分辨率动态适配屏幕视口（Viewport）。
- 利用 **Compute Shader** 预计算静态物体的阴影遮蔽信息。
- 剔除不必要的 Cascade Shadow Map 层级，大幅降低 Draw Call。

下一步的计划是将这一套阴影系统与我们正在开发的 \`Capsule AO\` 结合，实现完整的角色光照环境。`,
    },
  },
  {
    id: 'graphrag-multi-agent',
    number: '02',
    typeClass: 'card-type-2',
    title: '知识图谱与多智能体系统',
    description:
      '基于 Neo4j 构建底层的图数据库（GraphRAG），并结合 Leiden 社区发现算法处理海量文档。上层设计了多智能体（Multi-Agent）协作架构，使 LLM 能够精准检索并推理复杂的实体关联网络。',
    tags: 'LLM / KNOWLEDGE GRAPH / NEO4J',
    image: '',
  },
  {
    id: 'capsule-ao-plugin',
    number: '03',
    typeClass: 'card-type-3',
    title: 'Capsule AO 渲染特性开发',
    description:
      '为 Unity URP 开发的胶囊体环境光遮蔽（Capsule Ambient Occlusion）插件。通过 C# 脚本与计算着色器（Compute Shader）的结合，为角色模型提供了极低开销且物理准确的软阴影遮蔽效果。',
    tags: 'C# / RENDER PIPELINE / AO',
    image: '',
  },
  {
    id: 'wasteland-text-engine',
    number: '04',
    typeClass: 'card-type-1',
    title: '废土学院：文字交互引擎',
    description:
      '一个以末日废土学校为背景的文字冒险游戏框架。底层包含了一套严密的内存管理系统与状态机，支持复杂的故事分支解析与动态文本生成，探索叙事与代码逻辑的结合。',
    tags: 'GAME DESIGN / TEXT ADVENTURE',
    image: '',
  },
]

export function getPortfolioProjectById(id) {
  return portfolioProjects.find((item) => item.id === id)
}

export const defaultWorkspaceDraft = {
  title: 'GraphRAG 与多智能体架构探索',
  tags: 'LLM / NEO4J / AGENTS',
  coverImage:
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
  galleryImages: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1200&auto=format&fit=crop',
  ],
  showInGallery: true,
  showInCatalog: true,
  markdown: `在处理复杂知识网络的检索与推理时，传统的向量检索往往会丢失实体间的拓扑关系。

## 引入图数据库
我们利用 **Neo4j** 构建底层结构，并通过 \`Leiden\` 算法进行社区发现（Community Detection），这使得智能体能够以宏观视角理解文档集群。

> "数据是散落的星辰，而图谱是连接它们的星座。"

### 核心查询逻辑
以下是我们的多智能体系统中，用于查询节点关联的核心代码片段：

\`\`\`cypher
// Cypher 语句示例：查找核心实体间的关联路径
MATCH (source:Entity {name: 'LLM'})-[r:RELATES_TO*1..3]-(target:Entity)
RETURN source, r, target
LIMIT 50;
\`\`\`

下一步，我们将优化智能体在图节点间的游走（Random Walk）策略。`,
}

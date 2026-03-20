<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'

const router = useRouter()
const namesText = ref('')
const loading = ref(false)
const errorMessage = ref('')
const generatedHashes = ref([])
const generatedEnvLine = ref('')
const generatedNames = ref([])

const isDevMode = computed(() => {
  const hasDebugParam = new URLSearchParams(window.location.search).has('debug')
  return import.meta.env.DEV || hasDebugParam
})

const parsedNames = computed(() =>
  namesText.value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
)

function goBack() {
  router.push('/portfolio-novel-select')
}

async function generateHashes() {
  if (!isDevMode.value) {
    errorMessage.value = '仅开发模式允许使用该工具页'
    return
  }

  if (parsedNames.value.length === 0) {
    errorMessage.value = '请先输入至少一个姓名'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''
    const response = await portfolioArticleApi.generateNovelAccessNameHashes(parsedNames.value)
    generatedHashes.value = Array.isArray(response?.data?.hashes) ? response.data.hashes : []
    generatedEnvLine.value = String(response?.data?.envLine || '')
    generatedNames.value = Array.isArray(response?.data?.names) ? response.data.names : []
  } catch (error) {
    generatedHashes.value = []
    generatedEnvLine.value = ''
    generatedNames.value = []
    errorMessage.value = error?.response?.data?.message || '生成失败，请检查后端服务是否正常'
  } finally {
    loading.value = false
  }
}

async function copyEnvLine() {
  if (!generatedEnvLine.value) {
    return
  }
  await navigator.clipboard.writeText(generatedEnvLine.value)
}
</script>

<template>
  <div class="access-config-page">
    <header class="page-header">
      <h1>小说访问姓名哈希工具</h1>
      <button type="button" @click="goBack">返回目录页</button>
    </header>

    <p class="tip">
      该页面仅开发模式可用。输入姓名后将由后端按当前盐值生成哈希，可直接复制到 `.env`。
    </p>

    <p v-if="!isDevMode" class="error-tip">当前不是开发模式，工具页已禁用。</p>

    <section class="panel">
      <label for="name-input">姓名列表（换行或逗号分隔）</label>
      <textarea
        id="name-input"
        v-model="namesText"
        :disabled="!isDevMode || loading"
        placeholder="示例：&#10;张三&#10;李四&#10;川辺"
      ></textarea>
      <div class="actions">
        <button type="button" :disabled="!isDevMode || loading" @click="generateHashes">
          {{ loading ? '生成中...' : '生成哈希' }}
        </button>
      </div>
      <p v-if="errorMessage" class="error-tip">{{ errorMessage }}</p>
    </section>

    <section v-if="generatedHashes.length" class="panel">
      <h2>生成结果</h2>
      <p class="mini-tip">姓名：{{ generatedNames.join('，') }}</p>
      <div class="hash-list">
        <code v-for="(hash, index) in generatedHashes" :key="`${hash}-${index}`">{{ hash }}</code>
      </div>

      <label for="env-output">可直接写入 .env</label>
      <textarea id="env-output" :value="generatedEnvLine" readonly></textarea>
      <div class="actions">
        <button type="button" @click="copyEnvLine">复制配置行</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.access-config-page {
  min-height: 100vh;
  padding: 28px;
  background: #f7f8fb;
  color: #1f2937;
  font-family: 'Noto Serif SC', serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.tip {
  margin: 12px 0 20px;
  color: #4b5563;
}

.panel {
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 16px;
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

textarea {
  width: 100%;
  min-height: 120px;
  border: 1px solid #d1d5db;
  padding: 10px;
  font-size: 0.9rem;
  font-family: Consolas, monospace;
  resize: vertical;
}

.actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

button {
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
  padding: 8px 12px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-tip {
  margin-top: 10px;
  color: #b91c1c;
}

.mini-tip {
  color: #4b5563;
  font-size: 0.9rem;
}

.hash-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 10px 0 12px;
}

.hash-list code {
  border: 1px solid #e5e7eb;
  padding: 8px;
  background: #f9fafb;
  word-break: break-all;
}
</style>

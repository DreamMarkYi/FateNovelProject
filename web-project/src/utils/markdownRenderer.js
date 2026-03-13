import { marked } from 'marked'
import markedKatex from 'marked-katex-extension'

marked.setOptions({
  gfm: true,
  breaks: true,
})

marked.use(
  markedKatex({
    throwOnError: false,
    nonStandard: true,
  }),
)

export function renderMarkdown(markdown = '') {
  return marked.parse(String(markdown || ''))
}

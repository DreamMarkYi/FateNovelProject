/**
 * 便签正文展示：仅解析 **加粗** 与换行，其余按纯文本转义，避免 XSS。
 */
export function renderMemoRichText(raw = '') {
  const text = String(raw ?? '')
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  const withBold = escaped.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
  return withBold.replace(/\n/g, '<br />')
}

export const DEFAULT_PORTFOLIO_ORDER_CONFIG = {
  homeRecentOrder: [],
  catalogOrder: [],
  wallOrder: [],
}

function normalizeOrderConfig(rawConfig) {
  const config = rawConfig && typeof rawConfig === 'object' ? rawConfig : {}

  const normalizeIdArray = (value) =>
    (Array.isArray(value) ? value : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)

  return {
    homeRecentOrder: normalizeIdArray(config.homeRecentOrder),
    catalogOrder: normalizeIdArray(config.catalogOrder),
    wallOrder: normalizeIdArray(config.wallOrder),
  }
}

export async function loadPortfolioOrderConfig() {
  try {
    const response = await fetch('/portfolio-order.json', { cache: 'no-store' })
    if (!response.ok) {
      return { ...DEFAULT_PORTFOLIO_ORDER_CONFIG }
    }

    const raw = await response.json()
    return normalizeOrderConfig(raw)
  } catch (error) {
    return { ...DEFAULT_PORTFOLIO_ORDER_CONFIG }
  }
}

export function applyOrderByIds(items, orderIds) {
  const list = Array.isArray(items) ? items : []
  const order = Array.isArray(orderIds) ? orderIds : []
  if (list.length === 0 || order.length === 0) {
    return list.slice()
  }

  const map = new Map(list.map((item) => [String(item.id || ''), item]))
  const picked = []
  const used = new Set()

  for (const rawId of order) {
    const id = String(rawId || '')
    if (!id || used.has(id) || !map.has(id)) {
      continue
    }
    picked.push(map.get(id))
    used.add(id)
  }

  for (const item of list) {
    const id = String(item?.id || '')
    if (!id || used.has(id)) {
      continue
    }
    picked.push(item)
  }

  return picked
}

export function reindexPortfolioCards(items) {
  const list = Array.isArray(items) ? items : []
  return list.map((item, index) => ({
    ...item,
    number: String(index + 1).padStart(2, '0'),
    typeClass: `card-type-${(index % 3) + 1}`,
  }))
}

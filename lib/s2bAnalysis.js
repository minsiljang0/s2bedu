import { getSupabaseAdmin } from './supabaseAdmin'

export const MONTH_LABEL = {
  '01': '1월', '02': '2월', '03': '3월', '04': '4월', '05': '5월', '06': '6월',
  '07': '7월', '08': '8월', '09': '9월', '10': '10월', '11': '11월', '12': '12월',
}

// 150개월 x 100행 규모라 Supabase 기본 1000행 제한에 걸리므로 페이지네이션 필요.
// 관리자가 엑셀을 등록/삭제할 때만(=데이터가 실제로 바뀔 때만) 호출되고,
// 평소 페이지 조회는 s2b_analysis_cache에 미리 계산해둔 값을 읽기만 한다.
async function fetchAllRows() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const rows = []
  const PAGE = 1000
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from('s2b_top100_rows')
      .select('month,name,cat1,contracts,qty')
      .range(offset, offset + PAGE - 1)
    if (error || !data) break
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

function computeAnalysis(rows) {
  const totalMonths = new Set(rows.map((r) => r.month)).size

  const byProduct = new Map()
  const calendarTotals = {}
  for (const key of Object.keys(MONTH_LABEL)) calendarTotals[key] = 0

  for (const r of rows) {
    const calMonth = r.month.slice(5, 7)
    calendarTotals[calMonth] = (calendarTotals[calMonth] || 0) + r.contracts

    if (!byProduct.has(r.name)) {
      byProduct.set(r.name, { name: r.name, cat1: r.cat1, months: new Set(), totalContracts: 0, byCalMonth: {} })
    }
    const p = byProduct.get(r.name)
    p.months.add(r.month)
    p.totalContracts += r.contracts
    p.byCalMonth[calMonth] = (p.byCalMonth[calMonth] || 0) + r.contracts
  }

  const products = [...byProduct.values()]

  const steady = products
    .filter((p) => p.months.size >= 5)
    .map((p) => ({
      name: p.name,
      cat1: p.cat1,
      monthCount: p.months.size,
      coverage: Math.round((p.months.size / totalMonths) * 100),
      avgContracts: Math.round(p.totalContracts / p.months.size),
    }))
    .sort((a, b) => b.monthCount - a.monthCount || b.avgContracts - a.avgContracts)
    .slice(0, 30)

  const seasonalCandidates = products
    .filter((p) => p.months.size >= 2)
    .map((p) => {
      const entries = Object.entries(p.byCalMonth)
      const [topMonth, topVal] = entries.sort((a, b) => b[1] - a[1])[0]
      return { name: p.name, cat1: p.cat1, topMonth, topShare: topVal / p.totalContracts, totalContracts: p.totalContracts, monthCount: p.months.size }
    })
    .filter((p) => p.topShare >= 0.6)

  const byCalendarMonth = {}
  for (const key of Object.keys(MONTH_LABEL)) {
    byCalendarMonth[key] = seasonalCandidates
      .filter((p) => p.topMonth === key)
      .sort((a, b) => b.totalContracts - a.totalContracts)
      .slice(0, 6)
  }

  const maxCalendarTotal = Math.max(...Object.values(calendarTotals))
  const calendarBars = Object.keys(MONTH_LABEL).map((key) => ({
    key,
    label: MONTH_LABEL[key],
    total: calendarTotals[key],
    pct: maxCalendarTotal ? Math.round((calendarTotals[key] / maxCalendarTotal) * 100) : 0,
  }))

  return { totalMonths, totalRows: rows.length, steady, byCalendarMonth, calendarBars }
}

// 관리자가 엑셀 등록/삭제할 때만 호출 — 'all'(전체 기간)과 데이터가 있는 연도마다 하나씩 미리 계산해서 저장.
export async function refreshAnalysisCache() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return
  const rows = await fetchAllRows()
  const years = [...new Set(rows.map((r) => r.month.slice(0, 4)))].sort()
  const scopes = ['all', ...years]

  const upserts = scopes.map((scope) => ({
    scope,
    data: computeAnalysis(scope === 'all' ? rows : rows.filter((r) => r.month.slice(0, 4) === scope)),
    updated_at: new Date().toISOString(),
  }))

  await supabase.from('s2b_analysis_cache').upsert(upserts, { onConflict: 'scope' })
  // 삭제된 연도의 캐시가 남아있지 않도록 정리
  await supabase.from('s2b_analysis_cache').delete().not('scope', 'in', `(${scopes.map((s) => `"${s}"`).join(',')})`)
}

export async function getCachedAnalysis(scope = 'all') {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase.from('s2b_analysis_cache').select('data,updated_at').eq('scope', scope).maybeSingle()
  if (error || !data) return null
  return { ...data.data, updatedAt: data.updated_at }
}

export async function listAnalysisYears() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const { data, error } = await supabase.from('s2b_analysis_cache').select('scope').neq('scope', 'all').order('scope', { ascending: false })
  if (error || !data) return []
  return data.map((r) => r.scope)
}

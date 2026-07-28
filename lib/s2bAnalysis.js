import { getSupabaseAdmin } from './supabaseAdmin'

// 객체 키로 '01'~'12'를 쓰면 '10'~'12'처럼 숫자로 보이는 키가 JS 엔진에 의해
// 자동으로 맨 앞에 오름차순 정렬돼버린다(Object.keys 순서 보장 안 됨). 그래서 순서가
// 필요한 모든 곳(캘린더 차트, 월별 카드)은 이 배열을 기준으로 순회해야 한다.
export const MONTH_KEYS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

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
  const calendarContracts = {}
  const calendarQty = {}
  const monthCounts = {}
  for (const key of MONTH_KEYS) { calendarContracts[key] = 0; calendarQty[key] = 0 }

  for (const r of rows) {
    const calMonth = r.month.slice(5, 7)
    calendarContracts[calMonth] = (calendarContracts[calMonth] || 0) + r.contracts
    calendarQty[calMonth] = (calendarQty[calMonth] || 0) + r.qty
    monthCounts[r.month] = (monthCounts[r.month] || 0) + 1

    if (!byProduct.has(r.name)) {
      byProduct.set(r.name, { name: r.name, cat1: r.cat1, months: new Set(), totalContracts: 0, totalQty: 0, byCalMonth: {} })
    }
    const p = byProduct.get(r.name)
    p.months.add(r.month)
    p.totalContracts += r.contracts
    p.totalQty += r.qty
    if (!p.byCalMonth[calMonth]) p.byCalMonth[calMonth] = { contracts: 0, qty: 0 }
    p.byCalMonth[calMonth].contracts += r.contracts
    p.byCalMonth[calMonth].qty += r.qty
  }

  const products = [...byProduct.values()]

  // 계약건수 = 서로 다른 학교가 각자 계약한 횟수(반복수요 지표), 판매수량 = 전체 판매된 수량(계약 1건이 대량구매면 왜곡될 수 있음).
  // 둘 다 나란히 보여주고 정렬 기준은 계약건수를 우선으로 하되, 판매수량도 항상 같이 노출한다.
  const steady = products
    .filter((p) => p.months.size >= 5)
    .map((p) => ({
      name: p.name,
      cat1: p.cat1,
      monthCount: p.months.size,
      coverage: Math.round((p.months.size / totalMonths) * 100),
      avgContracts: Math.round(p.totalContracts / p.months.size),
      avgQty: Math.round(p.totalQty / p.months.size),
    }))
    .sort((a, b) => b.monthCount - a.monthCount || b.avgContracts - a.avgContracts)

  const seasonalCandidates = products
    .filter((p) => p.months.size >= 2)
    .map((p) => {
      const entries = Object.entries(p.byCalMonth)
      const [topMonth, topStat] = entries.sort((a, b) => b[1].contracts - a[1].contracts)[0]
      return {
        name: p.name, cat1: p.cat1, topMonth,
        topShare: topStat.contracts / p.totalContracts,
        totalContracts: p.totalContracts, totalQty: p.totalQty, monthCount: p.months.size,
      }
    })
    .filter((p) => p.topShare >= 0.6)

  const byCalendarMonth = {}
  for (const key of MONTH_KEYS) {
    byCalendarMonth[key] = seasonalCandidates
      .filter((p) => p.topMonth === key)
      .sort((a, b) => b.totalContracts - a.totalContracts)
      .slice(0, 6)
  }

  const maxContracts = Math.max(...Object.values(calendarContracts))
  const maxQty = Math.max(...Object.values(calendarQty))
  const calendarBars = MONTH_KEYS.map((key) => ({
    key,
    label: MONTH_LABEL[key],
    contracts: calendarContracts[key],
    contractsPct: maxContracts ? Math.round((calendarContracts[key] / maxContracts) * 100) : 0,
    qty: calendarQty[key],
    qtyPct: maxQty ? Math.round((calendarQty[key] / maxQty) * 100) : 0,
  }))

  // 계약건수 기준으로는 "계약 1건"이라 완전히 묻히는, 학교 한 곳이 몰아산 대량 단발 계약들.
  // 반복수요는 아니지만 그 자체로 진짜 큰 돈이 되는 딜이라 별도로 뽑아서 절대 숨기지 않는다.
  const bulkDeals = rows
    .filter((r) => r.contracts <= 5 && r.qty >= 1000)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 20)
    .map((r) => ({ name: r.name, cat1: r.cat1, month: r.month, contracts: r.contracts, qty: r.qty }))

  return { totalMonths, totalRows: rows.length, steady, byCalendarMonth, calendarBars, monthCounts, bulkDeals }
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

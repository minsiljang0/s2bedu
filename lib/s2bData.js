import { getSupabaseAdmin } from './supabaseAdmin'

export function tagRow(row) {
  const name = row.name
  if (row.cat1 === '상품권') return { key: 'giftcard', label: '상품권 (저마진)', cls: 'bad' }
  if (/복사용지|중질지/.test(name)) return { key: 'quota', label: '장애인생산품 의무구매 채널', cls: 'bad' }
  if (/마스크|자가진단|코로나/.test(name)) return { key: 'onetime', label: '코로나 특수 (종료)', cls: 'warn' }
  if (/RFID/.test(name)) return { key: 'onetime2', label: 'RFID 도입 특수 (종료)', cls: 'warn' }
  if (row.cat2 === '영상/소프트웨어' || /AI|코스웨어|챗봇|Claude|클로드/i.test(name)) {
    return { key: 'ai', label: 'AI 코스웨어/구독 (성장중)', cls: 'good' }
  }
  return { key: 'other', label: row.cat1, cls: '' }
}

export function monthLabel(key) {
  const [y, m] = key.split('-')
  return `${y}년 ${parseInt(m, 10)}월`
}

// 전부 Supabase 기준. seed/fallback 없음 — 관리자 화면에서 실제로 등록한 것만 뜬다.
// Supabase 프로젝트의 Max Rows 설정(기본 1000)에 걸리므로, 한 번에 크게 요청해도 소용없고
// 1000개씩 끊어서 끝까지 반복 조회해야 함.
export async function getAllMonths() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const monthSet = new Set()
  const PAGE = 1000
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from('s2b_top100_rows')
      .select('month')
      .order('month')
      .range(offset, offset + PAGE - 1)
    if (error || !data) break
    data.forEach((r) => monthSet.add(r.month))
    if (data.length < PAGE) break
  }
  return [...monthSet].sort()
}

export async function getMonthRows(month) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('s2b_top100_rows')
    .select('rank,name,cat1,cat2,cat3,contracts,qty')
    .eq('month', month)
    .order('rank')
  if (error || !data) return []
  return data
}

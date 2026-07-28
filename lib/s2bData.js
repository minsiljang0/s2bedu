import seed from '../data/s2b-top100.json'
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

// Supabase가 설정돼있으면 거기서, 아니면 빌드에 포함된 seed JSON에서 읽는다.
// 관리자 화면에서 새 엑셀을 올리면 Supabase 쪽 데이터가 즉시 반영됨(재배포 불필요).
export async function getAllMonths() {
  const supabase = getSupabaseAdmin()
  if (supabase) {
    const { data, error } = await supabase.from('s2b_top100_rows').select('month').order('month')
    if (!error && data && data.length) {
      return [...new Set(data.map((r) => r.month))].sort()
    }
  }
  return Object.keys(seed).sort()
}

export async function getMonthRows(month) {
  const supabase = getSupabaseAdmin()
  if (supabase) {
    const { data, error } = await supabase
      .from('s2b_top100_rows')
      .select('rank,name,cat1,cat2,cat3,contracts,qty')
      .eq('month', month)
      .order('rank')
    if (!error && data && data.length) return data
  }
  return seed[month] || []
}

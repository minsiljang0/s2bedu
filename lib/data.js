import raw from '../data/s2b-top100.json'

export const MONTHS = Object.keys(raw).sort()

export function getMonthData(key) {
  return raw[key] || []
}

export function monthLabel(key) {
  const [y, m] = key.split('-')
  return `${y}년 ${parseInt(m, 10)}월`
}

// 여러 세션에 걸친 실사용 분석 결과를 코드로 고정: 어떤 상품이 왜 "진짜 기회"가 아닌지 태깅.
// 근거는 README 참고 (상품권=저마진, 복사용지=장애인생산품 우선구매 의무채널, 마스크/RFID=끝난 특수트렌드)
export function tagRow(row) {
  const name = row.name
  if (row.cat1 === '상품권') {
    return { key: 'giftcard', label: '상품권 (저마진)', cls: 'bad' }
  }
  if (/복사용지|중질지/.test(name)) {
    return { key: 'quota', label: '장애인생산품 의무구매 채널', cls: 'bad' }
  }
  if (/마스크|자가진단|코로나/.test(name)) {
    return { key: 'onetime', label: '코로나 특수 (종료)', cls: 'warn' }
  }
  if (/RFID/.test(name)) {
    return { key: 'onetime2', label: 'RFID 도입 특수 (종료)', cls: 'warn' }
  }
  if (row.cat2 === '영상/소프트웨어' || /AI|코스웨어|챗봇|Claude|클로드/i.test(name)) {
    return { key: 'ai', label: 'AI 코스웨어/구독 (성장중)', cls: 'good' }
  }
  return { key: 'other', label: row.cat1, cls: '' }
}

// AI 코스웨어 계약건수 합계를 월별로 집계 (트렌드 페이지용)
export function aiTrendByMonth() {
  return MONTHS.map((key) => {
    const rows = getMonthData(key)
    const aiRows = rows.filter((r) => tagRow(r).key === 'ai')
    const totalContracts = aiRows.reduce((s, r) => s + r.contracts, 0)
    const count = aiRows.length
    return { key, label: monthLabel(key), totalContracts, count }
  })
}

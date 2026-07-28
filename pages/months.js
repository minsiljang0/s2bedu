import Link from 'next/link'
import { getAllMonths, getMonthRows, monthLabel } from '../lib/s2bData'

export async function getServerSideProps() {
  const months = await getAllMonths()
  const counts = {}
  for (const m of months) counts[m] = (await getMonthRows(m)).length
  return { props: { months, counts } }
}

export default function MonthsPage({ months, counts }) {
  const sortedMonths = [...months].sort().reverse()
  const totalRows = Object.values(counts).reduce((s, c) => s + c, 0)

  return (
    <>
      <div className="detail-header" style={{ padding: '0 0 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>📂 월별 TOP100 원본 데이터</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>
          S2B가 공식 공개하는 월별 TOP100 판매통계 원본입니다. 현재 {months.length}개월치, 총 {totalRows.toLocaleString()}건.
        </p>
      </div>

      <div className="grid-auto">
        {sortedMonths.map((key) => (
          <Link key={key} href={`/month/${key}`} className="card">
            <div style={{ fontSize: 16, fontWeight: 800 }}>{monthLabel(key)}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
              {counts[key]}건 등록됨 · 계약건수 기준 정렬 가능
            </div>
          </Link>
        ))}
        {months.length === 0 && (
          <div className="empty-state">
            <p>아직 등록된 데이터가 없어요. /admin에서 엑셀을 등록해주세요.</p>
          </div>
        )}
      </div>
    </>
  )
}

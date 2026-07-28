import { getAllMonths, getMonthRows, monthLabel, tagRow } from '../lib/s2bData'

export async function getServerSideProps() {
  const months = await getAllMonths()
  const trend = []
  for (const key of months) {
    const rows = await getMonthRows(key)
    const aiRows = rows.filter((r) => tagRow(r).key === 'ai')
    trend.push({
      key,
      label: monthLabel(key),
      totalContracts: aiRows.reduce((s, r) => s + r.contracts, 0),
      productCount: aiRows.length,
      topProducts: aiRows
        .sort((a, b) => b.contracts - a.contracts)
        .slice(0, 5)
        .map((r) => `${r.name}(${r.contracts}건)`),
    })
  }
  return { props: { trend } }
}

export default function TrendPage({ trend }) {
  const max = Math.max(...trend.map((t) => t.totalContracts), 1)

  return (
    <>
      <div className="detail-header" style={{ padding: '0 0 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>📈 AI 코스웨어 계약건수 추이</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>
          TOP100에 든 AI 코스웨어/AI 구독 상품들의 계약건수 합계입니다. 2020~2023년엔 이 카테고리 자체가
          TOP100에 등장하지 않았고, 2024년부터 매년 커지고 있습니다.
        </p>
      </div>

      <div className="detail-box">
        {trend.map((t) => (
          <div key={t.key} className="bar-row">
            <div className="bar-label">{t.label}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${Math.max((t.totalContracts / max) * 100, t.totalContracts > 0 ? 6 : 0)}%` }}
              >
                {t.totalContracts > 0 ? `${t.totalContracts}건 (${t.productCount}개 상품)` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 32 }}>월별 TOP 상품</div>
      <div className="grid-auto">
        {trend.filter((t) => t.productCount > 0).map((t) => (
          <div key={t.key} className="card" style={{ cursor: 'default' }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{t.label}</div>
            <ul style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, paddingLeft: 16 }}>
              {t.topProducts.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}

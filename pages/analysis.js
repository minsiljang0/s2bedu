import Link from 'next/link'
import { getCachedAnalysis, listAnalysisYears, MONTH_LABEL, MONTH_KEYS } from '../lib/s2bAnalysis'
import { monthLabel } from '../lib/s2bData'

export async function getServerSideProps({ query }) {
  const scope = typeof query.year === 'string' ? query.year : 'all'
  const [data, years] = await Promise.all([
    getCachedAnalysis(scope),
    listAnalysisYears(),
  ])
  return { props: { scope, years, data } }
}

function pillStyle(active) {
  return active ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}
}

export default function AnalysisPage({ scope, years, data }) {
  if (!data) {
    return (
      <div className="empty-state">
        <p>아직 분석 데이터가 없어요. 관리자 화면에서 엑셀을 등록하면 자동으로 분석이 생성돼요.</p>
      </div>
    )
  }

  const { totalMonths, totalRows, steady, byCalendarMonth, calendarBars, bulkDeals, updatedAt } = data

  return (
    <>
      <div className="detail-header" style={{ padding: '0 0 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>📈 {scope === 'all' ? '전체 기간' : `${scope}년`} 판매 트렌드 분석</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>
          {scope === 'all' ? `누적 ${totalMonths}개월` : `${scope}년 ${totalMonths}개월`} · {totalRows.toLocaleString()}건 기준.
          계약건수(반복수요) · 판매수량(총물량) 둘 다 표시합니다. 마지막 분석 갱신: {new Date(updatedAt).toLocaleString('ko-KR')}
        </p>
      </div>

      <div className="toolbar" style={{ marginBottom: 28 }}>
        <Link href="/analysis" className="month-pill" style={pillStyle(scope === 'all')}>전체</Link>
        {years.map((y) => (
          <Link key={y} href={`/analysis?year=${y}`} className="month-pill" style={pillStyle(scope === y)}>{y}</Link>
        ))}
      </div>

      <section style={{ marginBottom: 40 }}>
        <div className="section-title">🗓️ 캘린더월별 판매 흐름 <span>({scope === 'all' ? '전체 연도 합산' : `${scope}년`} · 계약건수 / 판매수량)</span></div>
        <div className="card" style={{ cursor: 'default' }}>
          {calendarBars.map((b) => (
            <div key={b.key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{b.label}</div>
              <div className="bar-row" style={{ marginBottom: 4 }}>
                <div className="bar-label" style={{ width: 70, fontSize: 11 }}>계약건수</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(b.contractsPct, 4)}%` }}>{b.contracts.toLocaleString()}</div>
                </div>
              </div>
              <div className="bar-row">
                <div className="bar-label" style={{ width: 70, fontSize: 11 }}>판매수량</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(b.qtyPct, 4)}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)' }}>{b.qty.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <div className="section-title">💰 큰 단발성 대량계약 <span>(계약 5건 이하인데 판매수량이 큰 것 — 계약건수 집계에선 묻히는 진짜 큰 딜)</span></div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>상품명</th>
                <th>1차카테고리</th>
                <th>월</th>
                <th className="num">계약건수</th>
                <th className="num">판매수량</th>
              </tr>
            </thead>
            <tbody>
              {bulkDeals.map((d, i) => (
                <tr key={d.name + d.month + i}>
                  <td>{i + 1}</td>
                  <td className="name-cell">{d.name}</td>
                  <td><span className="tag">{d.cat1}</span></td>
                  <td>{monthLabel(d.month)}</td>
                  <td className="num">{d.contracts}</td>
                  <td className="num">{d.qty.toLocaleString()}</td>
                </tr>
              ))}
              {bulkDeals.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)' }}>해당하는 대량계약이 없어요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <div className="section-title">🔥 꾸준히 잘 팔리는 상품 TOP {steady.length} <span>(등장 개월수 · 평균 계약건수/판매수량 기준)</span></div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>상품명</th>
                <th>1차카테고리</th>
                <th className="num">등장 개월수</th>
                <th className="num">등장 비율</th>
                <th className="num">평균 계약건수</th>
                <th className="num">평균 판매수량</th>
              </tr>
            </thead>
            <tbody>
              {steady.map((p, i) => (
                <tr key={p.name + i}>
                  <td>{i + 1}</td>
                  <td className="name-cell">{p.name}</td>
                  <td><span className="tag">{p.cat1}</span></td>
                  <td className="num">{p.monthCount}개월</td>
                  <td className="num">{p.coverage}%</td>
                  <td className="num">{p.avgContracts.toLocaleString()}</td>
                  <td className="num">{p.avgQty.toLocaleString()}</td>
                </tr>
              ))}
              {steady.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)' }}>등장 개월수 5개월 이상인 상품이 없어요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-title">🌱 월별로 몰리는 시즌 특수 상품 <span>(특정 달에 계약이 집중된 상품 — 계약건수 · 판매수량)</span></div>
        <div className="grid-auto">
          {MONTH_KEYS.map((key) => (
            <div className="card" key={key} style={{ cursor: 'default' }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>{MONTH_LABEL[key]}</div>
              {byCalendarMonth[key].length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>뚜렷한 시즌 특수 상품 없음</p>
              )}
              {byCalendarMonth[key].map((p, i) => (
                <div key={p.name + i} style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: 'var(--text)' }}>{p.name}</span>
                  <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{p.totalContracts.toLocaleString()}건 · {p.totalQty.toLocaleString()}개</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

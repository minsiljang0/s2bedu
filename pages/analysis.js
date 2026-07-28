import { useState } from 'react'
import Link from 'next/link'
import { getCachedAnalysis, listAnalysisYears, MONTH_LABEL, MONTH_KEYS } from '../lib/s2bAnalysis'
import { monthLabel } from '../lib/s2bData'

function VariantModal({ item, onClose }) {
  if (!item) return null
  const variants = item.variants || []
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{item.cat3}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{item.cat1} · 상품명 {variants.length}개 합산</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '12px 24px', overflowY: 'auto' }}>
          {variants.length === 0 && <p style={{ fontSize: 13, color: 'var(--text3)', padding: '8px 0' }}>이 항목은 갱신 전 캐시라 상세 목록이 없어요 — "지금 분석 갱신" 후 다시 눌러보세요.</p>}
          {variants.map((v, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: i < variants.length - 1 ? '1px solid var(--surface2)' : 'none', fontSize: 13, color: 'var(--text)' }}>{v}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

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
  const [modalItem, setModalItem] = useState(null)

  if (!data) {
    return (
      <div className="empty-state">
        <p>아직 분석 데이터가 없어요. 관리자 화면에서 엑셀을 등록하면 자동으로 분석이 생성돼요.</p>
      </div>
    )
  }

  // 코드는 최신인데 캐시(s2b_analysis_cache)는 새 필드 추가 전에 계산된 옛날 값일 수 있다
  // (관리자가 "지금 분석 갱신"을 다시 누르기 전까지). 그 사이에도 화면이 안 터지게 기본값을 둔다.
  const {
    totalMonths = 0, totalRows = 0, steady = [], byCalendarMonth = {},
    calendarBars = [], bulkDeals = [], categoryRanking = [], updatedAt,
  } = data

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
                  <div className="bar-fill" style={{ width: `${Math.max(b.contractsPct || 0, 4)}%` }}>{(b.contracts || 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="bar-row">
                <div className="bar-label" style={{ width: 70, fontSize: 11 }}>판매수량</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(b.qtyPct || 0, 4)}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)' }}>{(b.qty || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <div className="section-title">🏷️ 잘 팔리는 카테고리 <span>(1차카테고리 기준, 총계약건수 순)</span></div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>1차카테고리</th>
                <th className="num">상품 종류수</th>
                <th className="num">총계약건수</th>
                <th className="num">총판매수량</th>
              </tr>
            </thead>
            <tbody>
              {categoryRanking.map((c, i) => (
                <tr key={c.cat1 + i}>
                  <td>{i + 1}</td>
                  <td className="name-cell">{c.cat1}</td>
                  <td className="num">{c.productCount.toLocaleString()}</td>
                  <td className="num">{c.totalContracts.toLocaleString()}</td>
                  <td className="num">{c.totalQty.toLocaleString()}</td>
                </tr>
              ))}
              {categoryRanking.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)' }}>카테고리 데이터가 없어요.</td></tr>
              )}
            </tbody>
          </table>
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
        <div className="section-title">🔥 꾸준히 잘 팔리는 품목 TOP {steady.length} <span>(1차+3차카테고리로 브랜드/변형 합산 · 등장 개월수·평균 계약건수/판매수량 기준)</span></div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>품목(3차카테고리)</th>
                <th>1차카테고리</th>
                <th className="num">상품 변형수</th>
                <th className="num">등장 개월수</th>
                <th className="num">등장 비율</th>
                <th className="num">평균 계약건수</th>
                <th className="num">평균 판매수량</th>
              </tr>
            </thead>
            <tbody>
              {steady.map((p, i) => (
                <tr key={p.cat1 + p.cat3 + i} onClick={() => setModalItem(p)} style={{ cursor: 'pointer' }}>
                  <td>{i + 1}</td>
                  <td className="name-cell">{p.cat3}</td>
                  <td><span className="tag">{p.cat1}</span></td>
                  <td className="num">{p.variantCount}개</td>
                  <td className="num">{p.monthCount}개월</td>
                  <td className="num">{p.coverage}%</td>
                  <td className="num">{(p.avgContracts || 0).toLocaleString()}</td>
                  <td className="num">{(p.avgQty || 0).toLocaleString()}</td>
                </tr>
              ))}
              {steady.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text3)' }}>등장 개월수 5개월 이상인 품목이 없어요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-title">🌱 월별로 몰리는 시즌 특수 품목 <span>(특정 달에 계약이 집중된 품목 — 브랜드/변형 합산 · 계약건수 · 판매수량)</span></div>
        <div className="grid-auto">
          {MONTH_KEYS.map((key) => (
            <div className="card" key={key} style={{ cursor: 'default' }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>{MONTH_LABEL[key]}</div>
              {byCalendarMonth[key].length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>뚜렷한 시즌 특수 품목 없음</p>
              )}
              {byCalendarMonth[key].map((p, i) => (
                <div
                  key={p.cat1 + p.cat3 + i}
                  onClick={() => setModalItem(p)}
                  style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between', gap: 8, cursor: 'pointer' }}
                >
                  <span style={{ color: 'var(--text)' }}>{p.cat3}</span>
                  <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{(p.totalContracts || 0).toLocaleString()}건 · {(p.totalQty || 0).toLocaleString()}개</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <VariantModal item={modalItem} onClose={() => setModalItem(null)} />
    </>
  )
}

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getMonthRows, monthLabel, tagRow } from '../../lib/s2bData'

export async function getServerSideProps({ params }) {
  const rows = await getMonthRows(params.key)
  return { props: { monthKey: params.key, rows } }
}

export default function MonthPage({ monthKey, rows }) {
  const [q, setQ] = useState('')
  const [hideFiltered, setHideFiltered] = useState(false)
  const [sortBy, setSortBy] = useState('qty')

  const tagged = useMemo(() => rows.map((r) => ({ ...r, tag: tagRow(r) })), [rows])

  const filtered = useMemo(() => {
    let list = tagged
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      list = list.filter((r) => r.name.toLowerCase().includes(needle))
    }
    if (hideFiltered) {
      list = list.filter((r) => r.tag.key === 'ai' || r.tag.key === 'other')
    }
    return [...list].sort((a, b) => sortBy === 'rank' ? a.rank - b.rank : b[sortBy] - a[sortBy])
  }, [tagged, q, hideFiltered, sortBy])

  if (!rows.length) {
    return (
      <div className="empty-state">
        <p>이 달 데이터가 없어요. 관리자 화면에서 엑셀을 등록해주세요.</p>
      </div>
    )
  }

  return (
    <>
      <Link href="/" className="back-link">← 전체 월 목록</Link>
      <div className="detail-header" style={{ padding: '0 0 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>{monthLabel(monthKey)} TOP{rows.length}</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>
          S2B 공식 판매통계 원본. 계약건수 = 서로 다른 학교가 각자 계약한 횟수(반복수요 지표),
          판매수량 = 전체 판매된 수량(대량계약 1건에 좌우될 수 있음).
        </p>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="상품명 검색..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="rank">순번 순</option>
          <option value="contracts">계약건수 순</option>
          <option value="qty">판매수량 순</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={hideFiltered}
            onChange={(e) => setHideFiltered(e.target.checked)}
          />
          상품권·복사용지·마스크·RFID 제외
        </label>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>상품명</th>
              <th>카테고리</th>
              <th>태그</th>
              <th className="num">계약건수</th>
              <th className="num">판매수량</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={`${r.rank}-${i}`}>
                <td>{r.rank}</td>
                <td className="name-cell">{r.name}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                    {[r.cat1, r.cat2, r.cat3].filter(Boolean).map((c, ci) => (
                      <span key={ci} className="tag" style={{ opacity: 1 - ci * 0.25 }}>{c}</span>
                    ))}
                  </div>
                </td>
                <td><span className={`badge ${r.tag.cls}`}>{r.tag.label}</span></td>
                <td className="num">{r.contracts.toLocaleString()}</td>
                <td className="num">{r.qty.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <p>검색/필터 조건에 맞는 상품이 없어요.</p>
        </div>
      )}
    </>
  )
}

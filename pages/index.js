import Link from 'next/link'
import { MONTHS, monthLabel, getMonthData, tagRow } from '../lib/data'

export default function Home() {
  const sortedMonths = [...MONTHS].sort().reverse()
  const totalRows = MONTHS.reduce((s, m) => s + getMonthData(m).length, 0)

  return (
    <>
      <section className="hero">
        <div className="hero-badge">🏫 학교장터(S2B) 판매통계 아카이브</div>
        <h1 className="hero-title">학교장터에서<br />뭐가 진짜 잘 팔릴까</h1>
        <p className="hero-sub">
          S2B가 공식 공개하는 월별 TOP100 판매통계 {MONTHS.length}개월치, 총 {totalRows}건을 모아
          카테고리별로 걸러봤습니다. 상품권/마스크/RFID/복사용지처럼 겉보기엔 많이 팔리지만
          실제로는 저마진이거나 이미 끝난 특수, 혹은 진입 자체가 막힌 카테고리를 걸러내고 나면
          무엇이 남는지 확인하세요.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <div className="section-title">필터링 결과 요약</div>
        <div className="grid-auto">
          <div className="card">
            <span className="badge good">진짜 기회</span>
            <h3 style={{ marginTop: 10, fontSize: 15 }}>AI 코스웨어 / AI 구독</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
              2024년 처음 등장 후 3년 연속 계약건수 증가. 아직 1강이 없는 파편화된 시장.
            </p>
          </div>
          <div className="card">
            <span className="badge bad">저마진</span>
            <h3 style={{ marginTop: 10, fontSize: 15 }}>문화상품권 / 백화점상품권</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
              계약건수는 매년 최상위권이지만 액면가 재판매라 마진 구조가 안 좋음.
            </p>
          </div>
          <div className="card">
            <span className="badge bad">진입 불가</span>
            <h3 style={{ marginTop: 10, fontSize: 15 }}>복사용지 / 중질지</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
              중증장애인생산품 우선구매 특별법 의무구매 채널이라 일반 공급업체 진입이 사실상 막혀있음.
            </p>
          </div>
          <div className="card">
            <span className="badge warn">끝난 특수</span>
            <h3 style={{ marginTop: 10, fontSize: 15 }}>마스크 · 자가진단키트 · RFID</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
              각각 코로나(2020~2022), K-에듀파인 RFID 도입(2022~2023) 특수였고 지금은 자취를 감춤.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">월별 TOP100 원본 데이터</div>
        <div className="grid-auto">
          {sortedMonths.map((key) => (
            <Link key={key} href={`/month/${key}`} className="card">
              <div style={{ fontSize: 16, fontWeight: 800 }}>{monthLabel(key)}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                TOP {getMonthData(key).length} · 계약건수 기준 정렬 가능
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

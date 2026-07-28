import Link from 'next/link'
import { getCachedAnalysis } from '../lib/s2bAnalysis'

export async function getServerSideProps() {
  const analysis = await getCachedAnalysis('all')
  return { props: { monthCount: analysis?.totalMonths || 0, totalRows: analysis?.totalRows || 0 } }
}

export default function Home({ monthCount, totalRows }) {
  return (
    <>
      <section className="hero">
        <div className="hero-badge">🏫 학교장터(S2B) 판매통계 아카이브</div>
        <h1 className="hero-title">S2B 월별 TOP100<br />판매통계 모음</h1>
        <p className="hero-sub">
          S2B가 공식 공개하는 월별 TOP100 판매통계를 모아둔 곳입니다. 현재 {monthCount}개월치, 총 {totalRows.toLocaleString()}건.
        </p>
      </section>

      <section className="grid-auto" style={{ marginTop: 8 }}>
        <Link href="/months" className="card">
          <div style={{ fontSize: 16, fontWeight: 800 }}>📂 월별 데이터</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
            {monthCount}개월치 TOP100 원본을 월별로 확인
          </div>
        </Link>
        <Link href="/analysis" className="card">
          <div style={{ fontSize: 16, fontWeight: 800 }}>📈 트렌드 분석</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
            전체 기간 · 연도별 계절성 / 스테디셀러 분석
          </div>
        </Link>
      </section>
    </>
  )
}

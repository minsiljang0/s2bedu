import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Header() {
  const router = useRouter()
  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <div className="logo-icon">🏫</div>
          <span className="logo-text"><span>S2B</span>edu</span>
        </Link>
        <nav className="header-nav">
          <Link href="/" className={`nav-link${router.pathname === '/' ? ' active' : ''}`}>홈</Link>
          <Link href="/months" className={`nav-link${router.pathname === '/months' ? ' active' : ''}`}>월별 데이터</Link>
          <Link href="/analysis" className={`nav-link${router.pathname === '/analysis' ? ' active' : ''}`}>분석</Link>
        </nav>
      </div>
    </header>
  )
}

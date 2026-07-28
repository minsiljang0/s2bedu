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
        </nav>
      </div>
    </header>
  )
}

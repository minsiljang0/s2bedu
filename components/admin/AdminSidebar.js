import Link from 'next/link'

const NAV = [
  { id: 'upload', label: 'S2B 엑셀 등록', icon: '📊' },
]

function NavItem({ item, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 20px', background: active ? '#dbeafe' : 'none',
      border: 'none', borderLeft: active ? '3px solid #2563eb' : '3px solid transparent',
      color: active ? '#1d4ed8' : '#4b5d78',
      fontSize: 14, fontWeight: active ? 700 : 500,
      cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
      fontFamily: "'Outfit', sans-serif",
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#0f1a2b'; e.currentTarget.style.background = '#eef3fa' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#4b5d78'; e.currentTarget.style.background = 'none' } }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
    </button>
  )
}

export default function AdminSidebar({ activeTab, onNav, onLogout, mobile, open, onClose }) {
  const renderNav = () => (
    <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
      {NAV.map(item => (
        <NavItem key={item.id} item={item} active={activeTab === item.id}
          onClick={() => { onNav(item.id); if (mobile) onClose?.() }} />
      ))}
    </nav>
  )

  const Header = (
    <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #d6e2f2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#2563eb,#3b82f6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏫</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f1a2b' }}>Admin Panel</div>
          <div style={{ fontSize: 11, color: '#8a9ab0', marginTop: 2 }}>S2Bedu</div>
        </div>
      </Link>
      {mobile && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8a9ab0', fontSize: 22, cursor: 'pointer' }}>✕</button>}
    </div>
  )

  const Footer = (
    <div style={{ padding: '12px 20px', borderTop: '1px solid #d6e2f2', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <a href="/" style={{ color: '#4b5d78', fontSize: 13, textDecoration: 'none', padding: '6px 0' }}>← 사이트로</a>
      <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5d78', fontSize: 14, padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Outfit', sans-serif" }}>
        <span>🚪</span> 로그아웃
      </button>
    </div>
  )

  if (mobile) {
    return (
      <>
        {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)' }} />}
        <aside style={{
          position: 'fixed', top: 0, left: open ? 0 : '-260px', zIndex: 1100,
          width: 240, height: '100vh', background: '#fff',
          borderRight: '1px solid #d6e2f2',
          display: 'flex', flexDirection: 'column', transition: 'left .25s ease',
          boxShadow: open ? '4px 0 24px rgba(37,99,235,0.15)' : 'none',
        }}>
          {Header}{renderNav()}{Footer}
        </aside>
      </>
    )
  }

  return (
    <aside style={{
      width: 220, minWidth: 220, background: '#fff',
      borderRight: '1px solid #d6e2f2',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0, overflow: 'hidden',
    }}>
      {Header}{renderNav()}{Footer}
    </aside>
  )
}

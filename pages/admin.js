import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminSidebar from '../components/admin/AdminSidebar'
import { S, Toast } from '../components/admin/AdminUI'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function guessMonth(filename) {
  const m = filename.match(/(\d{4})년\s*(\d{1,2})월/)
  if (!m) return ''
  return `${m[1]}-${String(m[2]).padStart(2, '0')}`
}

function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!pw) { setErr('토큰을 입력하세요'); return }
    sessionStorage.setItem('admin_token', pw)
    onLogin(pw)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ background: '#ffffff', border: '1px solid #d6e2f2', borderRadius: 14, padding: 40, width: 360 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#2563eb,#3b82f6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>🏫</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f1a2b' }}>Admin</h1>
          <p style={{ color: '#4b5d78', fontSize: 14, marginTop: 4 }}>S2Bedu 관리자</p>
        </div>
        <form onSubmit={submit}>
          <input type="password" placeholder="관리자 토큰" value={pw} onChange={(e) => setPw(e.target.value)}
            style={{ ...S.input, borderColor: err ? '#f87171' : '#d6e2f2', marginBottom: 8 }} />
          {err && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{err}</p>}
          <button type="submit" style={{ ...S.btn(), width: '100%', marginTop: 8 }}>로그인</button>
        </form>
      </div>
    </div>
  )
}

function UploadPanel({ adminToken, showToast }) {
  const [file, setFile] = useState(null)
  const [month, setMonth] = useState('')
  const [uploading, setUploading] = useState(false)
  const [months, setMonths] = useState([])
  const [counts, setCounts] = useState({})

  const refresh = () => {
    fetch('/api/s2b/months').then((r) => r.json()).then((d) => {
      setMonths(d.months || [])
      setCounts(d.counts || {})
    })
  }
  useEffect(refresh, [])

  const upload = async () => {
    if (!file || !month) { showToast('파일과 연-월을 모두 입력하세요'); return }
    setUploading(true)
    try {
      const content = await fileToBase64(file)
      const res = await fetch('/api/admin/upload-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ filename: file.name, month, content }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(`❌ ${data.error}`); setUploading(false); return }
      showToast(`✅ ${data.month} — ${data.count}건 등록됨`)
      setFile(null)
      refresh()
    } catch (e) {
      showToast(`❌ ${e.message}`)
    }
    setUploading(false)
  }

  return (
    <>
      <div style={S.card}>
        <div style={S.cardTitle}>📊 S2B 엑셀 등록</div>
        <p style={{ fontSize: 13, color: '#4b5d78', marginBottom: 20 }}>
          S2B My Desk &gt; 물품판매현황 &gt; S2B전체판매통계에서 받은 .xls 파일을 그대로 올리세요.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
          <div>
            <label style={S.label}>엑셀 파일 (.xls)</label>
            <input type="file" accept=".xls" onChange={(e) => {
              const f = e.target.files[0]
              setFile(f)
              if (f) setMonth(guessMonth(f.name))
            }} />
          </div>
          <div>
            <label style={S.label}>연-월</label>
            <input type="text" placeholder="2026-07" value={month} onChange={(e) => setMonth(e.target.value)} style={S.input} />
          </div>
          <button onClick={upload} disabled={uploading} style={{ ...S.btn(), alignSelf: 'flex-start', opacity: uploading ? 0.6 : 1 }}>
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>등록된 월 ({months.length}개)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {[...months].sort().reverse().map((m) => (
            <div key={m} style={S.row}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{m}</div>
              <div style={{ fontSize: 11, color: '#8a9ab0', marginTop: 2 }}>{counts[m]}건</div>
            </div>
          ))}
          {months.length === 0 && <p style={{ fontSize: 13, color: '#8a9ab0' }}>아직 등록된 데이터가 없어요.</p>}
        </div>
      </div>
    </>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [adminToken, setAdminToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upload')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token')
    if (token) { setAuthed(true); setAdminToken(token) }
    setLoading(false)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token')
    setAuthed(false)
  }

  if (loading) return null
  if (!authed) return <LoginScreen onLogin={(t) => { setAuthed(true); setAdminToken(t) }} />

  return (
    <>
      <Head>
        <title>Admin — S2Bedu</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#f4f7fb', fontFamily: "'Outfit', sans-serif", color: '#0f1a2b', display: 'flex' }}>
        <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: '#ffffff', borderBottom: '1px solid #d6e2f2', padding: '14px 16px', alignItems: 'center', justifyContent: 'space-between' }} className="admin-mobile-bar">
          <button onClick={() => setMobileNavOpen(true)} style={{ background: 'none', border: 'none', color: '#0f1a2b', fontSize: 20, cursor: 'pointer' }}>☰</button>
          <span style={{ fontWeight: 700, fontSize: 14 }}>S2B 엑셀 등록</span>
          <span style={{ width: 20 }} />
        </div>

        <style>{`
          @media (max-width: 880px) {
            .admin-desktop-sidebar { display: none !important; }
            .admin-mobile-bar { display: flex !important; }
            .admin-main { padding-top: 64px !important; }
          }
        `}</style>

        <div className="admin-desktop-sidebar">
          <AdminSidebar activeTab={activeTab} onNav={setActiveTab} onLogout={handleLogout} />
        </div>
        <AdminSidebar activeTab={activeTab} onNav={setActiveTab} onLogout={handleLogout}
          mobile open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        <main className="admin-main" style={{ flex: 1, minWidth: 0, padding: '32px 28px 60px' }}>
          <div style={{ maxWidth: 980, margin: '0 auto' }}>
            {activeTab === 'upload' && <UploadPanel adminToken={adminToken} showToast={showToast} />}
          </div>
        </main>
      </div>
      <Toast msg={toast} />
    </>
  )
}

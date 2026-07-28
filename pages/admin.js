import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminSidebar from '../components/admin/AdminSidebar'
import { S, Toast, DeleteModal } from '../components/admin/AdminUI'

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

async function uploadOneFile(file, adminToken) {
  const guessed = guessMonth(file.name)
  const content = await fileToBase64(file)
  const res = await fetch('/api/admin/upload-excel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
    body: JSON.stringify({ filename: file.name, month: guessed, content }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '업로드 실패')
  return data
}

function UploadPanel({ adminToken, showToast }) {
  const [dragOver, setDragOver] = useState(false)
  const [queue, setQueue] = useState([]) // [{name, status: 'pending'|'done'|'error', message}]
  const [months, setMonths] = useState([])
  const [counts, setCounts] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null) // { name: month }
  const [activeYear, setActiveYear] = useState(null)

  const doDeleteMonth = async (m) => {
    const res = await fetch('/api/admin/delete-month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ month: m }),
    })
    const data = await res.json()
    if (!res.ok) { showToast(`❌ ${data.error}`); return }
    showToast(`🗑️ ${m} 삭제됨`)
    refresh()
  }

  const refresh = () => {
    fetch('/api/s2b/months').then((r) => r.json()).then((d) => {
      setMonths(d.months || [])
      setCounts(d.counts || {})
    })
  }
  useEffect(refresh, [])

  const refreshAnalysisNow = () => {
    showToast('📈 분석 계산 중...')
    fetch('/api/admin/refresh-analysis', { method: 'POST', headers: { 'x-admin-token': adminToken } })
      .then((r) => r.json())
      .then((d) => showToast(d.ok ? '📈 분석 갱신 완료' : `❌ ${d.error}`))
      .catch(() => showToast('❌ 분석 갱신 실패'))
  }

  const grouped = {}
  for (const m of [...months].sort().reverse()) {
    const year = m.slice(0, 4)
    ;(grouped[year] = grouped[year] || []).push(m)
  }
  const years = Object.keys(grouped).sort().reverse()
  useEffect(() => {
    if (years.length && !years.includes(activeYear)) setActiveYear(years[0])
  }, [years.join(',')])

  const processFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.xls'))
    if (!files.length) { showToast('.xls 파일만 올릴 수 있어요'); return }

    setQueue(files.map((f) => ({ name: f.name, status: 'pending', message: '' })))

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const month = guessMonth(f.name)
      if (!month) {
        setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: 'error', message: '파일명에서 연-월을 못 읽음' } : item))
        continue
      }
      try {
        const data = await uploadOneFile(f, adminToken)
        setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: 'done', message: `${data.month} — ${data.count}건` } : item))
      } catch (e) {
        setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: 'error', message: e.message } : item))
      }
    }
    refresh()
    // 파일 하나씩이 아니라 이 배치 업로드 전체가 끝난 뒤 딱 한 번만 분석을 다시 계산한다.
    fetch('/api/admin/refresh-analysis', { method: 'POST', headers: { 'x-admin-token': adminToken } })
      .then(() => showToast('📈 분석 갱신 완료'))
      .catch(() => {})
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files)
  }

  return (
    <>
      <div style={S.card}>
        <div style={S.cardTitle}>📊 S2B 엑셀 등록</div>
        <p style={{ fontSize: 13, color: '#4b5d78', marginBottom: 20 }}>
          S2B My Desk &gt; 물품판매현황 &gt; S2B전체판매통계에서 받은 .xls 파일을 여러 개 한번에 드래그해서 놓으면
          파일명에서 연-월을 자동으로 읽어서 파싱 후 등록해요.
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('xls-input').click()}
          style={{
            border: `2px dashed ${dragOver ? '#2563eb' : '#d6e2f2'}`,
            borderRadius: 12, padding: '40px 20px', textAlign: 'center',
            background: dragOver ? '#eef3fa' : '#f4f7fb', cursor: 'pointer',
            transition: 'all .15s',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📥</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1a2b' }}>여기에 .xls 파일을 드래그하세요 (여러 개 가능)</div>
          <div style={{ fontSize: 12, color: '#8a9ab0', marginTop: 4 }}>또는 클릭해서 선택</div>
          <input
            id="xls-input" type="file" accept=".xls" multiple style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files?.length) processFiles(e.target.files); e.target.value = '' }}
          />
        </div>

        {queue.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {queue.map((item, i) => (
              <div key={i} style={{ ...S.row, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
                <span style={{ fontSize: 13 }}>{item.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.status === 'done' ? '#16a34a' : item.status === 'error' ? '#dc2626' : '#8a9ab0' }}>
                  {item.status === 'pending' ? '처리중...' : item.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={{ ...S.cardTitle, justifyContent: 'space-between' }}>
          <span>등록된 월 ({months.length}개)</span>
          <button onClick={refreshAnalysisNow} style={{ ...S.btnGhost, padding: '6px 14px', fontSize: 12 }}>📈 지금 분석 갱신</button>
        </div>

        {years.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, borderBottom: '1px solid #d6e2f2', paddingBottom: 12 }}>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                style={{
                  border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                  background: activeYear === y ? '#2563eb' : '#f4f7fb',
                  color: activeYear === y ? '#fff' : '#4b5d78',
                }}
              >{y} ({grouped[y].length})</button>
            ))}
          </div>
        )}

        {activeYear && grouped[activeYear] && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {grouped[activeYear].map((m) => (
              <div key={m} style={{ ...S.row, position: 'relative' }}>
                <button
                  onClick={() => setDeleteTarget({ name: m })}
                  title="삭제"
                  style={{
                    position: 'absolute', top: 6, right: 6, width: 20, height: 20,
                    border: 'none', borderRadius: 6, background: '#fee2e2', color: '#dc2626',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: '20px', padding: 0,
                  }}
                >✕</button>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{m}</div>
                <div style={{ fontSize: 11, color: '#8a9ab0', marginTop: 2 }}>{counts[m]}건</div>
              </div>
            ))}
          </div>
        )}
        {months.length === 0 && <p style={{ fontSize: 13, color: '#8a9ab0' }}>아직 등록된 데이터가 없어요.</p>}
      </div>

      <DeleteModal
        item={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => doDeleteMonth(deleteTarget.name)}
      />
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

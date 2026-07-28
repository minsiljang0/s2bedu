import { useState, useEffect, useCallback } from 'react'

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

export default function AdminPage() {
  const [token, setToken] = useState('')
  const [authed, setAuthed] = useState(false)
  const [file, setFile] = useState(null)
  const [month, setMonth] = useState('')
  const [status, setStatus] = useState('')
  const [months, setMonths] = useState([])
  const [counts, setCounts] = useState({})

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('s2bedu_admin_token') : ''
    if (saved) { setToken(saved); setAuthed(true) }
  }, [])

  const refresh = useCallback(() => {
    fetch('/api/s2b/months').then((r) => r.json()).then((d) => {
      setMonths(d.months || [])
      setCounts(d.counts || {})
    })
  }, [])

  useEffect(() => { if (authed) refresh() }, [authed, refresh])

  const login = () => {
    localStorage.setItem('s2bedu_admin_token', token)
    setAuthed(true)
  }

  const upload = async () => {
    if (!file || !month) { setStatus('파일과 연-월(예: 2026-07)을 모두 입력하세요.'); return }
    setStatus('업로드 중...')
    try {
      const content = await fileToBase64(file)
      const res = await fetch('/api/admin/upload-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ filename: file.name, month, content }),
      })
      const data = await res.json()
      if (!res.ok) { setStatus(`실패: ${data.error}`); return }
      setStatus(`완료: ${data.month} — ${data.count}건 등록됨`)
      setFile(null)
      refresh()
    } catch (e) {
      setStatus(`오류: ${e.message}`)
    }
  }

  if (!authed) {
    return (
      <div className="detail-box" style={{ maxWidth: 360, margin: '60px auto' }}>
        <div className="detail-label">관리자 토큰</div>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid var(--border)', marginBottom: 10 }}
        />
        <button onClick={login} className="month-pill" style={{ width: '100%' }}>입장</button>
      </div>
    )
  }

  return (
    <>
      <div className="detail-header" style={{ padding: '0 0 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>S2B 엑셀 등록</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>
          S2B My Desk &gt; 물품판매현황 &gt; S2B전체판매통계에서 받은 .xls 파일을 그대로 올리세요.
        </p>
      </div>

      <div className="detail-box">
        <div className="detail-label">엑셀 파일 (.xls)</div>
        <input
          type="file"
          accept=".xls"
          onChange={(e) => {
            const f = e.target.files[0]
            setFile(f)
            if (f) setMonth(guessMonth(f.name))
          }}
          style={{ marginBottom: 14 }}
        />
        <div className="detail-label">연-월</div>
        <input
          type="text"
          placeholder="2026-07"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ width: 160, padding: 9, borderRadius: 8, border: '1.5px solid var(--border)', marginBottom: 14 }}
        />
        <br />
        <button onClick={upload} className="month-pill">업로드</button>
        {status && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text2)' }}>{status}</p>}
      </div>

      <div className="section-title" style={{ marginTop: 32 }}>등록된 월 ({months.length}개)</div>
      <div className="grid-auto">
        {[...months].sort().reverse().map((m) => (
          <div key={m} className="card" style={{ cursor: 'default' }}>
            <div style={{ fontWeight: 800 }}>{m}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{counts[m]}건</div>
          </div>
        ))}
      </div>
    </>
  )
}

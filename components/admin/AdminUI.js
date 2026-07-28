// S2Bedu 관리자 공용 스타일 & UI 컴포넌트 (프레시시즌 admin 패턴 이식, 블루 테마)
export const S = {
  card: { background: '#ffffff', border: '1px solid #d6e2f2', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(37,99,235,0.06)' },
  cardTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#0f1a2b' },
  input: {
    background: '#f4f7fb', border: '1px solid #d6e2f2', borderRadius: 8,
    padding: '10px 14px', color: '#0f1a2b', fontFamily: "'Outfit', sans-serif",
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  btn: (color = '#2563eb') => ({
    background: color, color: '#fff', border: 'none', borderRadius: 9,
    padding: '10px 22px', fontFamily: "'Outfit', sans-serif",
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  }),
  btnGhost: {
    background: 'none', color: '#4b5d78', border: '1px solid #d6e2f2', borderRadius: 9,
    padding: '10px 22px', fontFamily: "'Outfit', sans-serif",
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  label: { color: '#4b5d78', fontSize: 12, marginBottom: 5, display: 'block', fontWeight: 600 },
  row: { background: '#f4f7fb', border: '1px solid #d6e2f2', borderRadius: 10, padding: '12px 16px', marginBottom: 8 },
}

export function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#fff', border: '1px solid #d6e2f2', borderRadius: 10,
      padding: '12px 22px', fontSize: 14, color: '#0f1a2b', zIndex: 999,
      boxShadow: '0 8px 24px rgba(37,99,235,0.15)',
    }}>{msg}</div>
  )
}

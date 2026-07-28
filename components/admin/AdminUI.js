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

export function DeleteModal({ item, onConfirm, onCancel }) {
  if (!item) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.5)', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:380,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)', fontFamily:"'Outfit',sans-serif", overflow:'hidden' }}>
        <div style={{ padding:'28px 24px 20px', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#111', marginBottom:8 }}>정말 삭제할까요?</div>
          <div style={{ fontSize:13, background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:8,
            padding:'10px 16px', color:'#1d4ed8', fontWeight:700, marginBottom:6 }}>
            "{item.name}"
          </div>
          <div style={{ fontSize:11, color:'#aaa' }}>삭제하면 복구할 수 없어요</div>
        </div>
        <div style={{ display:'flex', borderTop:'1px solid #f0f0f0' }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:'15px 0', border:'none', background:'#f4f7fb', color:'#4b5d78',
              fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              borderRight:'1px solid #f0f0f0' }}>취소</button>
          <button onClick={() => { onConfirm(); onCancel() }}
            style={{ flex:1, padding:'15px 0', border:'none', background:'#fee2e2', color:'#dc2626',
              fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
        </div>
      </div>
    </div>
  )
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

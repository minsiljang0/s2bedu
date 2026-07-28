import { parseS2bXls } from '../../../lib/parseS2bXls'
import { getSupabaseAdmin, isAdmin } from '../../../lib/supabaseAdmin'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' })

  const { filename, month, content } = req.body || {}
  if (!content || !month) return res.status(400).json({ error: 'month, content(base64) required' })

  let rows
  try {
    const buffer = Buffer.from(content, 'base64')
    rows = parseS2bXls(buffer)
  } catch (e) {
    return res.status(400).json({ error: `파싱 실패: ${e.message}` })
  }
  if (!rows.length) return res.status(400).json({ error: '파싱된 행이 0개입니다.' })

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'Supabase 환경변수(SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY) 미설정' })

  const payload = rows.map((r) => ({ month, ...r }))
  const { error } = await supabase.from('s2b_top100_rows').upsert(payload, { onConflict: 'month,rank' })
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true, month, filename, count: rows.length })
}

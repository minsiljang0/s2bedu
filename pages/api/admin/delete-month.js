import { getSupabaseAdmin, isAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' })

  const { month } = req.body || {}
  if (!month) return res.status(400).json({ error: 'month required' })

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'Supabase 미설정' })

  const { error } = await supabase.from('s2b_top100_rows').delete().eq('month', month)
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true, month })
}

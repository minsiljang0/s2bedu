import { isAdmin } from '../../../lib/supabaseAdmin'
import { refreshAnalysisCache } from '../../../lib/s2bAnalysis'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' })

  await refreshAnalysisCache()
  return res.status(200).json({ ok: true })
}

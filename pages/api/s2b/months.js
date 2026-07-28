import { getCachedAnalysis } from '../../../lib/s2bAnalysis'

export default async function handler(req, res) {
  const analysis = await getCachedAnalysis('all')
  const counts = analysis?.monthCounts || {}
  const months = Object.keys(counts)
  res.status(200).json({ months, counts })
}

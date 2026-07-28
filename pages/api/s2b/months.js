import { getAllMonths, getMonthRows } from '../../../lib/s2bData'

export default async function handler(req, res) {
  const months = await getAllMonths()
  const counts = {}
  for (const m of months) counts[m] = (await getMonthRows(m)).length
  res.status(200).json({ months, counts })
}

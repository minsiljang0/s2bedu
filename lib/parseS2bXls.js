import iconv from 'iconv-lite'
import * as cheerio from 'cheerio'

export function parseS2bXls(buffer) {
  const html = iconv.decode(buffer, 'euc-kr')
  const $ = cheerio.load(html)
  const table = $('table').first()
  const headerCells = table.find('tr').first().find('th,td').map((i, el) => $(el).text().trim()).get()

  const idx = {
    rank: headerCells.indexOf('순번'),
    name: headerCells.indexOf('상품명'),
    cat1: headerCells.indexOf('1차카테고리'),
    cat2: headerCells.indexOf('2차카테고리'),
    cat3: headerCells.indexOf('3차카테고리'),
    contracts: headerCells.indexOf('계약건수'),
    qty: headerCells.indexOf('판매수량'),
  }
  if (idx.name === -1 || idx.rank === -1) {
    throw new Error('S2B 판매통계 형식이 아닌 것 같음 (순번/상품명 헤더 못 찾음)')
  }

  const rows = []
  table.find('tr').slice(1).each((i, tr) => {
    const cells = $(tr).find('td').map((j, el) => $(el).text().trim()).get()
    if (!cells.length) return
    const rank = parseInt(cells[idx.rank], 10)
    if (!rank) return
    rows.push({
      rank,
      name: cells[idx.name] || '',
      cat1: cells[idx.cat1] || '',
      cat2: cells[idx.cat2] || '',
      cat3: cells[idx.cat3] || '',
      contracts: parseInt((cells[idx.contracts] || '0').replace(/,/g, ''), 10) || 0,
      qty: parseInt((cells[idx.qty] || '0').replace(/,/g, ''), 10) || 0,
    })
  })
  return rows
}

import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import data from '../../../data/s2b-top100.json'

const MONTHS = Object.keys(data).sort()

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'minsiljang0'
const GITHUB_REPO = process.env.GITHUB_REPO || 's2bedu'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const SYSTEM_PROMPT_PATH = 'claude/system_prompt.md'

async function ghRequest(path, options = {}) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      ...(options.headers || {}),
    },
  })
  return res
}

function text(t) {
  return { content: [{ type: 'text', text: t }] }
}

function tagRow(row) {
  const name = row.name
  if (row.cat1 === '상품권') return 'giftcard(저마진)'
  if (/복사용지|중질지/.test(name)) return 'quota(장애인생산품 우선구매 채널)'
  if (/마스크|자가진단|코로나/.test(name)) return 'onetime(코로나 특수, 종료)'
  if (/RFID/.test(name)) return 'onetime(RFID 도입 특수, 종료)'
  if (row.cat2 === '영상/소프트웨어' || /AI|코스웨어|챗봇|Claude|클로드/i.test(name)) return 'ai(성장중)'
  return 'other'
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'list_months',
      'S2B 월별 TOP100 판매통계 데이터가 있는 연-월 목록을 반환한다.',
      {},
      async () => text(JSON.stringify(MONTHS))
    )

    server.tool(
      'get_month_top100',
      '특정 연-월(예: "2026-06")의 S2B TOP100 판매통계 원본 100건을 반환한다. 각 행에 순위/상품명/카테고리/계약건수/판매수량이 있다.',
      { month: z.string().describe('연-월 형식, 예: 2026-06') },
      async ({ month }) => {
        const rows = data[month]
        if (!rows) return text(`데이터 없음. 사용 가능한 월: ${MONTHS.join(', ')}`)
        return text(JSON.stringify(rows))
      }
    )

    server.tool(
      'search_products',
      '전체 기간(모든 월)에서 상품명에 특정 키워드가 포함된 행을 검색한다.',
      { keyword: z.string() },
      async ({ keyword }) => {
        const out = []
        for (const month of MONTHS) {
          for (const row of data[month]) {
            if (row.name.includes(keyword)) out.push({ month, ...row })
          }
        }
        return text(JSON.stringify(out))
      }
    )

    server.tool(
      'get_ai_courseware_trend',
      'AI 코스웨어/AI 구독 카테고리로 태깅된 상품들의 월별 계약건수 합계 추이를 반환한다 (2024년부터 시작된 성장 트렌드 확인용).',
      {},
      async () => {
        const trend = MONTHS.map((month) => {
          const aiRows = data[month].filter((r) => tagRow(r) === 'ai(성장중)')
          return {
            month,
            productCount: aiRows.length,
            totalContracts: aiRows.reduce((s, r) => s + r.contracts, 0),
            topProducts: aiRows
              .sort((a, b) => b.contracts - a.contracts)
              .slice(0, 5)
              .map((r) => `${r.name}(${r.contracts}건)`),
          }
        })
        return text(JSON.stringify(trend))
      }
    )

    server.tool(
      'tag_excluded_categories',
      '특정 월 데이터에서 각 상품이 왜 "진짜 기회"가 아닌지(상품권=저마진, 복사용지=장애인생산품 의무구매 채널, 마스크/RFID=끝난 특수트렌드) 태깅해서 반환한다.',
      { month: z.string().describe('연-월 형식, 예: 2026-06') },
      async ({ month }) => {
        const rows = data[month]
        if (!rows) return text(`데이터 없음. 사용 가능한 월: ${MONTHS.join(', ')}`)
        return text(JSON.stringify(rows.map((r) => ({ ...r, tag: tagRow(r) }))))
      }
    )

    server.tool(
      'list_github_files',
      `${GITHUB_OWNER}/${GITHUB_REPO} 저장소의 특정 경로에 어떤 파일이 있는지 조회한다.`,
      { path: z.string().optional().describe('조회할 경로, 비우면 루트') },
      async ({ path: p }) => {
        const res = await ghRequest(`contents/${p || ''}`)
        if (!res.ok) return text(`오류: ${res.status}`)
        const json = await res.json()
        const listing = Array.isArray(json)
          ? json.map((f) => `${f.type === 'dir' ? '📁' : '📄'} ${f.path}`).join('\n')
          : `📄 ${json.path}`
        return text(listing)
      }
    )

    server.tool(
      'get_github_file',
      `${GITHUB_OWNER}/${GITHUB_REPO} 저장소의 특정 파일 내용을 텍스트로 가져온다.`,
      { path: z.string() },
      async ({ path: p }) => {
        const res = await ghRequest(`contents/${p}`)
        if (!res.ok) return text(`오류: ${res.status}`)
        const json = await res.json()
        const content = Buffer.from(json.content, 'base64').toString('utf-8')
        return text(content)
      }
    )

    server.tool(
      'get_system_prompt',
      '이 프로젝트(s2bedu)의 저장된 Claude 프로젝트 지침(claude/system_prompt.md)을 가져온다.',
      {},
      async () => {
        const res = await ghRequest(`contents/${SYSTEM_PROMPT_PATH}`)
        if (res.status === 404) return text('(아직 지침 파일 없음. update_system_prompt로 처음 생성 가능)')
        if (!res.ok) return text(`오류: ${res.status}`)
        const json = await res.json()
        return text(Buffer.from(json.content, 'base64').toString('utf-8'))
      }
    )

    server.tool(
      'update_system_prompt',
      '이 프로젝트(s2bedu)의 Claude 프로젝트 지침(claude/system_prompt.md)을 전체 덮어쓴다. GitHub 커밋으로 영구 저장됨.',
      { content: z.string(), commit_message: z.string().optional() },
      async ({ content, commit_message }) => {
        let sha
        const existing = await ghRequest(`contents/${SYSTEM_PROMPT_PATH}`)
        if (existing.ok) {
          const j = await existing.json()
          sha = j.sha
        }
        const res = await ghRequest(`contents/${SYSTEM_PROMPT_PATH}`, {
          method: 'PUT',
          body: JSON.stringify({
            message: commit_message || 'update system_prompt via MCP',
            content: Buffer.from(content, 'utf-8').toString('base64'),
            ...(sha ? { sha } : {}),
          }),
        })
        if (!res.ok) return text(`오류: ${res.status} ${await res.text()}`)
        return text('저장 완료')
      }
    )
  },
  {},
  { basePath: '/api' }
)

export { handler as GET, handler as POST, handler as DELETE }

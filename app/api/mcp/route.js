import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { parseS2bXls } from '../../../lib/parseS2bXls'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

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

// 전부 Supabase 기준. seed/fallback 없음.
async function readMonths() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const monthSet = new Set()
  const PAGE = 1000
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from('s2b_top100_rows')
      .select('month')
      .order('month')
      .range(offset, offset + PAGE - 1)
    if (error || !data) break
    data.forEach((r) => monthSet.add(r.month))
    if (data.length < PAGE) break
  }
  return [...monthSet].sort()
}

async function readMonthRows(month) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  {
    const { data, error } = await supabase
      .from('s2b_top100_rows')
      .select('rank,name,cat1,cat2,cat3,contracts,qty')
      .eq('month', month)
      .order('rank')
    if (!error && data && data.length) return data
  }
  return []
}

const handler = createMcpHandler(
  (server) => {
    // ── 조회 ──────────────────────────────────────────────
    server.tool(
      'list_months',
      'DB(Supabase)에 등록된, 또는 없으면 seed 데이터의 연-월 목록을 반환한다.',
      {},
      async () => text(JSON.stringify(await readMonths()))
    )

    server.tool(
      'get_month_top100',
      '특정 연-월(예: "2026-06")의 S2B TOP100 판매통계를 반환한다.',
      { month: z.string().describe('연-월 형식, 예: 2026-06') },
      async ({ month }) => {
        const rows = await readMonthRows(month)
        if (!rows.length) return text(`데이터 없음: ${month}`)
        return text(JSON.stringify(rows))
      }
    )

    server.tool(
      'search_products',
      '등록된 모든 월에서 상품명에 특정 키워드가 포함된 행을 검색한다.',
      { keyword: z.string() },
      async ({ keyword }) => {
        const months = await readMonths()
        const out = []
        for (const month of months) {
          const rows = await readMonthRows(month)
          for (const row of rows) if (row.name.includes(keyword)) out.push({ month, ...row })
        }
        return text(JSON.stringify(out))
      }
    )

    server.tool(
      'get_ai_courseware_trend',
      'AI 코스웨어/AI 구독으로 태깅된 상품들의 월별 계약건수 합계 추이를 반환한다.',
      {},
      async () => {
        const months = await readMonths()
        const trend = []
        for (const month of months) {
          const rows = await readMonthRows(month)
          const aiRows = rows.filter((r) => tagRow(r) === 'ai(성장중)')
          trend.push({
            month,
            productCount: aiRows.length,
            totalContracts: aiRows.reduce((s, r) => s + r.contracts, 0),
            topProducts: aiRows.sort((a, b) => b.contracts - a.contracts).slice(0, 5).map((r) => `${r.name}(${r.contracts}건)`),
          })
        }
        return text(JSON.stringify(trend))
      }
    )

    server.tool(
      'tag_excluded_categories',
      '특정 월 데이터에서 각 상품이 왜 "진짜 기회"가 아닌지(상품권/장애인생산품 채널/끝난 특수트렌드) 태깅해서 반환한다.',
      { month: z.string() },
      async ({ month }) => {
        const rows = await readMonthRows(month)
        if (!rows.length) return text(`데이터 없음: ${month}`)
        return text(JSON.stringify(rows.map((r) => ({ ...r, tag: tagRow(r) }))))
      }
    )

    // ── DB 쓰기 (Supabase 필요) ──────────────────────────────
    server.tool(
      'list_tables',
      's2bedu가 쓰는 Supabase 테이블 목록과 스키마를 반환한다.',
      {},
      async () => text(JSON.stringify({
        s2b_top100_rows: 'id, month(text), rank(int), name(text), cat1/cat2/cat3(text), contracts(int), qty(int), created_at — unique(month, rank)',
      }))
    )

    server.tool(
      'get_rows',
      's2b_top100_rows 테이블에서 조건에 맞는 행을 그대로 가져온다 (month 필터 선택).',
      { month: z.string().optional(), limit: z.number().optional() },
      async ({ month, limit }) => {
        const supabase = getSupabaseAdmin()
        if (!supabase) return text('오류: Supabase 미설정')
        let q = supabase.from('s2b_top100_rows').select('*').order('month').order('rank')
        if (month) q = q.eq('month', month)
        if (limit) q = q.limit(limit)
        const { data, error } = await q
        if (error) return text(`오류: ${error.message}`)
        return text(JSON.stringify(data))
      }
    )

    server.tool(
      'upsert_row',
      's2b_top100_rows에 행 하나를 직접 등록/수정한다 (month+rank 기준 upsert).',
      {
        month: z.string(), rank: z.number(), name: z.string(),
        cat1: z.string().optional(), cat2: z.string().optional(), cat3: z.string().optional(),
        contracts: z.number().optional(), qty: z.number().optional(),
      },
      async (row) => {
        const supabase = getSupabaseAdmin()
        if (!supabase) return text('오류: Supabase 미설정')
        const { error } = await supabase.from('s2b_top100_rows').upsert([row], { onConflict: 'month,rank' })
        if (error) return text(`오류: ${error.message}`)
        return text('저장 완료')
      }
    )

    server.tool(
      'delete_row',
      's2b_top100_rows에서 특정 month(전체) 또는 month+rank(단일 행)를 삭제한다.',
      { month: z.string(), rank: z.number().optional() },
      async ({ month, rank }) => {
        const supabase = getSupabaseAdmin()
        if (!supabase) return text('오류: Supabase 미설정')
        let q = supabase.from('s2b_top100_rows').delete().eq('month', month)
        if (rank !== undefined) q = q.eq('rank', rank)
        const { error, count } = await q.select('*', { count: 'exact' })
        if (error) return text(`오류: ${error.message}`)
        return text(`삭제 완료 (${count ?? '?'}건)`)
      }
    )

    server.tool(
      'upload_excel',
      'S2B에서 받은 .xls 파일(base64)을 서버에서 직접 파싱해서 s2b_top100_rows에 통째로 등록한다. 관리자 화면의 업로드 기능과 동일.',
      { month: z.string().describe('연-월 형식, 예: 2026-07'), content_base64: z.string().describe('.xls 파일 내용을 base64로 인코딩한 문자열') },
      async ({ month, content_base64 }) => {
        const supabase = getSupabaseAdmin()
        if (!supabase) return text('오류: Supabase 미설정')
        let rows
        try {
          rows = parseS2bXls(Buffer.from(content_base64, 'base64'))
        } catch (e) {
          return text(`파싱 실패: ${e.message}`)
        }
        if (!rows.length) return text('파싱된 행이 0개')
        const payload = rows.map((r) => ({ month, ...r }))
        const { error } = await supabase.from('s2b_top100_rows').upsert(payload, { onConflict: 'month,rank' })
        if (error) return text(`오류: ${error.message}`)
        return text(`등록 완료: ${month} — ${rows.length}건`)
      }
    )

    // ── 이 저장소 자체 파일/지침 ───────────────────────────────
    server.tool(
      'list_github_files',
      `${GITHUB_OWNER}/${GITHUB_REPO} 저장소의 특정 경로에 어떤 파일이 있는지 조회한다.`,
      { path: z.string().optional() },
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
        return text(Buffer.from(json.content, 'base64').toString('utf-8'))
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
      '이 프로젝트(s2bedu)의 Claude 프로젝트 지침(claude/system_prompt.md)을 전체 덮어쓴다.',
      { content: z.string(), commit_message: z.string().optional() },
      async ({ content, commit_message }) => {
        let sha
        const existing = await ghRequest(`contents/${SYSTEM_PROMPT_PATH}`)
        if (existing.ok) sha = (await existing.json()).sha
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

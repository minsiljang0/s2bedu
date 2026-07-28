# S2Bedu

학교장터(S2B)가 공식 공개하는 월별 TOP100 판매통계를 모아서, 카테고리별로 진짜 기회인지
아닌지 걸러서 보여주는 비공식 아카이브 사이트. 프레시시즌(minsiljang0/Fresh_Season) 코드베이스의
Next.js + 디자인 시스템 구조를 재사용했음.

## 데이터 출처

`data_source/*.xls` — S2B 공급업체 계정(My Desk > 물품판매현황 > S2B전체판매통계)에서
매월 다운로드 가능한 공식 TOP100 파일. 확장자만 .xls이고 실제로는 EUC-KR 인코딩 HTML
테이블이라 `pandas.read_html(..., encoding='euc-kr')`로 파싱해야 함. `data_source/convert.py`가
`data/s2b-top100.json`으로 통합 변환함.

## 실행

```bash
npm install
npm run dev
```

## MCP 서버

`app/api/mcp/route.js`에 이 프로젝트 전용 MCP 서버가 있음. 배포 후 다음 env가 필요함:

- `GITHUB_TOKEN` — 이 저장소에 contents 읽기/쓰기 권한이 있는 GitHub PAT (get_system_prompt /
  update_system_prompt가 `claude/system_prompt.md`를 이 저장소에 커밋하는 방식으로 영속화함,
  별도 DB 없음)
- `GITHUB_OWNER`, `GITHUB_REPO` — 기본값 minsiljang0/s2bedu

## 새 달 데이터 추가하는 법

1. S2B 로그인 → My Desk > 물품판매현황 > S2B전체판매통계 > 원하는 월 다운로드 → `data_source/`에 저장
2. `python data_source/convert.py` 실행 → `data/s2b-top100.json` 갱신
3. 커밋 & 배포

# 풋볼실험실 자동 갱신 사이트

3시간마다 GitHub가 알아서 경기 결과·일정·순위·뉴스 헤드라인을 갱신합니다. (서버 비용 0원)

## 설정 (한 번만, 약 10분)
1. https://www.football-data.org/client/register 에서 무료 API 키 발급 (이메일로 옴)
2. GitHub에서 새 저장소를 만들고 이 폴더의 파일을 전부 업로드
3. 저장소 Settings → Secrets and variables → Actions → New repository secret
   - Name: `FOOTBALL_DATA_KEY` / Value: 발급받은 키
4. Settings → Pages → Branch: `main`, 폴더: `/docs` 선택 후 저장
5. Actions 탭 → update-data → Run workflow 를 눌러 첫 데이터 생성
6. 1~2분 뒤 `https://내아이디.github.io/저장소이름/` 에서 확인

## 참고
- 무료 요금제 범위: 프리미어리그, 라리가, 세리에 A, 분데스리가, 리그 1
- 팀 이름은 `scripts/update.mjs`의 한글 매핑으로 표시돼요. 매핑에 없는 팀은 영문으로 나오니, 필요하면 `KO` 목록에 한 줄 추가하세요.
- 갱신 주기는 `.github/workflows/update.yml`의 cron 값으로 조절하세요.

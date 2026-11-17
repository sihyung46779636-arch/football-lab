// 풋볼실험실 데이터 갱신 스크립트 (Node 20+, 외부 패키지 없음)
import { readFile, writeFile } from "node:fs/promises";

const KEY = process.env.FOOTBALL_DATA_KEY;
if (!KEY) throw new Error("FOOTBALL_DATA_KEY 환경변수가 없습니다.");

const LEAGUES = {
  epl: ["PL", "프리미어리그", "프리미어리그 축구"],
  laliga: ["PD", "라리가", "라리가 축구"],
  seriea: ["SA", "세리에 A", "세리에A 축구"],
  bundes: ["BL1", "분데스리가", "분데스리가 축구"],
  ligue1: ["FL1", "리그 1", "리그앙 축구"],
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const day = (d) => d.toISOString().slice(0, 10);
const shift = (n) => new Date(Date.now() + n * 864e5);

async function api(path) {
  await sleep(7000); // 무료 요금제: 분당 10회 제한
  const r = await fetch("https://api.football-data.org/v4" + path, { headers: { "X-Auth-Token": KEY } });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}
// 팀 한글명 매핑 (위에서부터 먼저 맞는 항목 적용, 없으면 영문 그대로 표시)
const KO = [
  [/manchester city|man city/, "맨시티"], [/manchester united|man united|man utd/, "맨유"],
  [/arsenal/, "아스널"], [/aston villa/, "빌라"], [/bournemouth/, "본머스"], [/brentford/, "브렌트퍼드"],
  [/brighton/, "브라이턴"], [/burnley/, "번리"], [/chelsea/, "첼시"], [/coventry/, "코번트리"],
  [/crystal palace/, "팰리스"], [/everton/, "에버턴"], [/fulham/, "풀럼"], [/\bhull\b/, "헐"],
  [/ipswich/, "입스위치"], [/leeds/, "리즈"], [/liverpool/, "리버풀"], [/newcastle/, "뉴캐슬"],
  [/nottingham|nott'm/, "노팅엄"], [/sunderland/, "선덜랜드"], [/tottenham|spurs/, "토트넘"],
  [/west ham/, "웨스트햄"], [/wolverhampton|wolves/, "울버햄튼"],
  [/real madrid/, "레알"], [/barcelona/, "바르사"], [/atl[eé]tico/, "아틀레티코"], [/real sociedad/, "소시에다드"],
  [/athletic/, "빌바오"], [/betis/, "베티스"], [/celta/, "셀타"], [/alav[eé]s/, "알라베스"], [/elche/, "엘체"],
  [/espanyol/, "에스파뇰"], [/getafe/, "헤타페"], [/girona/, "지로나"], [/levante/, "레반테"],
  [/mallorca/, "마요르카"], [/osasuna/, "오사수나"], [/rayo/, "라요"], [/sevilla/, "세비야"],
  [/valencia/, "발렌시아"], [/villarreal/, "비야레알"], [/deportivo/, "데포르티보"], [/m[aá]laga/, "말라가"],
  [/racing/, "라싱"], [/oviedo/, "오비에도"],
  [/internazionale|inter milan|^inter\b/, "인터"], [/milan/, "밀란"], [/juventus/, "유벤투스"], [/napoli/, "나폴리"],
  [/atalanta/, "아탈란타"], [/bologna/, "볼로냐"], [/cagliari/, "칼리아리"], [/\bcomo\b/, "코모"],
  [/fiorentina/, "피오렌티나"], [/genoa/, "제노아"], [/hellas|verona/, "베로나"], [/lazio/, "라치오"],
  [/lecce/, "레체"], [/parma/, "파르마"], [/\bpisa\b/, "피사"], [/\broma\b/, "로마"], [/sassuolo/, "사수올로"],
  [/torino/, "토리노"], [/udinese/, "우디네세"], [/venezia|venice/, "베네치아"], [/monza/, "몬차"],
  [/frosinone/, "프로시노네"], [/cremonese/, "크레모네세"],
  [/bayern/, "바이에른"], [/dortmund/, "도르트문트"], [/leverkusen/, "레버쿠젠"], [/leipzig/, "라이프치히"],
  [/frankfurt/, "프랑크푸르트"], [/stuttgart/, "슈투트가르트"], [/freiburg/, "프라이부르크"],
  [/hoffenheim/, "호펜하임"], [/wolfsburg/, "볼프스부르크"], [/bremen/, "브레멘"], [/mainz/, "마인츠"],
  [/augsburg/, "아우크스부르크"], [/gladbach/, "묀헨글라트바흐"], [/union berlin/, "우니온"],
  [/hamburg/, "함부르크"], [/k[öo]ln|cologne/, "쾰른"], [/heidenheim/, "하이덴하임"], [/pauli/, "장크트파울리"],
  [/schalke/, "샬케"], [/paderborn/, "파더보른"], [/elversberg/, "엘버스베르크"], [/hertha/, "헤르타"],
  [/paris saint|psg/, "PSG"], [/paris fc/, "파리FC"], [/marseille/, "마르세유"], [/monaco/, "모나코"],
  [/\blille\b/, "릴"], [/lyon/, "리옹"], [/\bnice\b/, "니스"], [/rennes/, "렌"], [/\blens\b/, "랑스"],
  [/strasbourg/, "스트라스부르"], [/brest/, "브레스트"], [/toulouse/, "툴루즈"], [/nantes/, "낭트"],
  [/lorient/, "로리앙"], [/auxerre/, "오세르"], [/angers/, "앙제"], [/le havre/, "르아브르"],
  [/\bmetz\b/, "메스"], [/le mans/, "르망"], [/troyes/, "트루아"],
];
const team = (t) => {
  const s = (t.name || "").toLowerCase();
  for (const [re, ko] of KO) if (re.test(s)) return ko;
  return t.shortName || t.name;
};
const toMatch = (m) => ({
  t: m.utcDate, h: team(m.homeTeam), a: team(m.awayTeam),
  hs: m.score?.fullTime?.home ?? null, as: m.score?.fullTime?.away ?? null,
});

async function news(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  const xml = await (await fetch(url)).text();
  const pick = (s, tag) => {
    const m = s.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() : "";
  };
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 6).map((x) => ({
    title: pick(x[1], "title"), link: pick(x[1], "link"), src: pick(x[1], "source"), date: pick(x[1], "pubDate"),
  }));
}

let prev = {};
try { prev = JSON.parse(await readFile("docs/data.json", "utf8")); } catch {}
const out = { updated: new Date().toISOString(), leagues: {}, kr: prev.kr || [] };

for (const [id, [code, name, q]] of Object.entries(LEAGUES)) {
  const old = prev.leagues?.[id] || {};
  const cur = { name, results: old.results || [], fixtures: old.fixtures || [], table: old.table || [], news: old.news || [] };
  try {
    const fin = await api(`/competitions/${code}/matches?status=FINISHED
    cur.results = fin.matches.map(toMatch).sort((a, b) => b.t.localeCompare(a.t)).slice(0, 10);
        const up = await api(`/competitions/${code}/matches?status=SCHEDULED,TIMED`);
    cur.fixtures = up.matches.map(toMatch).sort((a, b) => a.t.localeCompare(b.t)).slice(0, 10);
    const st = await api(`/competitions/${code}/standings`);
    cur.table = st.standings[0].table.map((r) => ({ p: r.position, n: team(r.team), g: r.playedGames, w: r.won, d: r.draw, l: r.lost, pts: r.points }));
  } catch (e) { console.error(id, "경기 데이터 실패:", e.message); }
  try { cur.news = await news(q); } catch (e) { console.error(id, "뉴스 실패:", e.message); }
  out.leagues[id] = cur;
}
try { out.kr = [...(await news("축구 국가대표팀")), ...(await news("K리그"))]; } catch (e) { console.error("kr 뉴스 실패:", e.message); }

await writeFile("docs/data.json", JSON.stringify(out, null, 1));
console.log("완료:", out.updated);

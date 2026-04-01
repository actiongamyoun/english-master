import { useState, useEffect, useRef } from "react";
import CHAPTERS_DATA from "./chapters/index.js";

/* ═══════════════════════════════════════════════════════════════
   🚀 ENGLISH MASTER v2 — 확장형 영어학습 PWA
   - 챕터: /src/chapters/ 에서 자동 로드
   - 부모설정: 비밀번호로 보상 설정
   - 게임링크: 외부 게임사이트 연동
═══════════════════════════════════════════════════════════════ */

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr, n) => shuffle(arr).slice(0, n);

// 챕터 데이터에서 전체 단어 추출 (슈팅 게임용)
const ALL_WORDS = CHAPTERS_DATA.filter(c => !c.locked).flatMap(c =>
  c.levels.flatMap(l => l.data || [])
);

// 챕터별 문장 데이터 모으기
const ALL_SENTENCES = CHAPTERS_DATA.flatMap(c => c.sentences || []);

// ─── 가챠 ───
const GACHA_ITEMS = [
  { name: "⭐ 별사탕", rarity: "common", points: 5, desc: "반짝반짝!" },
  { name: "🍪 쿠키", rarity: "common", points: 5, desc: "바삭바삭~" },
  { name: "🧸 곰인형", rarity: "common", points: 10, desc: "포근해!" },
  { name: "🎮 게임패드", rarity: "rare", points: 20, desc: "레어!" },
  { name: "🚀 로켓", rarity: "rare", points: 25, desc: "슝!" },
  { name: "🦄 유니콘", rarity: "rare", points: 30, desc: "매직!" },
  { name: "👑 왕관", rarity: "epic", points: 50, desc: "에픽!!" },
  { name: "🐉 드래곤", rarity: "epic", points: 50, desc: "으르렁!!" },
  { name: "💎 다이아", rarity: "legendary", points: 100, desc: "전설!!!" },
];
const getGachaItem = () => {
  const r = Math.random();
  const pool = r < 0.03 ? GACHA_ITEMS.filter(i => i.rarity === "legendary")
    : r < 0.12 ? GACHA_ITEMS.filter(i => i.rarity === "epic")
    : r < 0.35 ? GACHA_ITEMS.filter(i => i.rarity === "rare")
    : GACHA_ITEMS.filter(i => i.rarity === "common");
  return pool[Math.floor(Math.random() * pool.length)];
};
const RC = { common: "#90A4AE", rare: "#42A5F5", epic: "#AB47BC", legendary: "#FF6F00" };
const RL = { common: "커먼⚪", rare: "레어🔵", epic: "에픽🟣", legendary: "전설🔥" };

// ─── 칭호 ───
const TITLES = [
  { id: "first_clear", name: "🐣 초보 탐험가", desc: "첫 스테이지 클리어", check: s => s.totalClears >= 1 },
  { id: "five_clear", name: "⚡ 열공 학생", desc: "5회 클리어", check: s => s.totalClears >= 5 },
  { id: "boss1", name: "🌋 기초 정복자", desc: "Level 1 보스", check: s => s.bossClears?.includes("0-boss") },
  { id: "boss2", name: "⚔️ 중급 전사", desc: "Level 2 보스", check: s => s.bossClears?.includes("1-boss") },
  { id: "boss3", name: "🏆 고급 마스터", desc: "Level 3 보스", check: s => s.bossClears?.includes("2-boss") },
  { id: "revenge", name: "🔥 복수전 영웅", desc: "복수전 10회", check: s => s.revengeCount >= 10 },
  { id: "perfect", name: "💯 퍼펙트", desc: "만점 달성", check: s => s.hasPerfect },
  { id: "gacha10", name: "🎰 뽑기왕", desc: "가챠 10회", check: s => s.gachaCount >= 10 },
  { id: "points500", name: "💰 부자", desc: "누적 500P", check: s => s.totalEarned >= 500 },
  { id: "allboss", name: "👑 동사왕", desc: "모든 보스 클리어", check: s => s.bossClears?.length >= 3 },
];

// ─── Storage ───
const SAVE_KEY = "english-master-save";
const SETTINGS_KEY = "english-master-settings";

const defaultSave = () => ({
  points: 0, totalEarned: 0, totalClears: 0, revengeCount: 0, hasPerfect: false,
  gachaCount: 0, collection: [], requests: [], earnedTitles: [], activeTitle: "",
  bossClears: [], levelUnlocks: ["0"], wrongWords: [], stageScores: {}, freeGacha: 0,
});

const defaultSettings = () => ({
  parentPin: "0000",
  pointRate: 100,       // 포인트 → 원 환산 (100P = rewardUnit원)
  rewardUnit: 1000,     // 기본 교환 단위 (원)
  rewardOptions: [1000, 2000, 3000, 5000],
  gameLinkUrl: "",       // 외부 게임 링크
  gameLinkName: "내 게임",
  maxDailyGacha: 10,
});

const loadData = (key, defaults) => {
  try { const raw = localStorage.getItem(key); if (raw) return { ...defaults(), ...JSON.parse(raw) }; } catch (e) { }
  return defaults();
};
const writeData = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { }
};

/* ═══════════════ QUESTION GENERATORS ═══════════════ */

function genOX(verbs, count = 20) {
  return shuffle(verbs).slice(0, count).map(v => {
    const isCorrect = Math.random() > 0.5;
    const type = Math.random() > 0.5 ? "past" : "pp";
    const label = type === "past" ? "과거형" : "과거분사";
    const correct = v[type];
    const wrong = shuffle(verbs.filter(x => x.base !== v.base))[0]?.[type] || "xxx";
    const shown = isCorrect ? correct : wrong;
    return { type: "ox", statement: `"${v.base}"의 ${label}은 "${shown}"이다`, answer: isCorrect, verb: v };
  });
}

function genChoice(verbs, count = 20) {
  return shuffle(verbs).slice(0, count).map(v => {
    const qType = Math.floor(Math.random() * 3);
    let question, correctAnswer, options;
    if (qType === 0) {
      question = `"${v.base}"의 과거형은?`; correctAnswer = v.past;
      options = shuffle([correctAnswer, ...shuffle(verbs.filter(x => x.past !== v.past)).slice(0, 2).map(x => x.past)]);
    } else if (qType === 1) {
      question = `"${v.base}"의 과거분사는?`; correctAnswer = v.pp;
      options = shuffle([correctAnswer, ...shuffle(verbs.filter(x => x.pp !== v.pp)).slice(0, 2).map(x => x.pp)]);
    } else {
      question = `"${v.kr}"의 영어 원형은?`; correctAnswer = v.base;
      options = shuffle([correctAnswer, ...shuffle(verbs.filter(x => x.base !== v.base)).slice(0, 2).map(x => x.base)]);
    }
    return { type: "choice", question, correctAnswer, options, verb: v };
  });
}

function genMeaningChoice(verbs, count = 20) {
  return shuffle(verbs).slice(0, count).map(v => ({
    type: "meaningChoice", kr: v.kr, correctAnswer: v.base,
    options: shuffle([v.base, ...shuffle(verbs.filter(x => x.base !== v.base)).slice(0, 2).map(x => x.base)]), verb: v,
  }));
}

function genPastFill(verbs, count = 20) {
  return shuffle(verbs).slice(0, count).map(v => ({
    type: "pastFill", prompt: `"${v.base}" (${v.kr})의 과거형을 쓰세요`, answer: v.past, verb: v,
  }));
}

function genPpFill(verbs, count = 20) {
  return shuffle(verbs).slice(0, count).map(v => ({
    type: "ppFill", prompt: `"${v.base}" (${v.kr})의 과거분사를 쓰세요`, answer: v.pp, verb: v,
  }));
}

function genMeaningType(verbs, count = 20) {
  return shuffle(verbs).slice(0, count).map(v => ({
    type: "meaningType", kr: v.kr, past: v.past, pp: v.pp, answer: v.base, verb: v,
  }));
}

function genSentenceFill(count = 20) {
  return shuffle(ALL_SENTENCES).slice(0, Math.min(count, ALL_SENTENCES.length)).map(p => ({
    type: "sentenceFill", sentence: p.sentence, verbHint: p.verb, answer: p.answer, tense: p.tense,
    verb: { base: p.verb, past: p.answer, pp: p.answer, kr: "" },
  }));
}

function genTripleWrite(verbs, count = 20) {
  return shuffle(verbs).slice(0, count).map(v => ({
    type: "tripleWrite", kr: v.kr, base: v.base, past: v.past, pp: v.pp, verb: v,
  }));
}

function generateQuestions(typeStr, verbs, count = 20) {
  const map = { ox: genOX, choice: genChoice, meaningChoice: genMeaningChoice, pastFill: genPastFill, ppFill: genPpFill, meaningType: genMeaningType, sentenceFill: genSentenceFill, tripleWrite: genTripleWrite };
  const fn = map[typeStr];
  if (!fn) return genChoice(verbs, count);
  return typeStr === "sentenceFill" ? fn(count) : fn(verbs, count);
}

function generateBoss(verbs, types, count = 20) {
  const perType = Math.ceil(count / types.filter(t => t !== "cardMatch").length);
  let all = [];
  types.forEach(t => { if (t !== "cardMatch") all.push(...generateQuestions(t, verbs, perType)); });
  return shuffle(all).slice(0, count);
}

const typeNames = { ox: "O/X 퀴즈", choice: "3지선다", meaningChoice: "뜻→원형 선택", pastFill: "과거형 쓰기", ppFill: "과거분사 쓰기", cardMatch: "카드 매칭", meaningType: "뜻→원형 타이핑", sentenceFill: "문장 빈칸", tripleWrite: "3형태 쓰기" };
const typeEmojis = { ox: "⭕", choice: "🔢", meaningChoice: "🇰🇷", pastFill: "✏️", ppFill: "📝", cardMatch: "🃏", meaningType: "⌨️", sentenceFill: "📖", tripleWrite: "🔥" };

/* ═══════════════ QUESTION RENDERER ═══════════════ */
function QuestionRenderer({ q, onAnswer, showHint }) {
  const [input, setInput] = useState("");
  const [inputs, setInputs] = useState({ past: "", pp: "" });
  const inputRef = useRef();
  useEffect(() => { setInput(""); setInputs({ past: "", pp: "" }); inputRef.current?.focus(); }, [q]);

  if (q.type === "ox") return <div>
    <div style={cardS}><div style={{ fontSize: 18, lineHeight: 1.6 }}>{q.statement}</div></div>
    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <button onClick={() => onAnswer(q.answer === true)} style={{ ...btnS, background: G1, flex: 1 }}>⭕ 맞아요</button>
      <button onClick={() => onAnswer(q.answer === false)} style={{ ...btnS, background: G3, flex: 1 }}>❌ 아니에요</button>
    </div>
  </div>;

  if (q.type === "choice" || q.type === "meaningChoice") {
    const question = q.type === "choice" ? q.question : `"${q.kr}"의 영어 원형은?`;
    return <div>
      <div style={cardS}><div style={{ fontSize: 20, color: "#FFE66D" }}>{question}</div></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        {q.options.map((opt, i) => <button key={i} onClick={() => onAnswer(opt === q.correctAnswer, opt)}
          style={{ ...btnS, background: "white", color: "#333", border: "2px solid #E0E0E0", textAlign: "left", padding: "14px 20px" }}>
          {["A", "B", "C"][i]}. {opt}
        </button>)}
      </div>
    </div>;
  }

  if (q.type === "pastFill" || q.type === "ppFill" || q.type === "meaningType") {
    const prompt = q.type === "meaningType" ? q.kr : q.prompt;
    const hint = q.type === "meaningType" ? `과거: ${q.past} / 과거분사: ${q.pp}` : null;
    return <div>
      <div style={cardS}>
        {q.type === "meaningType" && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>이 뜻의 영어 원형은?</div>}
        <div style={{ fontSize: q.type === "meaningType" ? 28 : 18, color: "#FFE66D" }}>{prompt}</div>
        {showHint && hint && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>💡 {hint}</div>}
      </div>
      <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && input.trim()) onAnswer(input.trim().toLowerCase() === q.answer.toLowerCase(), input.trim()); }}
        placeholder="답을 입력하세요 ✏️" style={inpS} />
      <button onClick={() => { if (input.trim()) onAnswer(input.trim().toLowerCase() === q.answer.toLowerCase(), input.trim()); }}
        disabled={!input.trim()} style={{ ...btnS, background: G1, width: "100%", opacity: input.trim() ? 1 : 0.5 }}>확인! ✨</button>
    </div>;
  }

  if (q.type === "sentenceFill") return <div>
    <div style={cardS}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>빈칸에 알맞은 형태를 쓰세요 ({q.tense})</div>
      <div style={{ fontSize: 18, color: "white", lineHeight: 1.8 }}>{q.sentence.replace("___", "______")}</div>
      <div style={{ fontSize: 14, color: "#FFE66D", marginTop: 8 }}>동사: {q.verbHint}</div>
    </div>
    <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter" && input.trim()) onAnswer(input.trim().toLowerCase() === q.answer.toLowerCase(), input.trim()); }}
      placeholder="알맞은 형태를 쓰세요" style={inpS} />
    <button onClick={() => { if (input.trim()) onAnswer(input.trim().toLowerCase() === q.answer.toLowerCase(), input.trim()); }}
      disabled={!input.trim()} style={{ ...btnS, background: G1, width: "100%", opacity: input.trim() ? 1 : 0.5 }}>확인! ✨</button>
  </div>;

  if (q.type === "tripleWrite") {
    const checkAll = () => {
      const ok = input.trim().toLowerCase() === q.base.toLowerCase()
        && inputs.past.trim().toLowerCase() === q.past.toLowerCase()
        && inputs.pp.trim().toLowerCase() === q.pp.toLowerCase();
      onAnswer(ok, { base: input.trim(), past: inputs.past.trim(), pp: inputs.pp.trim() });
    };
    return <div>
      <div style={cardS}><div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>3형태를 모두 쓰세요!</div>
        <div style={{ fontSize: 28, color: "#FFE66D", margin: "8px 0" }}>{q.kr}</div></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="원형" style={inpS} />
        <input value={inputs.past} onChange={e => setInputs(p => ({ ...p, past: e.target.value }))} placeholder="과거형" style={inpS} />
        <input value={inputs.pp} onChange={e => setInputs(p => ({ ...p, pp: e.target.value }))}
          onKeyDown={e => { if (e.key === "Enter") checkAll(); }} placeholder="과거분사" style={inpS} />
      </div>
      <button onClick={checkAll} disabled={!input.trim() || !inputs.past.trim() || !inputs.pp.trim()}
        style={{ ...btnS, background: G1, width: "100%", marginTop: 8, opacity: (input.trim() && inputs.past.trim() && inputs.pp.trim()) ? 1 : 0.5 }}>확인! ✨</button>
    </div>;
  }
  return null;
}

/* ═══════════════ CARD MATCH ═══════════════ */
function CardMatchGame({ pairs, onComplete }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const c = []; pairs.forEach((v, i) => { c.push({ id: i * 2, text: v.kr, matchId: i, type: "kr" }); c.push({ id: i * 2 + 1, text: v.base, matchId: i, type: "en" }); });
    setCards(shuffle(c)); setStarted(true);
  }, []);

  useEffect(() => {
    if (flipped.length === 2) {
      const [a, b] = flipped; const ca = cards.find(c => c.id === a), cb = cards.find(c => c.id === b);
      if (ca && cb && ca.matchId === cb.matchId && ca.type !== cb.type) setTimeout(() => { setMatched(m => [...m, a, b]); setFlipped([]); }, 400);
      else setTimeout(() => setFlipped([]), 700);
      setMoves(m => m + 1);
    }
  }, [flipped]);

  useEffect(() => {
    if (started && matched.length === cards.length && cards.length > 0) {
      setTimeout(() => onComplete(matched.length / 2, cards.length / 2, Math.max(10, 40 - moves)), 500);
    }
  }, [matched]);

  const click = (id) => { if (flipped.length >= 2 || flipped.includes(id) || matched.includes(id)) return; setFlipped(f => [...f, id]); };
  const cc = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#FF8A80", "#82B1FF", "#EA80FC", "#FFD180"];

  return <div>
    <div style={{ textAlign: "center", color: "#FF6B6B", fontSize: 15, marginBottom: 12, fontWeight: "bold" }}>🃏 한글↔영어 매칭! (이동:{moves})</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
      {cards.map(c => {
        const isF = flipped.includes(c.id), isM = matched.includes(c.id); const color = cc[c.matchId % cc.length];
        return <div key={c.id} onClick={() => click(c.id)} style={{
          aspectRatio: "1", background: isM ? color : isF ? "white" : "linear-gradient(135deg,#667eea,#764ba2)",
          border: isM ? `3px solid ${color}` : isF ? "3px solid #667eea" : "3px solid transparent",
          borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, cursor: "pointer", padding: 4, textAlign: "center", wordBreak: "keep-all",
          color: isM ? "white" : isF ? "#333" : "white", fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)", transition: "all 0.3s",
        }}>{(isF || isM) ? c.text : "?"}</div>;
      })}
    </div>
  </div>;
}

/* ═══════════════ QUIZ SESSION ═══════════════ */
function QuizSession({ questions, isBoss, onComplete, isCardMatch, cardPairs }) {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongList, setWrongList] = useState([]);
  const [hintShown, setHintShown] = useState(false);

  if (isCardMatch) return <CardMatchGame pairs={cardPairs} onComplete={(m, t, pts) => onComplete({ score: m, total: t, pts, wrong: [] })} />;

  const q = questions[qIdx];
  if (!q) return null;

  const handleAnswer = (correct, userAnswer) => {
    const answerText = q.answer ?? q.correctAnswer ?? "";
    setFeedback({ correct, answer: answerText });
    if (correct) { setScore(s => s + 1); setCombo(c => c + 1); }
    else { setCombo(0); setWrongList(w => [...w, q.verb || q]); if (!hintShown) setHintShown(true); }
    setTimeout(() => {
      if (qIdx < questions.length - 1) { setQIdx(i => i + 1); setFeedback(null); setHintShown(false); }
      else {
        const finalScore = score + (correct ? 1 : 0);
        onComplete({ score: finalScore, total: questions.length, pts: finalScore * (isBoss ? 8 : 5) + (combo >= 5 ? combo * 2 : 0), wrong: wrongList });
      }
    }, 1200);
  };

  const comboMsg = combo >= 5 ? "🔥 COMBO x" + combo + "!" : combo >= 3 ? "⚡ " + combo + " 연속!" : "";
  const answerText = q.answer ?? q.correctAnswer ?? (q.type === "ox" ? (q.answer ? "⭕" : "❌") : "");

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <button onClick={() => onComplete({ score, total: questions.length, pts: score * 5, wrong: wrongList, cancelled: true })} style={backS}>← 나가기</button>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {isBoss && <span style={{ fontSize: 12, color: "#FF6B6B", fontWeight: "bold" }}>👹 BOSS</span>}
        <span style={{ fontSize: 13, color: "#7E57C2", fontWeight: "bold" }}>{qIdx + 1}/{questions.length}</span>
      </div>
    </div>
    <div style={{ height: 8, background: "#E8EAF6", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ height: "100%", background: isBoss ? "linear-gradient(90deg,#FF6B6B,#FF8E53)" : "linear-gradient(90deg,#4ECDC4,#FFE66D)", width: ((qIdx + 1) / questions.length * 100) + "%", transition: "width 0.4s", borderRadius: 4 }} />
    </div>
    {comboMsg && <div style={{ textAlign: "center", fontSize: 16, color: "#FF6B6B", marginBottom: 8, animation: "bounceIn 0.4s" }}>{comboMsg}</div>}
    {!feedback && <QuestionRenderer q={q} onAnswer={handleAnswer} showHint={hintShown} />}
    {feedback && <div style={{ ...cardS, background: feedback.correct ? "linear-gradient(135deg,#C8E6C9,#81C784)" : "linear-gradient(135deg,#FFCDD2,#EF9A9A)" }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>{feedback.correct ? "🎉" : "😅"}</div>
      <div style={{ fontSize: 20, color: feedback.correct ? "#2E7D32" : "#C62828", fontWeight: "bold" }}>{feedback.correct ? "정답!" : "아쉬워요!"}</div>
      {!feedback.correct && <div style={{ fontSize: 14, color: "#C62828", marginTop: 8 }}>정답: <b>{answerText}</b></div>}
    </div>}
  </div>;
}

/* ═══════════════ SPACE SHOOTER ═══════════════ */
function SpaceShooter({ onBack, addPoints }) {
  const stateRef = useRef({ words: [], score: 0, lives: 3, spawnTimer: 0, gameOver: false, frame: 0 });
  const frameRef = useRef(); const inputRef = useRef();
  const [, forceRender] = useState(0); const [input, setInput] = useState("");
  const [started, setStarted] = useState(false); const [result, setResult] = useState(null);
  const pool = useRef(shuffle(ALL_WORDS.map(v => ({ kr: v.kr, answer: v.base })))); const pIdx = useRef(0);
  const getNext = () => { if (pIdx.current >= pool.current.length) { pool.current = shuffle(ALL_WORDS.map(v => ({ kr: v.kr, answer: v.base }))); pIdx.current = 0; } return pool.current[pIdx.current++]; };

  const start = () => { stateRef.current = { words: [], score: 0, lives: 3, spawnTimer: 0, gameOver: false, frame: 0 }; pIdx.current = 0; pool.current = shuffle(ALL_WORDS.map(v => ({ kr: v.kr, answer: v.base }))); setStarted(true); setResult(null); setInput(""); requestAnimationFrame(loop); };
  const loop = () => {
    const s = stateRef.current; if (s.gameOver) return; s.frame++; s.spawnTimer++;
    if (s.spawnTimer > 100) { const w = getNext(); s.words.push({ id: Math.random(), kr: w.kr, answer: w.answer, x: 10 + Math.random() * 70, y: -5, speed: 0.13 + Math.random() * 0.09 }); s.spawnTimer = 0; }
    s.words = s.words.filter(w => { w.y += w.speed; if (w.y > 92) { s.lives--; if (s.lives <= 0) { s.gameOver = true; const pts = s.score * 3; addPoints(pts); setResult({ score: s.score, pts }); } return false; } return true; });
    forceRender(n => n + 1); if (!s.gameOver) frameRef.current = requestAnimationFrame(loop);
  };
  useEffect(() => () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); }, []);
  const shoot = () => {
    const s = stateRef.current; const val = input.trim().toLowerCase(); if (!val) return;
    const idx = s.words.findIndex(w => w.answer.toLowerCase() === val);
    if (idx !== -1) { s.words.splice(idx, 1); s.score++; if (s.score >= 20 && !s.gameOver) { s.gameOver = true; const pts = s.score * 3 + s.lives * 10; addPoints(pts); setResult({ score: s.score, pts, cleared: true }); if (frameRef.current) cancelAnimationFrame(frameRef.current); } }
    setInput(""); inputRef.current?.focus();
  };
  const s = stateRef.current;

  if (!started || result) return <div style={{ textAlign: "center", padding: "30px 16px" }}>
    <div style={{ fontSize: 64 }}>🚀</div>
    <h2 style={{ color: "#667eea", margin: "12px 0", fontFamily: "'Jua'", fontSize: 24 }}>우주선 슈팅</h2>
    <p style={{ color: "#999", fontSize: 14, lineHeight: 1.6 }}>한글 뜻 → 영어 원형 타이핑!</p>
    {result && <div style={{ margin: "16px 0", padding: 16, background: result.cleared ? "linear-gradient(135deg,#C8E6C9,#A5D6A7)" : "linear-gradient(135deg,#FFCDD2,#EF9A9A)", borderRadius: 16 }}>
      <div style={{ fontSize: 22, color: result.cleared ? "#2E7D32" : "#C62828" }}>{result.cleared ? "🎉 클리어!" : "💥 게임 오버!"}</div>
      <div style={{ fontSize: 14, marginTop: 4 }}>격추: {result.score}개 | +{result.pts}P</div>
    </div>}
    <button onClick={start} style={{ ...btnS, background: G1, margin: "12px 0" }}>{result ? "다시 하기 🔄" : "게임 시작 🚀"}</button>
    <div style={{ marginTop: 8 }}><button onClick={onBack} style={backS}>← 돌아가기</button></div>
  </div>;

  return <div>
    <div style={{ position: "relative", width: "100%", height: 360, background: "linear-gradient(180deg,#1a1a2e,#16213e,#0f3460)", borderRadius: 20, overflow: "hidden", border: "3px solid #e94560" }}>
      <div style={{ position: "absolute", top: 10, left: 12, right: 12, display: "flex", justifyContent: "space-between", fontSize: 14, zIndex: 10, color: "white" }}>
        <span>{"❤️".repeat(Math.max(0, s.lives))}</span><span style={{ color: "#FFE66D", fontWeight: "bold" }}>💥 {s.score}/20</span>
      </div>
      <div style={{ position: "absolute", bottom: 16, left: "calc(50% - 20px)", fontSize: 40, filter: "drop-shadow(0 0 12px #4ECDC4)", zIndex: 5 }}>🚀</div>
      {s.words.map(w => <div key={w.id} style={{ position: "absolute", left: w.x + "%", top: w.y + "%", padding: "8px 14px", background: "rgba(233,69,96,0.85)", borderRadius: 12, fontSize: 14, color: "white", whiteSpace: "nowrap", fontWeight: "bold" }}>{w.kr}</div>)}
    </div>
    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
      <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") shoot(); }} placeholder="영어 원형 입력! 🎯" autoFocus style={{ flex: 1, ...inpS, marginBottom: 0 }} />
      <button onClick={shoot} style={{ padding: "12px 20px", background: "linear-gradient(135deg,#e94560,#FF6B6B)", border: "none", borderRadius: 14, color: "white", fontFamily: "'Jua'", fontSize: 16, cursor: "pointer" }}>발사!</button>
    </div>
  </div>;
}

/* ═══════════════ GACHA ═══════════════ */
function Gacha({ points, freeGacha, spendPoints, useFreeGacha, collection, addToCollection }) {
  const [spinning, setSpinning] = useState(false); const [result, setResult] = useState(null); const COST = 30;
  const canFree = freeGacha > 0; const canPay = points >= COST;
  const pull = (free) => {
    if (spinning) return; if (free && !canFree) return; if (!free && !canPay) return;
    if (!free) spendPoints(COST); else useFreeGacha();
    setSpinning(true); setResult(null);
    setTimeout(() => { const item = getGachaItem(); setResult(item); addToCollection(item); setSpinning(false); }, 1200);
  };
  const grouped = collection.reduce((a, item) => { a[item.name] = a[item.name] || { item, count: 0 }; a[item.name].count++; return a; }, {});
  return <div style={{ textAlign: "center", padding: 16 }}>
    <h2 style={{ color: "#AB47BC", fontFamily: "'Jua'", fontSize: 22 }}>🎰 가챠 뽑기</h2>
    <div style={{ width: 160, height: 160, margin: "16px auto", background: "linear-gradient(135deg,#FFE0B2,#FFB74D)", borderRadius: "50%", border: "4px solid #FF9800", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, animation: spinning ? "gachaSpin 1s ease-out" : "none", boxShadow: "0 8px 30px rgba(255,152,0,0.3)" }}>
      {result ? <div style={{ animation: "popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)" }}>{result.name.split(" ")[0]}</div> : spinning ? "✨" : "🎰"}
    </div>
    {result && <div style={{ animation: "fadeIn 0.5s", marginBottom: 12 }}>
      <div style={{ color: RC[result.rarity], fontSize: 13, fontWeight: "bold", letterSpacing: 2 }}>── {RL[result.rarity]} ──</div>
      <div style={{ fontSize: 18, color: "#FF6F00", fontWeight: "bold" }}>{result.name}</div>
      <div style={{ fontSize: 13, color: "#4CAF50", marginTop: 2 }}>+{result.points}P 🎉</div>
    </div>}
    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
      {canFree && <button onClick={() => pull(true)} disabled={spinning} style={{ ...btnS, background: "linear-gradient(135deg,#FFD700,#FF9800)", fontSize: 14, padding: "12px 20px" }}>무료 뽑기! ({freeGacha}회) 🎁</button>}
      <button onClick={() => pull(false)} disabled={!canPay || spinning} style={{ ...btnS, background: "linear-gradient(135deg,#AB47BC,#CE93D8)", fontSize: 14, padding: "12px 20px", opacity: canPay ? 1 : 0.4 }}>{spinning ? "뽑는 중..." : `뽑기 (${COST}P)`}</button>
    </div>
    {collection.length > 0 && <>
      <div style={{ fontSize: 15, color: "#667eea", margin: "20px 0 10px", fontWeight: "bold" }}>📦 컬렉션 ({collection.length})</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
        {Object.entries(grouped).map(([name, { item, count }]) => <div key={name} style={{ background: "white", borderRadius: 12, padding: 8, border: `2px solid ${RC[item.rarity]}`, fontSize: 11 }}>
          <div style={{ fontSize: 24 }}>{name.split(" ")[0]}</div>
          <div style={{ color: "#666", fontSize: 10 }}>{name.split(" ").slice(1).join(" ")}</div>
          <div style={{ color: "#FF9800", fontWeight: "bold" }}>x{count}</div>
        </div>)}
      </div>
    </>}
  </div>;
}

/* ═══════════════ STUDY MODE ═══════════════ */
function StudyMode({ verbs, onBack, title }) {
  const [show, setShow] = useState({});
  return <div>
    <button onClick={onBack} style={{ ...backS, marginBottom: 12 }}>← 돌아가기</button>
    <div style={{ textAlign: "center", marginBottom: 16 }}><div style={{ fontSize: 28 }}>📖</div>
      <h2 style={{ color: "#667eea", fontSize: 18 }}>{title}</h2>
      <p style={{ color: "#999", fontSize: 12 }}>터치하면 답이 보여요!</p></div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {verbs.map((v, i) => <div key={i} onClick={() => setShow(p => ({ ...p, [i]: !p[i] }))} style={{
        background: show[i] ? "linear-gradient(135deg,#E8EAF6,#C5CAE9)" : "white",
        borderRadius: 12, padding: "12px 16px", border: show[i] ? "2px solid #7E57C2" : "2px solid #E8EAF6", cursor: "pointer",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: "bold" }}>{v.kr}</span>
          {show[i] ? <span style={{ color: "#667eea", fontWeight: "bold" }}>{v.base}</span> : <span style={{ color: "#ccc", fontSize: 12 }}>👆</span>}
        </div>
        {show[i] && <div style={{ marginTop: 6, fontSize: 12, color: "#7E57C2" }}>과거: <b>{v.past}</b> / 과거분사: <b>{v.pp}</b></div>}
      </div>)}
    </div>
  </div>;
}

/* ═══════════════ PARENT SETTINGS ═══════════════ */
function ParentSettings({ settings, onSave, onBack }) {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [form, setForm] = useState({ ...settings });

  const handleAuth = () => { if (pin === settings.parentPin) setAuthed(true); else alert("비밀번호가 틀렸어요!"); };

  if (!authed) return <div style={{ textAlign: "center", padding: "40px 16px" }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
    <h2 style={{ color: "#667eea", fontSize: 20, marginBottom: 16 }}>부모님 설정</h2>
    <p style={{ color: "#999", fontSize: 13, marginBottom: 16 }}>설정을 변경하려면 비밀번호를 입력하세요</p>
    <input value={pin} onChange={e => setPin(e.target.value)} type="password" maxLength={8}
      onKeyDown={e => { if (e.key === "Enter") handleAuth(); }}
      placeholder="비밀번호 (기본: 0000)" style={{ ...inpS, maxWidth: 200, margin: "0 auto 12px" }} />
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      <button onClick={handleAuth} style={{ ...btnS, background: G1 }}>확인</button>
      <button onClick={onBack} style={backS}>취소</button>
    </div>
  </div>;

  return <div>
    <button onClick={onBack} style={{ ...backS, marginBottom: 16 }}>← 돌아가기</button>
    <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 36 }}>⚙️</div>
      <h2 style={{ color: "#667eea", fontSize: 20 }}>부모님 설정</h2></div>

    <div style={{ background: "white", borderRadius: 16, padding: 20, border: "2px solid #E8EAF6", marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: "bold", color: "#667eea", marginBottom: 12 }}>🔐 비밀번호 변경</div>
      <input value={form.parentPin} onChange={e => setForm(f => ({ ...f, parentPin: e.target.value }))}
        placeholder="새 비밀번호" maxLength={8} style={{ ...inpS, textAlign: "left" }} />
    </div>

    <div style={{ background: "white", borderRadius: 16, padding: 20, border: "2px solid #E8EAF6", marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: "bold", color: "#667eea", marginBottom: 12 }}>💰 보상 설정</div>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>포인트 → 용돈 환산 비율</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input type="number" value={form.pointRate} onChange={e => setForm(f => ({ ...f, pointRate: parseInt(e.target.value) || 100 }))}
          style={{ ...inpS, width: 80, marginBottom: 0 }} />
        <span style={{ fontSize: 14, color: "#333" }}>P = </span>
        <input type="number" value={form.rewardUnit} onChange={e => setForm(f => ({ ...f, rewardUnit: parseInt(e.target.value) || 1000 }))}
          style={{ ...inpS, width: 100, marginBottom: 0 }} />
        <span style={{ fontSize: 14, color: "#333" }}>원</span>
      </div>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>용돈 요청 금액 옵션 (쉼표로 구분, 원)</div>
      <input value={form.rewardOptions.join(",")} onChange={e => setForm(f => ({ ...f, rewardOptions: e.target.value.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v)) }))}
        placeholder="1000,2000,3000,5000" style={{ ...inpS, textAlign: "left" }} />
    </div>

    <div style={{ background: "white", borderRadius: 16, padding: 20, border: "2px solid #E8EAF6", marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: "bold", color: "#667eea", marginBottom: 12 }}>🎮 외부 게임 링크</div>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>게임 사이트 URL (비워두면 버튼 숨김)</div>
      <input value={form.gameLinkUrl} onChange={e => setForm(f => ({ ...f, gameLinkUrl: e.target.value }))}
        placeholder="https://my-game-site.com" style={{ ...inpS, textAlign: "left" }} />
      <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>게임 이름</div>
      <input value={form.gameLinkName} onChange={e => setForm(f => ({ ...f, gameLinkName: e.target.value }))}
        placeholder="내 게임" style={{ ...inpS, textAlign: "left" }} />
    </div>

    <button onClick={() => { onSave(form); onBack(); }} style={{ ...btnS, background: G1, width: "100%" }}>저장하기 💾</button>
  </div>;
}

/* ═══════════════ SHARED STYLES ═══════════════ */
const G1 = "linear-gradient(135deg,#FF6B6B,#FF8E53)";
const G3 = "linear-gradient(135deg,#667eea,#764ba2)";
const cardS = { background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: 20, padding: "24px 20px", textAlign: "center", marginBottom: 12, boxShadow: "0 6px 20px rgba(102,126,234,0.25)", color: "white" };
const inpS = { width: "100%", padding: "13px 18px", background: "white", border: "3px solid #E0E0E0", borderRadius: 14, color: "#333", fontFamily: "'Jua'", fontSize: 18, textAlign: "center", outline: "none", marginBottom: 10 };
const btnS = { padding: "14px 24px", border: "none", borderRadius: 16, color: "white", fontFamily: "'Jua'", fontSize: 16, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" };
const backS = { background: "white", border: "2px solid #E0E0E0", color: "#777", padding: "8px 16px", borderRadius: 12, fontFamily: "'Jua'", fontSize: 13, cursor: "pointer" };

/* ═══════════════ MAIN APP ═══════════════ */
export default function App() {
  const [save, setSave] = useState(defaultSave());
  const [settings, setSettings] = useState(defaultSettings());
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("world");
  const [screen, setScreen] = useState("worldMap");
  const [selChapter, setSelChapter] = useState(0);
  const [selLevel, setSelLevel] = useState(0);
  const [selStage, setSelStage] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    const s = loadData(SAVE_KEY, defaultSave);
    const st = loadData(SETTINGS_KEY, defaultSettings);
    setSave(s); setSettings(st); setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) writeData(SAVE_KEY, save); }, [save, loaded]);
  useEffect(() => { if (loaded) writeData(SETTINGS_KEY, settings); }, [settings, loaded]);

  const update = (fn) => setSave(prev => { const next = { ...prev }; fn(next); return next; });
  const addPoints = (pts) => update(s => { s.points += pts; s.totalEarned += pts; });
  const spendPoints = (pts) => update(s => { s.points = Math.max(0, s.points - pts); });

  // Title check
  useEffect(() => {
    if (!loaded) return;
    const newT = TITLES.filter(t => t.check(save) && !save.earnedTitles.includes(t.id)).map(t => t.id);
    if (newT.length > 0) update(s => { s.earnedTitles = [...s.earnedTitles, ...newT]; if (!s.activeTitle) s.activeTitle = newT[0]; });
  }, [save.totalClears, save.bossClears, save.revengeCount, save.hasPerfect, save.gachaCount, save.totalEarned, loaded]);

  const chapter = CHAPTERS_DATA[selChapter];
  const levelData = chapter?.levels?.[selLevel];
  const isLevelUnlocked = (idx) => idx === 0 || save.bossClears?.includes(`${idx - 1}-boss`);
  const goWorld = () => { setScreen("worldMap"); setTab("world"); setQuizResult(null); };

  const startStage = (typeStr) => { setSelStage(typeStr); setScreen(typeStr === "boss" ? "boss" : "stage"); };

  const handleQuizDone = (result, isBoss) => {
    if (result.cancelled) { setScreen("chapterInside"); return; }
    const passed = isBoss ? result.score >= Math.ceil(result.total * 0.7) : true;
    update(s => {
      s.totalClears++;
      if (result.score === result.total) s.hasPerfect = true;
      if (result.wrong?.length > 0) { const ex = s.wrongWords.map(w => w.base); result.wrong.forEach(w => { if (w?.base && !ex.includes(w.base)) s.wrongWords.push(w); }); }
      if (isBoss && passed && !s.bossClears.includes(`${selLevel}-boss`)) {
        s.bossClears.push(`${selLevel}-boss`); s.freeGacha += 3;
        if (!s.levelUnlocks.includes(String(selLevel + 1))) s.levelUnlocks.push(String(selLevel + 1));
      }
      if (!isBoss) { const key = `${selChapter}-${selLevel}-${selStage}`; s.stageScores[key] = Math.max(s.stageScores[key] || 0, result.score); }
    });
    addPoints(result.pts);
    setQuizResult({ ...result, isBoss, passed });
    setScreen("result");
  };

  const activeTitle = TITLES.find(t => t.id === save.activeTitle);
  if (!loaded) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F5F0FF", fontFamily: "'Jua'", fontSize: 20, color: "#667eea" }}>로딩중... ✨</div>;

  return <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Jua&family=Gaegu:wght@700&display=swap');
      *{margin:0;padding:0;box-sizing:border-box;}
      body{background:#F5F0FF;font-family:'Jua',sans-serif;color:#333;-webkit-tap-highlight-color:transparent;}
      @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
      @keyframes gachaSpin{0%{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(0.8)}100%{transform:rotate(360deg) scale(1)}}
      @keyframes popIn{0%{transform:scale(0)}100%{transform:scale(1)}}
      @keyframes bounceIn{0%{transform:scale(0.5);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
      @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      input::placeholder{color:#bbb;}
    `}</style>
    <div style={{ maxWidth: 500, margin: "0 auto", minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{ background: G3, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(102,126,234,0.3)" }}>
        <div onClick={goWorld} style={{ cursor: "pointer" }}>
          <h1 style={{ fontFamily: "'Gaegu'", fontSize: 22, color: "white" }}>🚀 English Master</h1>
          {activeTitle && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{activeTitle.name}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "linear-gradient(135deg,#FFD700,#FF9800)", color: "#5D4037", padding: "6px 14px", borderRadius: 20, fontSize: 14, fontWeight: "bold", animation: "pulse 2s infinite" }}>⭐ {save.points}P</div>
          <button onClick={() => { setTab("settings"); setScreen("parentSettings"); }}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "6px 10px", fontSize: 14, cursor: "pointer" }}>⚙️</button>
        </div>
      </div>

      {/* NAV */}
      <div style={{ display: "flex", background: "white", borderBottom: "2px solid #E8EAF6", position: "sticky", top: 56, zIndex: 99 }}>
        {[{ key: "world", label: "🗺️ 월드맵" }, { key: "games", label: "🎮 게임" }, { key: "rewards", label: "🎁 보상" }, { key: "record", label: "📊 기록" }].map(t =>
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key === "world") goWorld(); else if (t.key === "games") setScreen("gameSelect"); else if (t.key === "rewards") setScreen("rewards"); else setScreen("record"); }}
            style={{ flex: 1, padding: "11px 4px", background: tab === t.key ? "#F3E5F5" : "white", border: "none", borderBottom: tab === t.key ? "3px solid #7E57C2" : "3px solid transparent", color: tab === t.key ? "#7E57C2" : "#aaa", fontFamily: "'Jua'", fontSize: 12, cursor: "pointer", fontWeight: "bold" }}>
            {t.label}</button>)}
      </div>

      {/* CONTENT */}
      <div style={{ padding: 16, minHeight: "calc(100vh - 110px)" }}>

        {/* WORLD MAP */}
        {screen === "worldMap" && <>
          <div style={{ textAlign: "center", margin: "12px 0 16px" }}><div style={{ fontSize: 28 }}>🗺️</div>
            <h2 style={{ color: "#667eea", fontSize: 20 }}>모험의 세계</h2></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {CHAPTERS_DATA.map((ch, idx) => {
              const isLocked = ch.locked;
              const [c1, c2] = ch.colors || ["#ccc", "#999"];
              return <div key={ch.id} onClick={() => { if (!isLocked) { setSelChapter(idx); setScreen("chapterInside"); } }}
                style={{ background: isLocked ? "#E0E0E0" : `linear-gradient(135deg,${c1},${c2})`, borderRadius: 20, padding: "22px 14px", textAlign: "center", cursor: isLocked ? "default" : "pointer", opacity: isLocked ? 0.5 : 1, boxShadow: isLocked ? "none" : `0 6px 20px ${c1}40`, animation: isLocked ? "none" : `float 3s ${idx * 0.3}s ease-in-out infinite` }}>
                <div style={{ fontSize: 40, marginBottom: 4 }}>{isLocked ? "🔒" : ch.emoji}</div>
                <div style={{ fontSize: 15, color: "white", fontWeight: "bold" }}>{ch.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{isLocked ? "준비중..." : ch.desc}</div>
              </div>;
            })}
          </div>
        </>}

        {/* CHAPTER INSIDE */}
        {screen === "chapterInside" && chapter && !chapter.locked && <>
          <button onClick={goWorld} style={{ ...backS, marginBottom: 12 }}>← 월드맵</button>
          <div style={{ textAlign: "center", margin: "8px 0 16px" }}>
            <div style={{ fontSize: 40 }}>{chapter.emoji}</div>
            <h2 style={{ color: chapter.colors[0], fontSize: 20 }}>{chapter.name}</h2>
          </div>
          <button onClick={() => setScreen("studySelect")} style={{ width: "100%", padding: 14, background: "white", border: "2px solid #7E57C2", borderRadius: 16, color: "#7E57C2", fontFamily: "'Jua'", fontSize: 15, cursor: "pointer", marginBottom: 16 }}>📖 단어 미리 공부하기</button>
          {chapter.levels.map((lvl, lIdx) => {
            const unlocked = isLevelUnlocked(lIdx);
            const bossCleared = save.bossClears?.includes(`${lIdx}-boss`);
            return <div key={lIdx} style={{ marginBottom: 16, opacity: unlocked ? 1 : 0.4 }}>
              <div style={{ fontSize: 16, fontWeight: "bold", color: unlocked ? chapter.colors[0] : "#999", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                {lvl.emoji} Level {lIdx + 1} — {lvl.name}
                {bossCleared && <span style={{ fontSize: 12, color: "#4CAF50" }}>✅</span>}
                {!unlocked && <span style={{ fontSize: 11, color: "#999" }}>(보스 클리어 필요)</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {lvl.types.map(t => {
                  const best = save.stageScores[`${selChapter}-${lIdx}-${t}`] || 0;
                  return <button key={t} disabled={!unlocked} onClick={() => { setSelLevel(lIdx); startStage(t); }}
                    style={{ padding: "14px 10px", background: "white", border: "2px solid #E0E0E0", borderRadius: 14, fontFamily: "'Jua'", fontSize: 13, cursor: unlocked ? "pointer" : "default", textAlign: "center" }}>
                    <div style={{ fontSize: 24 }}>{typeEmojis[t]}</div>
                    <div style={{ marginTop: 4 }}>{typeNames[t]}</div>
                    {best > 0 && <div style={{ fontSize: 11, color: "#FF9800", marginTop: 2 }}>최고: {best}/20</div>}
                  </button>;
                })}
                <button disabled={!unlocked} onClick={() => { setSelLevel(lIdx); startStage("boss"); }}
                  style={{ padding: "14px 10px", background: bossCleared ? "linear-gradient(135deg,#C8E6C9,#A5D6A7)" : "linear-gradient(135deg,#FFCDD2,#EF9A9A)", border: `3px solid ${bossCleared ? "#66BB6A" : "#EF5350"}`, borderRadius: 14, fontFamily: "'Jua'", fontSize: 13, cursor: unlocked ? "pointer" : "default", textAlign: "center", color: bossCleared ? "#2E7D32" : "#C62828" }}>
                  <div style={{ fontSize: 24 }}>👹</div><div style={{ marginTop: 4 }}>보스전!</div>
                </button>
              </div>
            </div>;
          })}
          {save.wrongWords.length > 0 && <button onClick={() => setScreen("revenge")}
            style={{ width: "100%", padding: 14, background: G1, border: "none", borderRadius: 16, color: "white", fontFamily: "'Jua'", fontSize: 15, cursor: "pointer", marginTop: 8 }}>
            🔥 복수전! (틀린 {save.wrongWords.length}개) — 2배 포인트!
          </button>}
        </>}

        {/* STUDY SELECT / VIEW */}
        {screen === "studySelect" && chapter && <>
          <button onClick={() => setScreen("chapterInside")} style={{ ...backS, marginBottom: 12 }}>← 돌아가기</button>
          <div style={{ textAlign: "center", marginBottom: 12 }}><div style={{ fontSize: 28 }}>📖</div><h2 style={{ color: "#667eea", fontSize: 18 }}>어떤 레벨?</h2></div>
          {chapter.levels.map((lvl, i) => <button key={i} onClick={() => { setSelLevel(i); setScreen("studyView"); }}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "white", border: `2px solid ${chapter.colors[0]}`, borderRadius: 16, fontFamily: "'Jua'", fontSize: 15, cursor: "pointer", textAlign: "left", width: "100%", marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>{lvl.emoji}</span>
            <div><div style={{ color: chapter.colors[0], fontWeight: "bold" }}>Level {i + 1} — {lvl.name}</div><div style={{ fontSize: 12, color: "#999" }}>{lvl.data.length}단어</div></div>
          </button>)}
        </>}
        {screen === "studyView" && levelData && <StudyMode verbs={levelData.data} onBack={() => setScreen("studySelect")} title={`Level ${selLevel + 1} — ${levelData.name}`} />}

        {/* STAGE */}
        {screen === "stage" && levelData && (() => {
          if (selStage === "cardMatch") return <div><button onClick={() => setScreen("chapterInside")} style={{ ...backS, marginBottom: 12 }}>← 돌아가기</button>
            <CardMatchGame pairs={pick(levelData.data, 8)} onComplete={(m, t, pts) => handleQuizDone({ score: m, total: t, pts, wrong: [] }, false)} /></div>;
          return <QuizSession questions={generateQuestions(selStage, levelData.data, 20)} onComplete={(r) => handleQuizDone(r, false)} />;
        })()}

        {/* BOSS */}
        {screen === "boss" && levelData && <QuizSession questions={generateBoss(levelData.data, levelData.types, 20)} isBoss onComplete={(r) => handleQuizDone(r, true)} />}

        {/* REVENGE */}
        {screen === "revenge" && (() => {
          const w = save.wrongWords.slice(0, 20); if (!w.length) return <div style={{ textAlign: "center", padding: 30 }}><p>틀린 단어 없음! 🎉</p><button onClick={() => setScreen("chapterInside")} style={backS}>돌아가기</button></div>;
          return <QuizSession questions={shuffle([...genPastFill(w, 10), ...genPpFill(w, 10)]).slice(0, 20)} onComplete={(r) => {
            if (r.cancelled) { setScreen("chapterInside"); return; }
            const dbl = r.pts * 2; addPoints(dbl);
            update(s => { s.revengeCount++; const ok = w.filter((_, i) => i < r.score).map(q => q.base).filter(Boolean); s.wrongWords = s.wrongWords.filter(x => !ok.includes(x.base)); });
            setQuizResult({ ...r, pts: dbl, isRevenge: true }); setScreen("result");
          }} />;
        })()}

        {/* RESULT */}
        {screen === "result" && quizResult && <div style={{ textAlign: "center", padding: "24px 16px", animation: "fadeIn 0.5s" }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{quizResult.isBoss ? (quizResult.passed ? "👹🏆" : "👹💀") : quizResult.isRevenge ? "🔥" : quizResult.score >= 18 ? "🏆" : "😊"}</div>
          <div style={{ fontSize: 56, color: "#FF6B6B", fontFamily: "'Gaegu'", fontWeight: "bold" }}>{quizResult.score}/{quizResult.total}</div>
          <div style={{ fontSize: 32, letterSpacing: 8, margin: "8px 0" }}>{quizResult.score >= 18 ? "⭐⭐⭐" : quizResult.score >= 14 ? "⭐⭐" : quizResult.score >= 10 ? "⭐" : ""}</div>
          {quizResult.isBoss && <div style={{ fontSize: 18, color: quizResult.passed ? "#4CAF50" : "#EF5350", fontWeight: "bold" }}>{quizResult.passed ? "🎉 보스 클리어! +가챠 3회!" : "70% 이상이면 통과!"}</div>}
          {quizResult.isRevenge && <div style={{ fontSize: 16, color: "#FF6B6B", fontWeight: "bold" }}>🔥 복수전 2배!</div>}
          <div style={{ color: "#FF9800", fontSize: 20, margin: "8px 0", fontWeight: "bold" }}>+{quizResult.pts}P ⭐</div>
          <button onClick={() => setScreen("chapterInside")} style={{ ...btnS, background: G1, marginTop: 16 }}>돌아가기 🏠</button>
        </div>}

        {/* GAMES */}
        {screen === "gameSelect" && <>
          <div style={{ textAlign: "center", margin: "12px 0 16px" }}><div style={{ fontSize: 28 }}>🎮</div><h2 style={{ color: "#667eea", fontSize: 20 }}>미니게임</h2></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => setScreen("shooter")} style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, background: G3, border: "none", borderRadius: 20, cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 44 }}>🚀</span><div><div style={{ fontSize: 18, color: "white", fontWeight: "bold" }}>우주선 슈팅</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>한글 → 영어 타이핑 격추!</div></div>
            </button>
            <button onClick={() => setScreen("gacha")} style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, background: "linear-gradient(135deg,#AB47BC,#CE93D8)", border: "none", borderRadius: 20, cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 44 }}>🎰</span><div><div style={{ fontSize: 18, color: "white", fontWeight: "bold" }}>가챠 뽑기</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>30P로 아이템 뽑기!</div></div>
            </button>
            {/* 외부 게임 링크 */}
            {settings.gameLinkUrl && <a href={settings.gameLinkUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, background: "linear-gradient(135deg,#4ECDC4,#44A08D)", border: "none", borderRadius: 20, cursor: "pointer", textAlign: "left", textDecoration: "none" }}>
              <span style={{ fontSize: 44 }}>🌐</span><div><div style={{ fontSize: 18, color: "white", fontWeight: "bold" }}>{settings.gameLinkName}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>외부 게임사이트로 이동!</div></div>
            </a>}
          </div>
        </>}
        {screen === "shooter" && <><button onClick={() => setScreen("gameSelect")} style={{ ...backS, marginBottom: 12 }}>← 게임 목록</button><SpaceShooter onBack={() => setScreen("gameSelect")} addPoints={addPoints} /></>}
        {screen === "gacha" && <><button onClick={() => setScreen("gameSelect")} style={{ ...backS, marginBottom: 12 }}>← 게임 목록</button>
          <Gacha points={save.points} freeGacha={save.freeGacha} spendPoints={spendPoints}
            useFreeGacha={() => update(s => { s.freeGacha = Math.max(0, s.freeGacha - 1); })}
            collection={save.collection}
            addToCollection={(item) => update(s => { s.collection.push(item); s.points += item.points; s.totalEarned += item.points; s.gachaCount++; })} />
        </>}

        {/* REWARDS */}
        {screen === "rewards" && <>
          <div style={{ textAlign: "center", margin: "12px 0 16px" }}><div style={{ fontSize: 28 }}>🎁</div><h2 style={{ color: "#667eea", fontSize: 20 }}>보상 & 용돈</h2></div>
          <div style={{ background: "linear-gradient(135deg,#FFE0B2,#FFCC80)", borderRadius: 20, padding: 20, textAlign: "center", border: "3px solid #FF9800" }}>
            <div style={{ fontSize: 14, color: "#795548" }}>내 포인트</div>
            <div style={{ fontSize: 36, color: "#E65100", fontFamily: "'Gaegu'", fontWeight: "bold" }}>💰 {save.points}P</div>
            <div style={{ fontSize: 13, color: "#8D6E63" }}>{settings.pointRate}P = {settings.rewardUnit.toLocaleString()}원</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", margin: "16px 0" }}>
              {settings.rewardOptions.map(v => {
                const cost = (v / settings.rewardUnit) * settings.pointRate;
                const canAfford = save.points >= cost;
                return <button key={v} onClick={() => { if (canAfford) { spendPoints(cost); update(s => { s.requests.push({ date: new Date().toLocaleDateString("ko-KR"), amount: v, status: "pending" }); }); } }}
                  disabled={!canAfford} style={{ padding: "10px 16px", background: canAfford ? "#FF9800" : "#E0E0E0", border: "none", borderRadius: 12, color: canAfford ? "white" : "#999", fontFamily: "'Jua'", fontSize: 14, cursor: canAfford ? "pointer" : "default" }}>
                  {v.toLocaleString()}원</button>;
              })}
            </div>
          </div>
          {save.requests.length > 0 && <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 15, color: "#667eea", fontWeight: "bold", marginBottom: 8 }}>📋 요청 기록</div>
            {save.requests.map((r, i) => <div key={i} style={{ background: "white", borderRadius: 12, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", fontSize: 13, border: "2px solid #E8EAF6" }}>
              <span>{r.date}</span><span style={{ color: "#E65100", fontWeight: "bold" }}>{r.amount.toLocaleString()}원</span><span style={{ color: "#FF9800" }}>⏳</span>
            </div>)}
          </div>}
        </>}

        {/* RECORD */}
        {screen === "record" && <>
          <div style={{ textAlign: "center", margin: "12px 0 16px" }}><div style={{ fontSize: 28 }}>📊</div><h2 style={{ color: "#667eea", fontSize: 20 }}>내 기록</h2></div>
          <div style={{ fontSize: 15, color: "#667eea", fontWeight: "bold", marginBottom: 8 }}>🏅 칭호 ({save.earnedTitles.length}/{TITLES.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {TITLES.map(t => { const earned = save.earnedTitles.includes(t.id); const isActive = save.activeTitle === t.id;
              return <div key={t.id} onClick={() => { if (earned) update(s => { s.activeTitle = t.id; }); }}
                style={{ background: earned ? (isActive ? "linear-gradient(135deg,#FFE0B2,#FFCC80)" : "white") : "#F5F5F5", border: isActive ? "2px solid #FF9800" : "2px solid #EEEEEE", borderRadius: 12, padding: "10px 12px", cursor: earned ? "pointer" : "default", opacity: earned ? 1 : 0.4 }}>
                <div style={{ fontSize: 14, fontWeight: "bold" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "#999" }}>{t.desc}</div>
                {isActive && <div style={{ fontSize: 10, color: "#FF9800", marginTop: 2 }}>✅ 장착중</div>}
              </div>;
            })}
          </div>
          <div style={{ fontSize: 15, color: "#667eea", fontWeight: "bold", marginBottom: 8 }}>📈 통계</div>
          <div style={{ background: "white", borderRadius: 14, padding: 16, border: "2px solid #E8EAF6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
            <div>누적 포인트: <b style={{ color: "#FF9800" }}>{save.totalEarned}P</b></div>
            <div>클리어: <b style={{ color: "#4CAF50" }}>{save.totalClears}회</b></div>
            <div>보스: <b style={{ color: "#EF5350" }}>{save.bossClears.length}/3</b></div>
            <div>복수전: <b style={{ color: "#FF6B6B" }}>{save.revengeCount}회</b></div>
            <div>가챠: <b style={{ color: "#AB47BC" }}>{save.gachaCount}회</b></div>
            <div>틀린 단어: <b style={{ color: "#FF9800" }}>{save.wrongWords.length}개</b></div>
          </div>
          {save.wrongWords.length > 0 && <>
            <div style={{ fontSize: 15, color: "#FF6B6B", fontWeight: "bold", margin: "16px 0 8px" }}>❌ 틀린 단어</div>
            <div style={{ background: "white", borderRadius: 14, padding: 12, border: "2px solid #FFCDD2", maxHeight: 200, overflowY: "auto" }}>
              {save.wrongWords.map((w, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #F5F5F5", fontSize: 13 }}>
                <span style={{ color: "#667eea" }}>{w.base}</span><span style={{ color: "#999" }}>{w.past}/{w.pp}</span><span>{w.kr}</span>
              </div>)}
            </div>
          </>}
        </>}

        {/* PARENT SETTINGS */}
        {screen === "parentSettings" && <ParentSettings settings={settings} onSave={(s) => setSettings(s)} onBack={goWorld} />}
      </div>
    </div>
  </>;
}

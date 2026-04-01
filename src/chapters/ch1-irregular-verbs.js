/**
 * 📕 챕터 1: 불규칙동사
 * 
 * 새 챕터를 추가하려면 이 파일을 복사해서 수정하세요.
 * 파일명: ch2-영단어.js, ch3-문장패턴.js 등
 * 
 * 필수 export: default object with:
 *   id: string (고유 ID)
 *   name: string (챕터 이름)
 *   emoji: string (이모지)
 *   colors: [string, string] (그라데이션 색상)
 *   desc: string (설명)
 *   levels: array (레벨 정의)
 *     - name: string
 *     - emoji: string
 *     - data: array (단어/문제 데이터)
 *     - types: array (문제 유형 문자열)
 *   sentences?: array (문장 빈칸 문제, 선택사항)
 * 
 * 사용 가능한 문제 유형(types):
 *   "ox"            - O/X 퀴즈 (과거형/과거분사 맞는지 판별)
 *   "choice"        - 3지선다 (과거형/과거분사/원형 고르기)
 *   "meaningChoice" - 뜻→원형 3지선다
 *   "pastFill"      - 과거형 타이핑
 *   "ppFill"        - 과거분사 타이핑
 *   "meaningType"   - 뜻→원형 타이핑
 *   "sentenceFill"  - 문장 빈칸 채우기 (sentences 배열 필요)
 *   "tripleWrite"   - 원형+과거+과거분사 3개 연속 타이핑
 *   "cardMatch"     - 한글↔영어 카드 매칭
 * 
 * 단어 데이터 형식:
 *   { base: "원형", past: "과거형", pp: "과거분사", kr: "한글 뜻" }
 * 
 * 문장 데이터 형식:
 *   { sentence: "I have ___ a letter.", verb: "write", answer: "written", tense: "현재완료" }
 */

// ─── A-A-A형 (원형=과거=과거분사) ───
const AAA = [
  { base: "cost", past: "cost", pp: "cost", kr: "비용이 들다" },
  { base: "cast", past: "cast", pp: "cast", kr: "던지다" },
  { base: "cut", past: "cut", pp: "cut", kr: "자르다" },
  { base: "hit", past: "hit", pp: "hit", kr: "치다" },
  { base: "hurt", past: "hurt", pp: "hurt", kr: "다치게 하다" },
  { base: "let", past: "let", pp: "let", kr: "허락하다" },
  { base: "put", past: "put", pp: "put", kr: "놓다, 두다" },
  { base: "quit", past: "quit", pp: "quit", kr: "그만두다" },
  { base: "read", past: "read", pp: "read", kr: "읽다" },
  { base: "set", past: "set", pp: "set", kr: "정하다" },
  { base: "shut", past: "shut", pp: "shut", kr: "닫다" },
  { base: "spread", past: "spread", pp: "spread", kr: "퍼지다" },
  { base: "burst", past: "burst", pp: "burst", kr: "터지다" },
  { base: "split", past: "split", pp: "split", kr: "쪼개다" },
  { base: "shed", past: "shed", pp: "shed", kr: "흘리다" },
];

// ─── A-B-B형 (과거=과거분사) ───
const ABB = [
  { base: "hear", past: "heard", pp: "heard", kr: "듣다" },
  { base: "hold", past: "held", pp: "held", kr: "잡다" },
  { base: "keep", past: "kept", pp: "kept", kr: "지키다" },
  { base: "lay", past: "laid", pp: "laid", kr: "알을 낳다" },
  { base: "lend", past: "lent", pp: "lent", kr: "빌려주다" },
  { base: "lead", past: "led", pp: "led", kr: "이끌다" },
  { base: "lose", past: "lost", pp: "lost", kr: "잃다" },
  { base: "meet", past: "met", pp: "met", kr: "만나다" },
  { base: "mean", past: "meant", pp: "meant", kr: "의미하다" },
  { base: "make", past: "made", pp: "made", kr: "만들다" },
  { base: "pay", past: "paid", pp: "paid", kr: "지불하다" },
  { base: "say", past: "said", pp: "said", kr: "말하다" },
  { base: "sell", past: "sold", pp: "sold", kr: "팔다" },
  { base: "send", past: "sent", pp: "sent", kr: "보내다" },
  { base: "sleep", past: "slept", pp: "slept", kr: "자다" },
  { base: "spend", past: "spent", pp: "spent", kr: "쓰다" },
  { base: "sit", past: "sat", pp: "sat", kr: "앉다" },
  { base: "shine", past: "shone", pp: "shone", kr: "빛나다" },
  { base: "shoot", past: "shot", pp: "shot", kr: "쏘다" },
  { base: "slide", past: "slid", pp: "slid", kr: "미끄러지다" },
  { base: "stand", past: "stood", pp: "stood", kr: "서있다" },
  { base: "think", past: "thought", pp: "thought", kr: "생각하다" },
  { base: "teach", past: "taught", pp: "taught", kr: "가르치다" },
  { base: "tell", past: "told", pp: "told", kr: "말하다(tell)" },
  { base: "leave", past: "left", pp: "left", kr: "떠나다" },
  { base: "bring", past: "brought", pp: "brought", kr: "데려오다" },
  { base: "bend", past: "bent", pp: "bent", kr: "구부리다" },
  { base: "bleed", past: "bled", pp: "bled", kr: "피를 흘리다" },
  { base: "build", past: "built", pp: "built", kr: "짓다" },
  { base: "buy", past: "bought", pp: "bought", kr: "사다" },
  { base: "catch", past: "caught", pp: "caught", kr: "잡다(catch)" },
  { base: "dig", past: "dug", pp: "dug", kr: "파다" },
  { base: "feel", past: "felt", pp: "felt", kr: "느끼다" },
  { base: "fight", past: "fought", pp: "fought", kr: "싸우다" },
  { base: "find", past: "found", pp: "found", kr: "찾다" },
  { base: "feed", past: "fed", pp: "fed", kr: "먹이를 주다" },
  { base: "get", past: "got", pp: "got", kr: "얻다" },
  { base: "hang", past: "hung", pp: "hung", kr: "매달다" },
  { base: "have", past: "had", pp: "had", kr: "가지다" },
  { base: "win", past: "won", pp: "won", kr: "이기다" },
  { base: "wind", past: "wound", pp: "wound", kr: "감다" },
  { base: "light", past: "lit", pp: "lit", kr: "불을 켜다" },
  { base: "stick", past: "stuck", pp: "stuck", kr: "붙이다" },
  { base: "strike", past: "struck", pp: "struck", kr: "치다(strike)" },
  { base: "sweep", past: "swept", pp: "swept", kr: "쓸다" },
  { base: "swing", past: "swung", pp: "swung", kr: "흔들다" },
  { base: "sting", past: "stung", pp: "stung", kr: "쏘이다" },
  { base: "spin", past: "spun", pp: "spun", kr: "돌리다" },
  { base: "spit", past: "spat", pp: "spat", kr: "뱉다" },
  { base: "speed", past: "sped", pp: "sped", kr: "속도를 내다" },
  { base: "seek", past: "sought", pp: "sought", kr: "찾다(seek)" },
  { base: "bind", past: "bound", pp: "bound", kr: "묶다" },
];

// ─── A-B-C형 (전부 다름) ───
const ABC = [
  { base: "begin", past: "began", pp: "begun", kr: "시작하다" },
  { base: "bear", past: "bore", pp: "born", kr: "낳다" },
  { base: "bite", past: "bit", pp: "bitten", kr: "물다" },
  { base: "break", past: "broke", pp: "broken", kr: "깨뜨리다" },
  { base: "blow", past: "blew", pp: "blown", kr: "불다" },
  { base: "choose", past: "chose", pp: "chosen", kr: "선택하다" },
  { base: "drink", past: "drank", pp: "drunk", kr: "마시다" },
  { base: "do", past: "did", pp: "done", kr: "하다" },
  { base: "draw", past: "drew", pp: "drawn", kr: "그리다" },
  { base: "drive", past: "drove", pp: "driven", kr: "운전하다" },
  { base: "eat", past: "ate", pp: "eaten", kr: "먹다" },
  { base: "fall", past: "fell", pp: "fallen", kr: "떨어지다" },
  { base: "fly", past: "flew", pp: "flown", kr: "날다" },
  { base: "forget", past: "forgot", pp: "forgotten", kr: "잊다" },
  { base: "forgive", past: "forgave", pp: "forgiven", kr: "용서하다" },
  { base: "freeze", past: "froze", pp: "frozen", kr: "얼다" },
  { base: "give", past: "gave", pp: "given", kr: "주다" },
  { base: "go", past: "went", pp: "gone", kr: "가다" },
  { base: "grow", past: "grew", pp: "grown", kr: "자라다" },
  { base: "hide", past: "hid", pp: "hidden", kr: "숨기다" },
  { base: "know", past: "knew", pp: "known", kr: "알다" },
  { base: "lie", past: "lay", pp: "lain", kr: "눕다" },
  { base: "mistake", past: "mistook", pp: "mistaken", kr: "실수하다" },
  { base: "ring", past: "rang", pp: "rung", kr: "울리다" },
  { base: "ride", past: "rode", pp: "ridden", kr: "타다" },
  { base: "rise", past: "rose", pp: "risen", kr: "올라가다" },
  { base: "see", past: "saw", pp: "seen", kr: "보다" },
  { base: "sink", past: "sank", pp: "sunk", kr: "가라앉다" },
  { base: "sing", past: "sang", pp: "sung", kr: "노래 부르다" },
  { base: "speak", past: "spoke", pp: "spoken", kr: "말하다(speak)" },
  { base: "steal", past: "stole", pp: "stolen", kr: "훔치다" },
  { base: "shake", past: "shook", pp: "shaken", kr: "흔들다(shake)" },
  { base: "show", past: "showed", pp: "shown", kr: "보여주다" },
  { base: "swim", past: "swam", pp: "swum", kr: "헤엄치다" },
  { base: "take", past: "took", pp: "taken", kr: "취하다" },
  { base: "tear", past: "tore", pp: "torn", kr: "찢다" },
  { base: "throw", past: "threw", pp: "thrown", kr: "던지다(throw)" },
  { base: "wake", past: "woke", pp: "woken", kr: "깨우다" },
  { base: "wear", past: "wore", pp: "worn", kr: "입다" },
  { base: "write", past: "wrote", pp: "written", kr: "쓰다(글)" },
  { base: "come", past: "came", pp: "come", kr: "오다" },
  { base: "become", past: "became", pp: "become", kr: "되다" },
  { base: "run", past: "ran", pp: "run", kr: "달리다" },
  { base: "overcome", past: "overcame", pp: "overcome", kr: "극복하다" },
  { base: "spring", past: "sprang", pp: "sprung", kr: "뛰어오르다" },
  { base: "shrink", past: "shrank", pp: "shrunk", kr: "줄어들다" },
  { base: "swear", past: "swore", pp: "sworn", kr: "맹세하다" },
  { base: "weave", past: "wove", pp: "woven", kr: "짜다" },
  { base: "withdraw", past: "withdrew", pp: "withdrawn", kr: "철회하다" },
  { base: "wring", past: "wrung", pp: "wrung", kr: "비틀다" },
  { base: "prove", past: "proved", pp: "proven", kr: "증명하다" },
  { base: "sew", past: "sewed", pp: "sewn", kr: "바느질하다" },
];

// ─── 문장 빈칸 문제 (Level 3용) ───
const SENTENCES = [
  { sentence: "I have ___ a letter to my friend.", verb: "write", answer: "written", tense: "현재완료" },
  { sentence: "She ___ to school yesterday.", verb: "go", answer: "went", tense: "과거" },
  { sentence: "The window was ___ by the ball.", verb: "break", answer: "broken", tense: "수동태" },
  { sentence: "He has ___ all the milk.", verb: "drink", answer: "drunk", tense: "현재완료" },
  { sentence: "They ___ a new song last night.", verb: "sing", answer: "sang", tense: "과거" },
  { sentence: "I have ___ this movie before.", verb: "see", answer: "seen", tense: "현재완료" },
  { sentence: "She ___ a beautiful picture.", verb: "draw", answer: "drew", tense: "과거" },
  { sentence: "The leaves have ___ from the tree.", verb: "fall", answer: "fallen", tense: "현재완료" },
  { sentence: "He ___ the ball to me.", verb: "throw", answer: "threw", tense: "과거" },
  { sentence: "The bird has ___ away.", verb: "fly", answer: "flown", tense: "현재완료" },
  { sentence: "I ___ my homework already.", verb: "do", answer: "did", tense: "과거" },
  { sentence: "She has ___ him for 5 years.", verb: "know", answer: "known", tense: "현재완료" },
  { sentence: "The ice cream has ___ in the sun.", verb: "freeze", answer: "frozen", tense: "현재완료" },
  { sentence: "He ___ the car to the airport.", verb: "drive", answer: "drove", tense: "과거" },
  { sentence: "I have ___ breakfast.", verb: "eat", answer: "eaten", tense: "현재완료" },
  { sentence: "She ___ a new dress yesterday.", verb: "wear", answer: "wore", tense: "과거" },
  { sentence: "The phone ___ three times.", verb: "ring", answer: "rang", tense: "과거" },
  { sentence: "He has ___ the answer.", verb: "give", answer: "given", tense: "현재완료" },
  { sentence: "They ___ English for 2 hours.", verb: "speak", answer: "spoke", tense: "과거" },
  { sentence: "The baby was ___ in June.", verb: "bear", answer: "born", tense: "수동태" },
  { sentence: "I ___ my keys somewhere.", verb: "lose", answer: "lost", tense: "과거" },
  { sentence: "He ___ a horse last summer.", verb: "ride", answer: "rode", tense: "과거" },
  { sentence: "The sun has ___ early today.", verb: "rise", answer: "risen", tense: "현재완료" },
  { sentence: "She ___ a cookie from the jar.", verb: "steal", answer: "stole", tense: "과거" },
  { sentence: "I have ___ in the ocean.", verb: "swim", answer: "swum", tense: "현재완료" },
  { sentence: "He ___ the baby at 6 AM.", verb: "wake", answer: "woke", tense: "과거" },
  { sentence: "The paper was ___ in half.", verb: "tear", answer: "torn", tense: "수동태" },
  { sentence: "They have ___ to help us.", verb: "choose", answer: "chosen", tense: "현재완료" },
  { sentence: "I ___ my best friend at school.", verb: "meet", answer: "met", tense: "과거" },
  { sentence: "He has ___ the whole book.", verb: "read", answer: "read", tense: "현재완료" },
  { sentence: "The dog ___ the mailman.", verb: "bite", answer: "bit", tense: "과거" },
  { sentence: "I have ___ to clean my room.", verb: "begin", answer: "begun", tense: "현재완료" },
  { sentence: "She ___ behind the door.", verb: "hide", answer: "hid", tense: "과거" },
  { sentence: "The shirt has ___ in the wash.", verb: "shrink", answer: "shrunk", tense: "현재완료" },
  { sentence: "He ___ to tell the truth.", verb: "swear", answer: "swore", tense: "과거" },
];

// ─── 챕터 정의 (export) ───
export default {
  id: "irregular-verbs",
  name: "불규칙동사 섬",
  emoji: "🌋",
  colors: ["#FF6B6B", "#FF8E53"],
  desc: "불규칙동사 120개 완전정복!",
  levels: [
    {
      name: "기초",
      emoji: "🟢",
      data: [...AAA, ...ABB.slice(0, 10)],
      types: ["ox", "choice", "meaningChoice"],
    },
    {
      name: "중급",
      emoji: "🟡",
      data: ABB,
      types: ["pastFill", "ppFill", "cardMatch"],
    },
    {
      name: "고급",
      emoji: "🔴",
      data: ABC,
      types: ["meaningType", "sentenceFill", "tripleWrite"],
    },
  ],
  sentences: SENTENCES,
};

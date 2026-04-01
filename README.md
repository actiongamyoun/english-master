# 🚀 English Master - 영어학습 앱

초등 고학년을 위한 영어학습 PWA 앱

## 기능
- 🗺️ **월드맵 챕터 시스템** - 확장 가능한 모듈형 구조
- 🌋 **불규칙동사 섬** - 120개 동사, 3단계 난이도
- 📝 **7가지 문제유형** - O/X, 3지선다, 타이핑, 문장빈칸, 3형태 연속 등
- 👹 **보스전** - 레벨별 보스 클리어로 다음 단계 해금
- 🔥 **복수전** - 틀린 단어 재도전 2배 포인트
- 🚀 **우주선 슈팅** - 미니게임
- 🎰 **가챠 뽑기** - 랜덤 아이템 수집
- 🏅 **칭호 시스템** - 10종 업적 칭호
- 💰 **용돈 요청** - 포인트 → 용돈 교환
- 💾 **데이터 저장** - localStorage 기반 진행도 저장
- 📱 **PWA** - 홈 화면에 추가하여 앱처럼 사용

## 배포 (Netlify)

### 방법 1: GitHub 연동
1. 이 프로젝트를 GitHub 리포에 push
2. Netlify > New site > Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`

### 방법 2: 수동 배포
1. `npm run build`
2. Netlify에 `dist` 폴더 드래그 앤 드롭

## 개발
```bash
npm install
npm run dev
```

## 기술 스택
- Vite + React 18
- PWA (Service Worker + Manifest)
- localStorage 기반 데이터 저장

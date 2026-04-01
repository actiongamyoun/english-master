/**
 * 📚 챕터 자동 등록 파일
 * 
 * 새 챕터를 추가하려면:
 * 1. /src/chapters/ 에 ch4-xxx.js 파일 생성 (ch1 파일 참고)
 * 2. 아래에 import 한 줄 추가
 * 3. chapters 배열에 push 한 줄 추가
 * 4. 끝! 앱이 자동으로 인식합니다.
 */

import ch1 from './ch1-irregular-verbs.js';
import ch2 from './ch2-basic-words.js';
import ch3 from './ch3-sentence-patterns.js';
// import ch4 from './ch4-xxx.js';  ← 새 챕터 추가 시 이렇게

const chapters = [];
chapters.push(ch1);
chapters.push(ch2);
chapters.push(ch3);
// chapters.push(ch4);  ← 새 챕터 추가 시 이렇게

export default chapters;

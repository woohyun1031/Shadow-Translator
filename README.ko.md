<p align="center">
  <img src="assets/logo.svg" width="64" height="64" alt="Shadow Translator 로고">
</p>

<h1 align="center">Shadow Translator</h1>

<p align="center">
  크롬 페이지 번역 결과 아래에 원문을 함께 표시합니다.<br>
  <sub>데스크톱 Google Chrome 전용.</sub>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/njhfceigjibchcnokjaoapmobelimlnm">Chrome 웹 스토어</a> ·
  <a href="README.md">English</a>
</p>

<!-- <p align="center">
  <img src="docs/screenshot.png" width="544" alt="영어 페이지를 크롬으로 한국어 번역한 화면. 각 문단 아래에 영어 원문이 회색으로 표시됨">
</p> -->

---

## 개요

크롬으로 웹페이지를 번역하면 기존 원문이 완전히 대체됩니다.  
Shadow Translator는 크롬이 번역한 문단마다 아래에 원문을 회색으로 함께 표시합니다.  
번역은 크롬이 담당하고, 이 확장은 원문을 덧붙여 보여주는 역할만 합니다.

## 주요 특징

- **사용 방법:** 설치 후 웹페이지에서 크롬 번역을 실행하면 바로 원문이 표시됩니다. (이미 열려 있던 탭은 새로고침 필요)
- **원문 동시 표시:** 번역된 문단마다 원문 표시 (번역 해제 시 함께 제거)
- **기존 번역 흐름 유지:** 주소창 번역 아이콘 및 우클릭 메뉴 동일 사용
- **전 언어 지원:** 크롬 번역이 지원하는 모든 언어에서 동작
- **제약 없는 사용:** 회원가입, 결제, 횟수 제한 없음
- **단순하고 안전함:** 외부 서버 통신 없음, 약 23KB의 가벼운 크기
- **커스텀 설정:** 원문 색상, 글자 크기, 줄 간격, 투명도 조절

## 참고 사항

- **Google Chrome 전용입니다.** Edge, 웨일, Brave 등 크로미움 기반 브라우저라도 내장 번역 엔진 구조가 달라 정상 작동하지 않습니다.
- **모든 사이트 접근 권한 안내:** 사용자가 어떤 페이지를 번역할지 미리 알 수 없어, 번역 전 원문을 미리 확보하기 위해 권한을 요청합니다. 어떠한 데이터도 외부로 전송하지 않으며, 자세한 내용은 [PRIVACY.ko.md](PRIVACY.ko.md)를 참고해 주세요.
- **크롬 구조 변경에 영향받음:** 크롬 번역기가 페이지 DOM을 변경하는 방식에 맞춰 동작하므로, 크롬의 업데이트에 따라 일시적으로 작동하지 않을 수 있습니다.

## 문제 해결

| 증상                      | 해결                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 원문이 전혀 나오지 않음   | 설치 전에 열어 둔 탭입니다. 페이지 새로고침 후 다시 번역해 보세요.                                                          |
| 일부 문단에만 원문이 없음 | 원문과 번역문이 동일하거나, 동적 로딩으로 인해 원문을 미리 확보하지 못한 영역일 수 있습니다.                                |
| Edge·웨일·Brave에서 안 됨 | Google Chrome 전용입니다. [참고 사항](#참고-사항)을 확인해 주세요.                                                          |
| 페이지 레이아웃이 깨짐    | 툴바에서 확장을 일시적으로 끄고 [문제를 신고](https://github.com/woohyun1031/Shadow-Translator/issues/new/choose)해 주세요. |

## 개발

```bash
npm ci
npm run build       # 프로덕션 빌드 → dist/
npm run watch       # 개발 빌드 + watch
npm test            # Vitest + jsdom
npm run typecheck   # tsc --noEmit
npm run format      # Prettier
```

chrome://extensions에서 개발자 모드를 켜고 압축해제된 확장 프로그램 로드로 dist/를 선택합니다.  
Pull Request는 언제나 환영합니다. 제출하기 전에 `npm test`, `npm run typecheck`, `npm run format`을 실행해 주세요.

보안 관련 보고는 [SECURITY.md](https://github.com/woohyun1031/Shadow-Translator/security/policy)를 참고해 주세요.

## 라이선스

[MIT](LICENSE)

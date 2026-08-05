# CLAUDE.md

크롬 내장 번역기의 DOM 변화를 감지해 번역문 아래에 원문을 회색으로 덧붙이는 **Manifest V3 크롬 확장**. 외부 번역 API를 호출하지 않으며, 사용자 데이터를 외부로 전송하지 않는다.

## 빠른 명령어

```bash
npm run build         # webpack production → dist/
npm run watch         # 개발용 watch
npm run format        # prettier 일괄 적용
npm run format:check  # 포맷 검증
```

확장 로드: `chrome://extensions` → 개발자 모드 → "압축 해제된 확장 프로그램 로드" → [dist/](dist/) 선택.

## 아키텍처

```
[manifest.json] ──► content_scripts: dist/content.js (<all_urls>, all_frames, document_end)
       │
       └── action.popup: dist/popup.html → dist/popup.js

webpack: src/content.js, src/popup.js → dist/[name].js
popup ⇄ content 동기화는 chrome.storage.local.isEnabled 하나만 사용
```

## 핵심 파일 맵

- [src/content.js](src/content.js) — 부트스트랩. **원문 스냅샷 먼저**, 그다음 observer 시작, 이후 storage 로드 및 `storage.onChanged` 구독
- [src/core/snapshot.js](src/core/snapshot.js) — 번역 전 원문을 블록별 `WeakMap`에 보관. `captureAll`/`captureBlock`/`getSnapshot`, 렌더 중복 방지용 `lastRendered`
- [src/core/observer.js](src/core/observer.js) — MutationObserver 2종. (1) body의 childList에서 font 감지 + 미번역 블록 스냅샷, (2) html의 class 변화로 번역 시작/해제 감지
- [src/core/extractor.js](src/core/extractor.js) — `collectText` 단일 함수. 블록이 직접 소유한 텍스트만 재귀 수집 (중첩 structural 자식 제외)
- [src/core/renderer.js](src/core/renderer.js) — `.echo-original-text notranslate` div를 블록 내부 적절한 위치에 삽입. 원문 == 번역문이면 만들지 않음
- [src/core/defaults.js](src/core/defaults.js) — `DEFAULT_SHADOW_STYLE`, `SHADOW_STYLE_RANGES`
- [src/utils/dom.js](src/utils/dom.js) — `structuralTags` 집합, `getBlockContainer`, `isElementHidden`
- [src/popup.js](src/popup.js) / [popup.html](popup.html) — Enable Shadow 토글 UI
- [manifest.json](manifest.json) — MV3, `storage` 권한, `<all_urls>` host_permissions, all_frames

## 핵심 동작 원리

**번역 후 DOM에서 원문을 되돌리는 것은 불가능하다.** 크롬 번역기는 블록 전체를 번역 API로 보내면서 자식 노드마다 인덱스를 붙이고, 응답에서 어순에 맞춰 **인라인 요소를 재배치**하며, 원문에 없던 텍스트 노드를 새로 만들고, `<code>`/notranslate 요소는 전송조차 하지 않는다. 즉 텍스트 노드와 `<font>`는 1:1도 아니고 순서도 보존되지 않는다. 1.2.0 이전 버전이 링크가 포함된 문단에서 원문을 뒤섞어 표시한 원인이 이것이다.

그래서 원문은 **번역이 시작되기 전에 미리 보관한다**. `captureAll`이 structural 블록(P/DIV/H1.../LI/TD 등)의 텍스트를 `WeakMap`에 스냅샷하고, 트리거는 3개다.

1. content script 초기화 시점 (`document_end`) — 기본 방어선
2. `<html>`에 `translated-ltr`/`translated-rtl` **부착** — 번역 시작 신호. 크롬은 클래스를 먼저 붙이고 네트워크 왕복 뒤에 DOM을 교체하므로 이 시점에도 원문이 남아 있다
3. `font` 없이 새로 삽입되는 블록 — SPA·무한 스크롤 대응

이후 `font`가 감지되면 300ms 디바운스 후, **스냅샷 원문 + 현재 DOM의 번역문**으로 `renderShadowText`를 호출한다. 원문은 고정이므로 재렌더 판정은 번역문 변화로만 한다(번역이 여러 배치로 도착하는 경우 대응). `translated-*` 클래스가 사라지면 모든 shadow를 즉시 정리한다.

## 코딩 컨벤션

- **Prettier** ([.prettierrc.json](.prettierrc.json)): 4-space, single quotes, `;` 사용, `printWidth: 100`, `trailingComma: "es5"`. `*.md`도 포맷 대상 ([.prettierignore](.prettierignore) 참고).
- **모듈:** ES modules — webpack이 번들. `chrome.*` API는 `typeof chrome !== 'undefined'` 가드 후 사용 ([src/content.js:14](src/content.js#L14)).
- **커밋 메시지:** 한국어 + conventional prefix (`feat:`, `refactor:`, `chore:`, `update:`, `docs:`).
- **버전:** [manifest.json](manifest.json)과 [package.json](package.json)의 version 필드를 함께 올린다.

## Known Caveats (수정 시 주의 영역)

- **스냅샷이 없으면 렌더하지 않는다** ([src/core/observer.js](src/core/observer.js)의 `flush`) — 의도된 동작이다. 번역 후 DOM에서는 원문을 복원할 수 없으므로 틀린 원문보다 미표시를 택했다. "shadow가 안 나온다"는 제보는 먼저 스냅샷 3개 트리거의 타이밍을 의심한다.
- **`collectText`는 원문·번역문 양쪽에 쓰이는 단일 순회** ([src/core/extractor.js](src/core/extractor.js)) — 번역 전에 부르면 원문, 후에 부르면 번역문. 순회 규칙을 바꾸면 양쪽이 **동시에** 바뀌어야 하므로 함수를 분리하지 말 것. `isElementHidden(child, { useComputedStyle: false })`로 부르는 이유도 이것이다(computed style은 번역 전/후로 달라져 규칙이 어긋나고, 비용도 크다).
- **`clearShadowTexts()`와 `resetLastRendered()`는 항상 함께** — shadow만 지우고 렌더 기록을 남기면, 같은 번역문이 다시 들어올 때 "이미 렌더함"으로 판정해 shadow가 되살아나지 않는다(번역 해제 → 재번역, 토글 off → on).
- **확장이 꺼져 있어도 스냅샷은 계속 모은다** ([src/core/observer.js](src/core/observer.js)의 `setEnabled`) — 이미 번역된 페이지에서 토글을 켜도 원문을 표시하기 위한 것이다. observer는 `disconnect`하지 않고 렌더만 차단한다.
- **자기 재번역 차단** — shadow div는 `class="... notranslate"` + `translate="no"`로 차단한다. 새 shadow 요소를 추가할 때 같은 속성을 반드시 붙인다.
- **스타일은 storage `shadowStyle` 키** ([src/core/defaults.js](src/core/defaults.js)) — 기본값과 슬라이더 범위가 여기 있다. 항목을 늘리려면 defaults + popup + `applyStyleToNode` 3곳을 함께 고친다.

## 자주 하는 작업

- **새 structural 블록 태그 지원:** [src/utils/dom.js](src/utils/dom.js)의 `structuralTags` 집합에 추가. [src/core/snapshot.js](src/core/snapshot.js)의 `blockSelector`가 이 집합에서 생성되므로 스냅샷 대상도 자동으로 따라온다.
- **토글 외 옵션 추가:** [popup.html](popup.html) UI + [src/popup.js](src/popup.js) 핸들러 + [src/content.js](src/content.js)의 `storage.onChanged` 분기 — 3곳 동기화.
- **렌더 위치 변경:** [src/core/renderer.js](src/core/renderer.js)의 `insertBeforeNode` 탐색 로직 (1.0.1 릴리스에서 개선된 부분).

## 빌드/배포

- [dist/](dist/)는 [.gitignore](.gitignore)됨. 배포는 `npm run build` 후 `dist/`를 zip으로 압축해 크롬 웹스토어에 업로드.
- 테스트 스크립트는 placeholder ([package.json](package.json)의 `test`) — 별도 테스트 프레임워크는 없다.

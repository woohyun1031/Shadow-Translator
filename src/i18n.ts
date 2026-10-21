export type GetMessage = (key: string) => string;

const ATTRIBUTES = ['title', 'aria-label'] as const;

/**
 * popup.html의 문구를 현재 크롬 UI 언어로 채운다.
 *
 * - `data-i18n="key"` → textContent
 * - `data-i18n-title="key"`, `data-i18n-aria-label="key"` → 해당 속성
 *
 * 메시지가 비어 있으면(키 누락) HTML에 적힌 영어 기본 문구를 그대로 둔다.
 * textContent를 통째로 바꾸므로 아이콘(svg)과 같은 요소에는 붙이지 말고 텍스트만 감싼 span에 붙인다.
 */
export function applyI18n(root: ParentNode, getMessage: GetMessage): void {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const text = getMessage(el.dataset.i18n!);
        if (text) el.textContent = text;
    });
    for (const attr of ATTRIBUTES) {
        root.querySelectorAll<HTMLElement>(`[data-i18n-${attr}]`).forEach((el) => {
            const text = getMessage(el.getAttribute(`data-i18n-${attr}`)!);
            if (text) el.setAttribute(attr, text);
        });
    }
}

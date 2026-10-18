import { structuralTags } from '../utils/dom';
import { collectText } from './extractor';

// 블록 -> 번역 전 원문
const snapshots = new WeakMap<Element, string>();
// 블록 -> 마지막으로 렌더할 때 사용한 번역문 (중복 렌더 방지용)
let lastRendered = new WeakMap<Element, string>();

const blockSelector = Array.from(structuralTags) //  // "p,div,h1,h2,…,li,td,…"
    .map((tag) => tag.toLowerCase())
    .join(',');

const isBlock = (node: Node | null): node is HTMLElement =>
    (node &&
        node.nodeType === Node.ELEMENT_NODE &&
        structuralTags.has((node as Element).tagName.toUpperCase())) as boolean;

export const isPageTranslated = (): boolean =>
    document.documentElement.classList.contains('translated-ltr') ||
    document.documentElement.classList.contains('translated-rtl');

/**
 * 블록의 번역 전 원문을 보관한다.
 * - 이미 스냅샷이 있으면 덮어쓰지 않는다. 최초 원문만 신뢰한다.
 * - font 자손이 있으면 이미 번역된 블록이므로 보관하지 않는다(원문이 아니다).
 *
 * assumeUntranslated: 페이지 전체가 아직 번역 전임이 확인된 경우 블록별 font 탐색을 생략한다.
 */
export function captureBlock(
    block: Node | null,
    { assumeUntranslated = false }: { assumeUntranslated?: boolean } = {}
): void {
    if (!isBlock(block) || snapshots.has(block)) return;
    if (!assumeUntranslated && block.querySelector('font')) return;

    const text = collectText(block);
    if (!text.trim()) return;

    snapshots.set(block, text);
}

/**
 * root와 그 하위의 모든 structural 블록을 캡처한다.
 * textContent 수집만 하므로 레이아웃을 유발하지 않는다.
 */
export function captureAll(root: Node | null): void {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) return;

    const options = { assumeUntranslated: !isPageTranslated() };

    captureBlock(root, options);

    if (!(root as Partial<Element>).querySelectorAll) return;
    (root as Element)
        .querySelectorAll(blockSelector)
        .forEach((block) => captureBlock(block, options));
}

export const getSnapshot = (block: Element): string | null => snapshots.get(block) || null;

export const getLastRendered = (block: Element): string | undefined => lastRendered.get(block);
export const setLastRendered = (block: Element, translated: string): WeakMap<Element, string> =>
    lastRendered.set(block, translated);
export const clearLastRendered = (block: Element): boolean => lastRendered.delete(block);

// shadow를 일괄 제거했다면 렌더 기록도 함께 버려야 한다.
// 그러지 않으면 같은 번역문이 다시 들어올 때 "이미 렌더함"으로 판정해 shadow가 되살아나지 않는다.
export const resetLastRendered = (): void => {
    lastRendered = new WeakMap();
};

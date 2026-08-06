import { isElementHidden, structuralTags } from '../utils/dom';

const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'SVG', 'OBJECT']);

/**
 * 블록이 "직접 소유한" 텍스트만 재귀 수집한다.
 * 중첩된 structural 블록은 각자 자신의 shadow를 갖기 때문에 제외한다.
 *
 * 번역 전에 부르면 원문, 번역 후에 부르면 번역문이 나온다. 같은 순회 규칙에서 나오므로
 * 두 결과는 항상 서로 대응한다 — 원문 스냅샷과 번역문 비교가 어긋나지 않는 근거다.
 * 그래서 hidden 판정에서 computed style은 쓰지 않는다(시점에 따라 달라지므로).
 *
 * font 노드를 특별 취급하지 않는다는 점이 중요하다. 크롬 번역기는 노드를 1:1로 교체하지
 * 않고 어순에 맞춰 인라인 요소를 재배치·병합하므로, font에서 원문을 되돌리려는 시도는
 * 원리적으로 실패한다. 원문은 번역 전에 미리 보관한다 (core/snapshot.ts).
 */
export function collectText(element: Element | null): string {
    if (!element) return '';

    let text = '';

    for (let child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent!;
            continue;
        }

        if (child.nodeType !== Node.ELEMENT_NODE) continue;

        if (
            (child as Element).classList &&
            (child as Element).classList.contains('echo-original-text')
        )
            continue;

        const tag = (child as Element).tagName.toUpperCase();
        if (skipTags.has(tag)) continue;
        if (structuralTags.has(tag)) continue;
        if (isElementHidden(child as Element, { useComputedStyle: false })) continue;

        text += collectText(child as Element);
    }

    return text;
}

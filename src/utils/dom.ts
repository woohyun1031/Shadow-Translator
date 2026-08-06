export const structuralTags = new Set([
    'P',
    'DIV',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'LI',
    'TD',
    'TH',
    'BLOCKQUOTE',
    'DD',
    'DT',
    'FIGCAPTION',
    'SUMMARY',
    'DETAILS',
    'PRE',
    'ADDRESS',
    'CAPTION',
    'FIGURE',
    'DIALOG',
]);

export function getBlockContainer(node: Node | null): HTMLElement | null {
    let current: Node | null = node;
    const skipElements = new Set([
        'BUTTON',
        'LABEL',
        'INPUT',
        'FORM',
        'SELECT',
        'OPTION',
        'TEXTAREA',
    ]);

    while (current && current.nodeType === Node.ELEMENT_NODE) {
        if (skipElements.has((current as Element).tagName.toUpperCase())) {
            return null;
        }
        if (structuralTags.has((current as Element).tagName.toUpperCase())) {
            return current as HTMLElement;
        }
        current = current.parentNode;
    }
    return null;
}

// useComputedStyle: false 이면 getComputedStyle을 건너뛴다.
// 원문 스냅샷(번역 전)과 번역문 추출(번역 후)은 같은 순회 규칙을 써야 하는데,
// computed style은 두 시점 사이에 달라질 수 있어 규칙이 어긋난다. 비용도 이 경로가 가장 크다.
export function isElementHidden(
    element: Element | null,
    { useComputedStyle = true }: { useComputedStyle?: boolean } = {}
): boolean {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

    if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true') {
        return true;
    }
    if (element.hasAttribute('hidden')) {
        return true;
    }

    if (element.classList) {
        // hiddenClasses 화이트리스트가 정적 -> 이건 나중에 옵션으로 바꿀 수 있도록
        const hiddenClasses = [
            'sr-only',
            'visually-hidden',
            'screen-reader-text',
            'hide',
            'd-none',
            'hidden',
            'invisible',
            'show-on-focus',
        ];
        for (let cls of hiddenClasses) {
            if (element.classList.contains(cls)) {
                return true;
            }
        }
    }

    if (
        (element as HTMLElement).style &&
        ((element as HTMLElement).style.display === 'none' ||
            (element as HTMLElement).style.visibility === 'hidden' ||
            (element as HTMLElement).style.opacity === '0')
    ) {
        return true;
    }

    if (useComputedStyle && (window as Partial<Window>).getComputedStyle) {
        const style = window.getComputedStyle(element);
        if (
            style &&
            (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')
        ) {
            return true;
        }
    }

    return false;
}

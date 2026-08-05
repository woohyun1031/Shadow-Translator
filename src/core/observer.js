import { getBlockContainer } from '../utils/dom';
import { collectText } from './extractor';
import {
    captureAll,
    clearLastRendered,
    getLastRendered,
    getSnapshot,
    isPageTranslated,
    resetLastRendered,
    setLastRendered,
} from './snapshot';
import { renderShadowText, clearShadowTexts } from './renderer';

// 크롬 번역기는 한 블록의 번역을 여러 배치로 나눠 넣는다. 너무 짧으면 미완성 상태로 렌더된다.
const RENDER_DEBOUNCE_MS = 300;
// font 제거가 "번역 해제"인지 "재번역 중 교체"인지 구분하기 위한 대기 시간
const FONT_REMOVAL_GRACE_MS = 50;

const pendingBlocks = new Set();

let renderTimeout = null;
let isObserverRunning = false;
let isEnabled = true;
let wasPageTranslated = false;

const flush = () => {
    pendingBlocks.forEach((block) => {
        if (!block.isConnected) return;

        // 번역 전 원문을 확보하지 못한 블록은 렌더하지 않는다.
        // 번역 후 DOM에서 원문을 되돌릴 방법은 없으므로, 틀린 원문보다 미표시가 낫다.
        const original = getSnapshot(block);
        if (!original) return;

        // 원문은 스냅샷으로 고정이므로 변하는 쪽은 번역문뿐이다.
        // 번역이 배치로 나뉘어 도착하면 번역문이 갱신되고, 그때만 다시 렌더한다.
        const translated = collectText(block);
        if (getLastRendered(block) === translated) return;

        renderShadowText(block, original, translated);
        setLastRendered(block, translated);
    });

    pendingBlocks.clear();
};

const scheduleRender = () => {
    if (renderTimeout) clearTimeout(renderTimeout);
    renderTimeout = setTimeout(flush, RENDER_DEBOUNCE_MS);
};

const queueBlock = (node) => {
    const block = getBlockContainer(node);
    if (block) pendingBlocks.add(block);
};

/**
 * 삽입된 노드에서 font들의 부모를 찾는다.
 * 하나도 찾지 못하면 null을 돌려준다(= 번역과 무관한 삽입).
 */
const findFontParents = (node, parent) => {
    if (node.tagName === 'FONT') return [parent];

    if (!node.querySelectorAll) return null;

    const fonts = node.querySelectorAll('font');
    if (fonts.length === 0) return null;

    return Array.from(fonts, (font) => font.parentNode);
};

const scheduleShadowCleanup = (parent) => {
    const block = getBlockContainer(parent);
    if (!block) return;

    setTimeout(() => {
        if (!block.isConnected || block.querySelector('font')) return;
        block.querySelectorAll('.echo-original-text').forEach((el) => el.remove());
        clearLastRendered(block);
    }, FONT_REMOVAL_GRACE_MS);
};

const observer = new MutationObserver((mutations) => {
    let hasFontChanges = false;

    mutations.forEach((mutation) => {
        if (mutation.type !== 'childList') return;

        mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;

            const fontParents = findFontParents(node, mutation.target);
            if (fontParents) {
                // 꺼져 있으면 대기열에 쌓지 않는다.
                // 다시 켤 때 renderExistingTranslations가 font를 전수 스캔해 복구한다.
                if (isEnabled) {
                    fontParents.forEach(queueBlock);
                    hasFontChanges = true;
                }
                return;
            }

            // 번역 전 상태로 새로 삽입된 콘텐츠(SPA·무한 스크롤)의 원문을 확보한다.
            captureAll(node);
        });

        mutation.removedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (node.tagName === 'FONT' || (node.querySelector && node.querySelector('font'))) {
                scheduleShadowCleanup(mutation.target);
            }
        });
    });

    // hasFontChanges는 isEnabled일 때만 켜진다
    if (hasFontChanges) scheduleRender();
});

const htmlObserver = new MutationObserver(() => {
    const isTranslated = isPageTranslated();
    if (isTranslated === wasPageTranslated) return;
    wasPageTranslated = isTranslated;

    if (isTranslated) {
        // 번역 시작 신호. 크롬은 클래스를 먼저 붙이고 네트워크 왕복 뒤에 DOM을 교체하므로
        // 이 시점에는 아직 원문이 남아 있다. 초기 캡처 이후 로드된 콘텐츠를 여기서 보강한다.
        captureAll(document.body);
        return;
    }

    clearShadowTexts();
    resetLastRendered();
    pendingBlocks.clear();
});

// 이미 번역이 끝난 페이지에서 토글을 켠 경우 mutation이 더 오지 않으므로 직접 렌더한다.
const renderExistingTranslations = () => {
    if (!document.body) return;

    document.body.querySelectorAll('font').forEach((font) => queueBlock(font.parentNode));
    if (pendingBlocks.size > 0) flush();
};

/**
 * 원문 스냅샷은 확장이 꺼져 있어도 계속 모은다.
 * 이미 번역된 페이지에서 토글을 켜는 경우에도 원문을 복원할 수 있어야 한다.
 */
export const startObserver = () => {
    if (isObserverRunning || !document.body) return;

    wasPageTranslated = isPageTranslated();

    observer.observe(document.body, { childList: true, subtree: true });
    htmlObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });

    isObserverRunning = true;
};

export const setEnabled = (value) => {
    isEnabled = value;

    if (!isEnabled) {
        if (renderTimeout) clearTimeout(renderTimeout);
        renderTimeout = null;
        pendingBlocks.clear();
        clearShadowTexts();
        resetLastRendered();
        return;
    }

    startObserver();
    renderExistingTranslations();
};

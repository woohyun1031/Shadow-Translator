import { describe, expect, it } from 'vitest';
import { applyI18n } from './i18n';

const messages: Record<string, string> = {
    greeting: '안녕',
    tip: '도움말',
    label: '설정',
};
const getMessage = (key: string) => messages[key] ?? '';

describe('applyI18n', () => {
    it('data-i18n 요소의 텍스트를 메시지로 바꾼다', () => {
        document.body.innerHTML = '<div id="a" data-i18n="greeting">Hello</div>';
        applyI18n(document, getMessage);
        expect(document.getElementById('a')!.textContent).toBe('안녕');
    });

    it('title·aria-label 속성을 메시지로 바꾼다', () => {
        document.body.innerHTML =
            '<label id="a" title="Help" data-i18n-title="tip"></label>' +
            '<div id="b" aria-label="Settings" data-i18n-aria-label="label"></div>';
        applyI18n(document, getMessage);
        expect(document.getElementById('a')!.getAttribute('title')).toBe('도움말');
        expect(document.getElementById('b')!.getAttribute('aria-label')).toBe('설정');
    });

    it('메시지가 비어 있으면 기본 문구를 남긴다', () => {
        document.body.innerHTML =
            '<div id="a" data-i18n="missing">Hello</div>' +
            '<div id="b" title="Help" data-i18n-title="missing"></div>';
        applyI18n(document, getMessage);
        expect(document.getElementById('a')!.textContent).toBe('Hello');
        expect(document.getElementById('b')!.getAttribute('title')).toBe('Help');
    });

    it('텍스트 span만 바꾸고 옆의 아이콘은 건드리지 않는다', () => {
        document.body.innerHTML =
            '<a id="a"><svg id="icon"></svg><span data-i18n="tip">Help</span></a>';
        applyI18n(document, getMessage);
        expect(document.getElementById('icon')).not.toBeNull();
        expect(document.getElementById('a')!.textContent).toBe('도움말');
    });
});

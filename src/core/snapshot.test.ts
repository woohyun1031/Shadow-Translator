import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    captureAll,
    captureBlock,
    clearLastRendered,
    getLastRendered,
    getSnapshot,
    isPageTranslated,
    resetLastRendered,
    setLastRendered,
} from './snapshot';

const $ = (id: string): HTMLElement => document.getElementById(id)!;

beforeEach(() => {
    document.body.innerHTML = '';
});

afterEach(() => {
    document.documentElement.className = '';
});

describe('isPageTranslated', () => {
    it('translated-ltr / translated-rtl 클래스로 판정한다', () => {
        expect(isPageTranslated()).toBe(false);
        document.documentElement.classList.add('translated-ltr');
        expect(isPageTranslated()).toBe(true);
        document.documentElement.className = 'translated-rtl';
        expect(isPageTranslated()).toBe(true);
    });
});

describe('captureAll', () => {
    it('중첩 블록까지 블록마다 직접 소유한 원문을 보관한다', () => {
        document.body.innerHTML =
            '<div id="d">intro<p id="p">Hello <a>world</a></p><ul><li id="li">item</li></ul></div>';
        captureAll(document.body);

        expect(getSnapshot($('d'))).toBe('intro');
        expect(getSnapshot($('p'))).toBe('Hello world');
        expect(getSnapshot($('li'))).toBe('item');
    });

    it('이미 스냅샷이 있으면 덮어쓰지 않는다', () => {
        document.body.innerHTML = '<p id="p">original</p>';
        captureAll(document.body);

        $('p').textContent = 'changed';
        captureAll(document.body);

        expect(getSnapshot($('p'))).toBe('original');
    });

    it('공백뿐인 블록은 보관하지 않는다', () => {
        document.body.innerHTML = '<p id="p">   \n  </p>';
        captureAll(document.body);
        expect(getSnapshot($('p'))).toBeNull();
    });

    it('번역 중인 페이지에서는 font가 있는 블록을 건너뛴다', () => {
        document.documentElement.classList.add('translated-ltr');
        document.body.innerHTML = '<p id="done"><font>번역됨</font></p><p id="pending">not yet</p>';
        captureAll(document.body);

        expect(getSnapshot($('done'))).toBeNull();
        expect(getSnapshot($('pending'))).toBe('not yet');
    });

    it('번역 전 페이지에서는 font 여부를 확인하지 않는다', () => {
        // 원문 자체에 <font>를 쓰는 오래된 페이지도 캡처돼야 한다
        document.body.innerHTML = '<p id="p"><font color="red">legacy</font> page</p>';
        captureAll(document.body);
        expect(getSnapshot($('p'))).toBe('legacy page');
    });

    it('요소가 아닌 노드나 null은 무시한다', () => {
        expect(() => captureAll(null)).not.toThrow();
        expect(() => captureAll(document.createTextNode('x'))).not.toThrow();
    });
});

describe('captureBlock', () => {
    it('structural 블록이 아니면 보관하지 않는다', () => {
        document.body.innerHTML = '<span id="s">inline</span>';
        captureBlock($('s'));
        expect(getSnapshot($('s'))).toBeNull();
    });

    it('기본값은 font가 있는 블록을 건너뛴다', () => {
        document.body.innerHTML = '<p id="p"><font>번역됨</font></p>';
        captureBlock($('p'));
        expect(getSnapshot($('p'))).toBeNull();
    });
});

describe('lastRendered', () => {
    it('set / get / clear', () => {
        const p = document.createElement('p');
        expect(getLastRendered(p)).toBeUndefined();

        setLastRendered(p, '번역문');
        expect(getLastRendered(p)).toBe('번역문');

        clearLastRendered(p);
        expect(getLastRendered(p)).toBeUndefined();
    });

    it('resetLastRendered는 모든 기록을 버린다', () => {
        const a = document.createElement('p');
        const b = document.createElement('p');
        setLastRendered(a, 'a');
        setLastRendered(b, 'b');

        resetLastRendered();

        expect(getLastRendered(a)).toBeUndefined();
        expect(getLastRendered(b)).toBeUndefined();
    });
});

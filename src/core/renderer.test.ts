import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SHADOW_STYLE } from './defaults';
import { clearShadowTexts, renderShadowText, setShadowStyle } from './renderer';

const block = (markup: string): HTMLElement => {
    document.body.innerHTML = markup;
    return document.body.firstElementChild as HTMLElement;
};

const shadowsOf = (el: Element): HTMLElement[] =>
    Array.from(el.querySelectorAll<HTMLElement>(':scope > .echo-original-text'));

beforeEach(() => {
    document.body.innerHTML = '';
});

afterEach(() => {
    setShadowStyle(null);
});

describe('renderShadowText', () => {
    it('재번역을 막는 속성을 붙인 shadow를 만든다', () => {
        const p = block('<p><font>안녕 세상</font></p>');
        renderShadowText(p, 'Hello world', '안녕 세상');

        const [shadow] = shadowsOf(p);
        expect(shadow.className).toBe('echo-original-text notranslate');
        expect(shadow.getAttribute('translate')).toBe('no');
        expect(shadow.textContent).toBe('Hello world');
        expect(p.lastChild).toBe(shadow);
    });

    it('원문의 연속 공백과 앞뒤 공백을 정리한다', () => {
        const p = block('<p>x</p>');
        renderShadowText(p, '  Hello \n\t  world  ', '번역');
        expect(shadowsOf(p)[0].textContent).toBe('Hello world');
    });

    it('원문과 번역문이 공백만 다르면 만들지 않고, 있던 shadow는 지운다', () => {
        const p = block('<p>v1.2</p>');
        renderShadowText(p, 'Hello', '안녕');
        expect(shadowsOf(p)).toHaveLength(1);

        renderShadowText(p, 'v 1 . 2', 'v1.2');
        expect(shadowsOf(p)).toHaveLength(0);
    });

    it('원문이 비어 있으면 아무것도 하지 않는다', () => {
        const p = block('<p>x</p>');
        renderShadowText(p, '', '번역');
        renderShadowText(p, null, '번역');
        expect(shadowsOf(p)).toHaveLength(0);
    });

    it('원문이 공백뿐이면 있던 shadow를 지운다', () => {
        const p = block('<p>x</p>');
        renderShadowText(p, 'Hello', '안녕');
        renderShadowText(p, '   ', '안녕');
        expect(shadowsOf(p)).toHaveLength(0);
    });

    it('자식 structural 블록이 있으면 그 앞에 삽입한다', () => {
        const div = block('<div><font>번역</font><p id="child">nested</p></div>');
        renderShadowText(div, 'Original', '번역');

        const [shadow] = shadowsOf(div);
        expect(shadow.nextElementSibling?.id).toBe('child');
    });

    it('다시 호출하면 새로 만들지 않고 텍스트만 바꾼다', () => {
        const p = block('<p>x</p>');
        renderShadowText(p, 'first', '번역1');
        const first = shadowsOf(p)[0];

        renderShadowText(p, 'second', '번역2');

        expect(shadowsOf(p)).toEqual([first]);
        expect(first.textContent).toBe('second');
    });
});

describe('setShadowStyle', () => {
    it('새로 만드는 shadow에 기본 스타일을 적용한다', () => {
        const p = block('<p>x</p>');
        renderShadowText(p, 'Hello', '안녕');

        const { style } = shadowsOf(p)[0];
        expect(style.fontSize).toBe(`${DEFAULT_SHADOW_STYLE.fontSize}em`);
        expect(style.opacity).toBe(String(DEFAULT_SHADOW_STYLE.opacity));
        expect(style.whiteSpace).toBe('pre-wrap');
    });

    it('이미 있는 shadow에 즉시 반영하고, 빠진 값은 기본값으로 채운다', () => {
        const p = block('<p>x</p>');
        renderShadowText(p, 'Hello', '안녕');

        setShadowStyle({ fontSize: 1.2 });

        const { style } = shadowsOf(p)[0];
        expect(style.fontSize).toBe('1.2em');
        expect(style.lineHeight).toBe(String(DEFAULT_SHADOW_STYLE.lineHeight));
    });

    it('이후에 만드는 shadow에도 적용된다', () => {
        setShadowStyle({ opacity: 0.5 });
        const p = block('<p>x</p>');
        renderShadowText(p, 'Hello', '안녕');
        expect(shadowsOf(p)[0].style.opacity).toBe('0.5');
    });
});

describe('clearShadowTexts', () => {
    it('문서의 모든 shadow를 지운다', () => {
        document.body.innerHTML = '<p id="a">x</p><p id="b">y</p>';
        renderShadowText(document.getElementById('a')!, 'A', '가');
        renderShadowText(document.getElementById('b')!, 'B', '나');

        clearShadowTexts();

        expect(document.querySelectorAll('.echo-original-text')).toHaveLength(0);
    });

    it('container를 넘기면 그 안의 shadow만 지운다', () => {
        document.body.innerHTML = '<p id="a">x</p><p id="b">y</p>';
        const a = document.getElementById('a')!;
        const b = document.getElementById('b')!;
        renderShadowText(a, 'A', '가');
        renderShadowText(b, 'B', '나');

        clearShadowTexts(a);

        expect(shadowsOf(a)).toHaveLength(0);
        expect(shadowsOf(b)).toHaveLength(1);
    });
});

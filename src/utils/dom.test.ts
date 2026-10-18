import { beforeEach, describe, expect, it } from 'vitest';
import { getBlockContainer, isElementHidden } from './dom';

const html = (markup: string): HTMLElement => {
    document.body.innerHTML = markup;
    return document.body;
};

beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
});

describe('getBlockContainer', () => {
    it('인라인 요소에서 가장 가까운 structural 블록을 찾는다', () => {
        html('<div id="outer"><p id="p"><span><b id="b">x</b></span></p></div>');
        expect(getBlockContainer(document.getElementById('b'))?.id).toBe('p');
    });

    it('블록 자신을 넘기면 자신을 돌려준다', () => {
        html('<li id="li">x</li>');
        expect(getBlockContainer(document.getElementById('li'))?.id).toBe('li');
    });

    it.each(['button', 'label', 'form', 'select', 'textarea'])('%s 안에 있으면 null이다', (tag) => {
        html(`<div><${tag}><span id="s">x</span></${tag}></div>`);
        expect(getBlockContainer(document.getElementById('s'))).toBeNull();
    });

    it('structural 조상이 없으면 null이다', () => {
        html('<span id="s">x</span>');
        expect(getBlockContainer(document.getElementById('s'))).toBeNull();
    });

    it('텍스트 노드나 null은 null이다', () => {
        const root = html('<p>x</p>');
        expect(getBlockContainer(root.querySelector('p')!.firstChild)).toBeNull();
        expect(getBlockContainer(null)).toBeNull();
    });
});

describe('isElementHidden', () => {
    const el = (markup: string): Element => html(markup).firstElementChild!;

    it.each([
        ['aria-hidden="true"', '<span aria-hidden="true">x</span>'],
        ['hidden 속성', '<span hidden>x</span>'],
        ['sr-only 클래스', '<span class="sr-only">x</span>'],
        ['d-none 클래스', '<span class="foo d-none">x</span>'],
        ['inline display:none', '<span style="display:none">x</span>'],
        ['inline visibility:hidden', '<span style="visibility:hidden">x</span>'],
        ['inline opacity:0', '<span style="opacity:0">x</span>'],
    ])('%s 이면 숨김이다', (_label, markup) => {
        expect(isElementHidden(el(markup), { useComputedStyle: false })).toBe(true);
    });

    it('aria-hidden="false"나 일반 요소는 숨김이 아니다', () => {
        expect(isElementHidden(el('<span aria-hidden="false">x</span>'))).toBe(false);
        expect(isElementHidden(el('<span>x</span>'))).toBe(false);
    });

    it('스타일시트로 숨긴 요소는 useComputedStyle일 때만 숨김으로 본다', () => {
        document.head.innerHTML = '<style>.gone { display: none; }</style>';
        const target = el('<span class="gone">x</span>');

        expect(isElementHidden(target)).toBe(true);
        expect(isElementHidden(target, { useComputedStyle: false })).toBe(false);
    });

    it('null이면 false다', () => {
        expect(isElementHidden(null)).toBe(false);
    });
});

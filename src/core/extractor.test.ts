import { beforeEach, describe, expect, it } from 'vitest';
import { collectText } from './extractor';

const block = (markup: string): HTMLElement => {
    document.body.innerHTML = markup;
    return document.body.firstElementChild as HTMLElement;
};

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('collectText', () => {
    it('텍스트와 인라인 요소의 텍스트를 순서대로 이어 붙인다', () => {
        expect(collectText(block('<p>Hello <a>big</a> <b><i>world</i></b>!</p>'))).toBe(
            'Hello big world!'
        );
    });

    it('중첩된 structural 블록의 텍스트는 제외한다', () => {
        expect(collectText(block('<div>outer<p>inner</p><span> tail</span></div>'))).toBe(
            'outer tail'
        );
    });

    it('script/style/svg 등은 제외한다', () => {
        expect(
            collectText(
                block('<p>a<script>x()</script><style>.x{}</style><svg><text>s</text></svg>b</p>')
            )
        ).toBe('ab');
    });

    it('이미 렌더된 shadow(.echo-original-text)는 제외한다', () => {
        expect(
            collectText(block('<p>번역문<span class="echo-original-text">original</span></p>'))
        ).toBe('번역문');
    });

    it('숨김 요소는 제외한다', () => {
        expect(
            collectText(block('<p>a<span class="sr-only">x</span><span hidden>y</span>b</p>'))
        ).toBe('ab');
    });

    it('스타일시트로 숨긴 요소는 제외하지 않는다 (번역 전/후 규칙 일치)', () => {
        document.head.innerHTML = '<style>.gone { display: none; }</style>';
        expect(collectText(block('<p>a<span class="gone">x</span>b</p>'))).toBe('axb');
        document.head.innerHTML = '';
    });

    it('주석 노드는 무시한다', () => {
        expect(collectText(block('<p>a<!-- c -->b</p>'))).toBe('ab');
    });

    it('null이면 빈 문자열이다', () => {
        expect(collectText(null)).toBe('');
    });
});

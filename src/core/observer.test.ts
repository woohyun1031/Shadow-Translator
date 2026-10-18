import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Observer = typeof import('./observer');
type Snapshot = typeof import('./snapshot');

const RENDER_DEBOUNCE_MS = 300;
const FONT_REMOVAL_GRACE_MS = 50;

let observer: Observer;
let snapshot: Snapshot;

const $ = (id: string): HTMLElement => document.getElementById(id)!;
const shadowOf = (el: Element): string | null =>
    el.querySelector(':scope > .echo-original-text')?.textContent ?? null;
const shadowCount = (): number => document.querySelectorAll('.echo-original-text').length;

/** MutationObserver 콜백(microtask)을 돌린 뒤 타이머를 ms만큼 진행한다. */
const tick = async (ms = 0): Promise<void> => {
    await vi.advanceTimersByTimeAsync(ms);
};

const startTranslation = () => document.documentElement.classList.add('translated-ltr');
const stopTranslation = () => document.documentElement.classList.remove('translated-ltr');

/**
 * 블록의 콘텐츠를 교체한다. 크롬 번역기는 notranslate 요소(= shadow)는 건드리지 않으므로
 * shadow는 남기고 그 앞의 나머지 자식만 바꾼다.
 */
const replaceContent = (block: HTMLElement, markup: string): void => {
    Array.from(block.childNodes)
        .filter((n) => !(n instanceof Element && n.classList.contains('echo-original-text')))
        .forEach((n) => n.remove());
    block.insertAdjacentHTML('afterbegin', markup);
};

/** 크롬 번역기처럼 블록의 텍스트를 font로 교체한다. */
const translate = (block: HTMLElement, translated: string): void =>
    replaceContent(
        block,
        `<font style="vertical-align: inherit;"><font>${translated}</font></font>`
    );

/** 크롬 번역 해제처럼 font를 걷어내고 원문 텍스트를 되돌린다. */
const untranslate = (block: HTMLElement, original: string): void => replaceContent(block, original);

beforeEach(async () => {
    vi.useFakeTimers();
    document.documentElement.className = '';

    // 이전 테스트의 observer 인스턴스는 disconnect할 수 없으므로,
    // body를 통째로 교체해 그 인스턴스가 새 DOM의 변화를 보지 못하게 한다.
    document.documentElement.replaceChild(document.createElement('body'), document.body);

    vi.resetModules();
    snapshot = await import('./snapshot');
    observer = await import('./observer');
});

afterEach(async () => {
    // observer는 disconnect할 수 없다. jsdom이 내려가며 DOM을 지울 때 콜백이 돌지 않도록
    // 여기서 미리 비우고, 그로 인한 mutation 콜백과 타이머를 모두 소진한다.
    document.documentElement.className = '';
    document.body.innerHTML = '';
    await vi.runAllTimersAsync();
    vi.useRealTimers();
});

/** content.ts의 bootstrap과 같은 순서: 스냅샷 → observer → enable */
const boot = async (markup: string, { enabled = true } = {}): Promise<void> => {
    document.body.innerHTML = markup;
    snapshot.captureAll(document.body);
    observer.startObserver();
    observer.setEnabled(enabled);
    await tick();
};

describe('observer', () => {
    it('번역되면 디바운스 후 스냅샷 원문을 shadow로 표시한다', async () => {
        await boot('<p id="p">Hello <a href="#">world</a></p>');

        startTranslation();
        await tick();
        translate($('p'), '안녕 세상');
        await tick(RENDER_DEBOUNCE_MS - 1);
        expect(shadowOf($('p'))).toBeNull();

        await tick(1);
        expect(shadowOf($('p'))).toBe('Hello world');
    });

    it('스냅샷이 없는 블록은 렌더하지 않는다', async () => {
        await boot('<div id="root"></div>');
        startTranslation();
        await tick();

        // 번역된 상태로 새로 들어온 블록 — 원문을 알 수 없다
        $('root').innerHTML = '<p id="late"><font>이미 번역됨</font></p>';
        await tick(RENDER_DEBOUNCE_MS);

        expect(shadowCount()).toBe(0);
    });

    it('번역이 여러 배치로 도착해도 shadow는 하나만 유지된다', async () => {
        await boot('<p id="p">Hello world</p>');
        startTranslation();
        await tick();

        translate($('p'), '안녕');
        await tick(RENDER_DEBOUNCE_MS);
        translate($('p'), '안녕 세상');
        await tick(RENDER_DEBOUNCE_MS);

        expect($('p').querySelectorAll('.echo-original-text')).toHaveLength(1);
        expect(shadowOf($('p'))).toBe('Hello world');
    });

    it('원문과 번역문이 같으면 shadow를 만들지 않는다', async () => {
        await boot('<p id="p">v1.2.0</p>');
        startTranslation();
        await tick();

        translate($('p'), 'v1.2.0');
        await tick(RENDER_DEBOUNCE_MS);

        expect(shadowCount()).toBe(0);
    });

    it('번역 해제 시 모든 shadow를 지우고, 재번역하면 다시 표시한다', async () => {
        await boot('<p id="a">Apple</p><p id="b">Banana</p>');

        startTranslation();
        await tick();
        translate($('a'), '사과');
        translate($('b'), '바나나');
        await tick(RENDER_DEBOUNCE_MS);
        expect(shadowCount()).toBe(2);

        stopTranslation();
        await tick();
        expect(shadowCount()).toBe(0);
        untranslate($('a'), 'Apple');
        untranslate($('b'), 'Banana');
        await tick(FONT_REMOVAL_GRACE_MS);

        // 같은 번역문이 다시 들어와도 "이미 렌더함"으로 막히면 안 된다
        startTranslation();
        await tick();
        translate($('a'), '사과');
        translate($('b'), '바나나');
        await tick(RENDER_DEBOUNCE_MS);

        expect(shadowOf($('a'))).toBe('Apple');
        expect(shadowOf($('b'))).toBe('Banana');
    });

    it('꺼져 있으면 렌더하지 않고, 켜면 이미 번역된 블록에 바로 표시한다', async () => {
        await boot('<p id="p">Hello world</p>', { enabled: false });

        startTranslation();
        await tick();
        translate($('p'), '안녕 세상');
        await tick(RENDER_DEBOUNCE_MS);
        expect(shadowCount()).toBe(0);

        observer.setEnabled(true);
        expect(shadowOf($('p'))).toBe('Hello world');
    });

    it('끄면 표시 중인 shadow를 지우고, 다시 켜면 되살린다', async () => {
        await boot('<p id="p">Hello world</p>');
        startTranslation();
        await tick();
        translate($('p'), '안녕 세상');
        await tick(RENDER_DEBOUNCE_MS);
        expect(shadowCount()).toBe(1);

        observer.setEnabled(false);
        expect(shadowCount()).toBe(0);

        observer.setEnabled(true);
        expect(shadowOf($('p'))).toBe('Hello world');
    });

    it('번역 전에 동적으로 추가된 블록(SPA)의 원문도 확보한다', async () => {
        await boot('<div id="feed"></div>');

        $('feed').insertAdjacentHTML('beforeend', '<p id="item">Loaded later</p>');
        await tick();

        startTranslation();
        await tick();
        translate($('item'), '나중에 로드됨');
        await tick(RENDER_DEBOUNCE_MS);

        expect(shadowOf($('item'))).toBe('Loaded later');
    });

    it('번역 시작 신호 시점에 초기 캡처 이후의 콘텐츠를 보강 캡처한다', async () => {
        await boot('<p id="p">first</p>');

        // 빈 블록이 먼저 삽입되고(캡처할 텍스트 없음) 텍스트 노드가 나중에 붙는 경우,
        // 삽입 시점 캡처로는 놓친다 — 텍스트 노드 삽입은 블록 캡처를 일으키지 않는다.
        const late = document.createElement('p');
        late.id = 'late';
        document.body.appendChild(late);
        await tick();
        late.appendChild(document.createTextNode('late text'));
        await tick();
        expect(snapshot.getSnapshot(late)).toBeNull();

        startTranslation();
        await tick();

        expect(snapshot.getSnapshot(late)).toBe('late text');
    });

    it('font가 제거되고 유예 시간이 지나면 해당 블록의 shadow를 정리한다', async () => {
        await boot('<p id="a">Apple</p><p id="b">Banana</p>');
        startTranslation();
        await tick();
        translate($('a'), '사과');
        translate($('b'), '바나나');
        await tick(RENDER_DEBOUNCE_MS);

        untranslate($('a'), 'Apple');
        await tick(FONT_REMOVAL_GRACE_MS);

        expect(shadowOf($('a'))).toBeNull();
        expect(shadowOf($('b'))).toBe('Banana');
    });

    it('유예 시간 안에 font가 다시 들어오면(재번역 교체) shadow를 유지한다', async () => {
        await boot('<p id="p">Hello world</p>');
        startTranslation();
        await tick();
        translate($('p'), '안녕 세상');
        await tick(RENDER_DEBOUNCE_MS);

        translate($('p'), '안녕, 세상');
        await tick(FONT_REMOVAL_GRACE_MS);

        expect(shadowOf($('p'))).toBe('Hello world');
    });
});

// @vitest-environment node
/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Messages = Record<string, { message: string; description?: string }>;

const root = new URL('../', import.meta.url);
const readJson = <T>(path: string): T => JSON.parse(readFileSync(new URL(path, root), 'utf8')) as T;

const manifestText = readFileSync(new URL('manifest.json', root), 'utf8');
const manifest = JSON.parse(manifestText) as { default_locale?: string };
const locales = readdirSync(new URL('_locales/', root));
const messages = Object.fromEntries(
    locales.map((locale) => [locale, readJson<Messages>(`_locales/${locale}/messages.json`)])
);
const keysOf = (locale: string) => Object.keys(messages[locale]).sort();
const manifestKeys = [...manifestText.matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]);

// 팝업에서 쓰는 키: popup.html의 data-i18n(-속성)="key"와 popup.ts의 t('key', ...).
// 팝업에는 테스트가 없으므로 문구 누락은 여기서 잡는다.
const popupHtml = readFileSync(new URL('popup.html', root), 'utf8');
const popupTs = readFileSync(new URL('src/popup.ts', root), 'utf8');
const popupKeys = [
    ...[...popupHtml.matchAll(/data-i18n(?:-[\w-]+)?="(\w+)"/g)].map((m) => m[1]),
    ...[...popupTs.matchAll(/\bt\('(\w+)'/g)].map((m) => m[1]),
];

// 크롬 웹 스토어 한도. 글자 수는 코드 포인트 기준.
const LIMITS: Record<string, number> = { extName: 75, extDescription: 132 };
const length = (s: string) => [...s].length;

describe('_locales', () => {
    it('default_locale이 있고 그 폴더가 존재한다', () => {
        expect(manifest.default_locale).toBeDefined();
        expect(locales).toContain(manifest.default_locale);
    });

    it.each(locales)('%s: 키 집합이 default_locale과 같다', (locale) => {
        expect(keysOf(locale)).toEqual(keysOf(manifest.default_locale!));
    });

    it.each(locales)('%s: 모든 메시지가 비어 있지 않다', (locale) => {
        for (const [key, { message }] of Object.entries(messages[locale])) {
            expect(message.trim(), `${locale}.${key}`).not.toBe('');
        }
    });

    it.each(locales)('%s: manifest의 __MSG__ 키가 전부 있다', (locale) => {
        expect(manifestKeys.length).toBeGreaterThan(0);
        for (const key of manifestKeys) {
            expect(messages[locale], `${locale}에 ${key} 없음`).toHaveProperty(key);
        }
    });

    it.each(locales)('%s: 팝업에서 쓰는 키가 전부 있다', (locale) => {
        expect(popupKeys.length).toBeGreaterThan(0);
        for (const key of popupKeys) {
            expect(messages[locale], `${locale}에 ${key} 없음`).toHaveProperty(key);
        }
    });

    it.each(locales)('%s: name ≤75자, description ≤132자', (locale) => {
        for (const [key, max] of Object.entries(LIMITS)) {
            const text = messages[locale][key].message;
            expect(length(text), `${locale}.${key} = "${text}"`).toBeLessThanOrEqual(max);
        }
    });
});

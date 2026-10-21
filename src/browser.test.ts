import { describe, expect, it } from 'vitest';
import { isGoogleChrome } from './browser';

const nav = (brands?: string[]) =>
    (brands
        ? { userAgentData: { brands: brands.map((brand) => ({ brand, version: '130' })) } }
        : {}) as unknown as Navigator;

describe('isGoogleChrome', () => {
    it('brands에 Google Chrome이 있으면 true', () => {
        expect(isGoogleChrome(nav(['Chromium', 'Google Chrome', 'Not-A.Brand']))).toBe(true);
    });

    it('Edge 등 다른 크로미움 브라우저는 false', () => {
        expect(isGoogleChrome(nav(['Microsoft Edge', 'Chromium', 'Not:A-Brand']))).toBe(false);
        expect(isGoogleChrome(nav(['Chromium', 'Not-A.Brand']))).toBe(false);
    });

    it('비슷한 이름은 크롬으로 보지 않는다', () => {
        expect(isGoogleChrome(nav(['Google Chrome for Testing', 'Chromium']))).toBe(false);
    });

    it('판별 수단이 없으면 true (오탐 방지)', () => {
        expect(isGoogleChrome(nav())).toBe(true);
    });
});

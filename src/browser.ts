type Brand = { brand: string; version: string };
type NavigatorWithUAData = Navigator & { userAgentData?: { brands: Brand[] } };

/**
 * Google Chrome인지 판별한다. 이 확장은 크롬 번역기가 DOM을 고쳐 쓰는 방식에만 맞춰져 있다.
 *
 * - `navigator.vendor`·UA 문자열은 크로미움 계열이 전부 크롬과 같게 보고하므로 쓰지 않는다.
 * - `userAgentData.brands`에 "Google Chrome"이 있을 때만 크롬으로 본다(화이트리스트).
 *   새 브라우저가 나와도 목록을 고칠 필요가 없다.
 * - 판별 수단이 없으면 크롬으로 본다. 크롬 사용자에게 잘못된 안내를 띄우지 않는 쪽을 택한다.
 */
export function isGoogleChrome(nav: Navigator = navigator): boolean {
    const brands = (nav as NavigatorWithUAData).userAgentData?.brands;
    if (!brands) return true;
    return brands.some((b) => b.brand === 'Google Chrome');
}

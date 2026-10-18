import { startObserver, setEnabled } from './core/observer';
import { captureAll } from './core/snapshot';
import { setShadowStyle } from './core/renderer';
import type { ShadowStyle } from './core/defaults';

(function () {
    console.log('Shadow-Translator: Modular entry point initialized.');

    const bootstrap = () => {
        if (!document.body) {
            setTimeout(bootstrap, 50);
            return;
        }

        // 번역 전 원문을 최대한 이른 시점에 확보한다.
        // storage 조회는 비동기이므로 기다리지 않는다 — 그 사이에 번역이 시작될 수 있다.
        captureAll(document.body);
        startObserver();

        if (typeof chrome === 'undefined' || !chrome.storage) return;

        chrome.storage.local.get(['isEnabled', 'shadowStyle'], (result) => {
            setShadowStyle(result.shadowStyle as Partial<ShadowStyle> | undefined);
            setEnabled(result.isEnabled !== false);
        });

        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace !== 'local') return;
            if (changes.isEnabled !== undefined) {
                setEnabled(changes.isEnabled.newValue as boolean);
            }
            if (changes.shadowStyle !== undefined) {
                setShadowStyle(changes.shadowStyle.newValue as Partial<ShadowStyle> | undefined);
            }
        });
    };

    bootstrap();
})();

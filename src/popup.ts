import { DEFAULT_SHADOW_STYLE, RangeKey, SHADOW_STYLE_RANGES, ShadowStyle } from './core/defaults';

const FORMATTERS: Record<RangeKey, (v: number) => string> = {
    fontSize: (v) => `${Number(v).toFixed(2)}em`,
    lineHeight: (v) => Number(v).toFixed(1),
    opacity: (v) => Number(v).toFixed(2),
};

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function mergeStyle(stored?: Partial<ShadowStyle> | null): ShadowStyle {
    return { ...DEFAULT_SHADOW_STYLE, ...(stored || {}) };
}

function sanitizeStyle(style: ShadowStyle): ShadowStyle {
    const out = { ...style };
    for (const key of Object.keys(SHADOW_STYLE_RANGES) as RangeKey[]) {
        if (out[key] === undefined) continue;
        const { min, max } = SHADOW_STYLE_RANGES[key];
        out[key] = clamp(Number(out[key]), min, max);
    }
    return out;
}

function init() {
    const popup = document.getElementById('popup');
    const toggleSwitch = document.getElementById('toggleSwitch') as HTMLInputElement | null;
    const enableSub = document.getElementById('enableSub') as HTMLElement;
    const hintMessage = document.getElementById('hintMessage') as HTMLElement;

    const openSettingsBtn = document.getElementById('openSettings');
    const drawer = document.getElementById('drawer');
    const scrim = document.getElementById('scrim') as HTMLElement;
    const closeDrawerBtn = document.getElementById('closeDrawer') as HTMLElement;

    const swatchesEl = document.getElementById('swatches');
    const customColorInput = document.getElementById('customColor') as HTMLInputElement;
    const colorOut = document.getElementById('colorOut') as HTMLElement;

    const ranges: Record<RangeKey, HTMLInputElement> = {
        fontSize: document.getElementById('sizeRange') as HTMLInputElement,
        lineHeight: document.getElementById('lineRange') as HTMLInputElement,
        opacity: document.getElementById('opRange') as HTMLInputElement,
    };
    const outs: Record<RangeKey, HTMLElement> = {
        fontSize: document.getElementById('sizeOut') as HTMLElement,
        lineHeight: document.getElementById('lineOut') as HTMLElement,
        opacity: document.getElementById('opOut') as HTMLElement,
    };

    const resetBtn = document.getElementById('btnReset') as HTMLElement;
    const cancelBtn = document.getElementById('btnCancel') as HTMLElement;
    const saveBtn = document.getElementById('btnSave') as HTMLElement;

    if (
        !popup ||
        !toggleSwitch ||
        !openSettingsBtn ||
        !drawer ||
        !swatchesEl ||
        !ranges.fontSize ||
        !ranges.lineHeight ||
        !ranges.opacity
    ) {
        console.error('[Shadow Translator] popup elements missing — check popup.html ids');
        return;
    }

    let state: ShadowStyle = { ...DEFAULT_SHADOW_STYLE };
    let originalStyle: ShadowStyle | null = null;

    function applyToForm() {
        const hex = (state.color || '').toString();
        colorOut.textContent = hex.toUpperCase();
        customColorInput.value = hex;

        swatchesEl!.querySelectorAll<HTMLElement>('.swatch[data-color]').forEach((el) => {
            el.classList.toggle('active', el.dataset.color!.toLowerCase() === hex.toLowerCase());
        });

        for (const key of Object.keys(ranges) as RangeKey[]) {
            ranges[key].value = state[key] as unknown as string;
            outs[key].textContent = FORMATTERS[key](state[key]);
        }
    }

    function writeStyle() {
        chrome.storage.local.set({ shadowStyle: sanitizeStyle(state) });
    }

    // --- Enable toggle ---
    function setEnabledUI(enabled: boolean) {
        popup!.dataset.popupEnabled = enabled ? 'true' : 'false';
        enableSub.textContent = enabled ? 'Active on this page' : 'Paused — toggle to resume';
    }

    chrome.storage.local.get(['isEnabled', 'shadowStyle'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('[Shadow Translator] storage.get error:', chrome.runtime.lastError);
            return;
        }
        const enabled = result.isEnabled !== false;
        toggleSwitch.checked = enabled;
        setEnabledUI(enabled);
        state = mergeStyle((result && result.shadowStyle) as Partial<ShadowStyle> | undefined);
        applyToForm();
    });

    toggleSwitch.addEventListener('change', (e) => {
        const on = (e.target as HTMLInputElement).checked;
        chrome.storage.local.set({ isEnabled: on });
        setEnabledUI(on);
        hintMessage.style.display = 'block';
        hintMessage.innerText = 'Please re-run Google Translate to apply changes.';
    });

    // --- Drawer ---
    function openDrawer() {
        originalStyle = { ...state };
        drawer!.classList.add('open');
        scrim.classList.add('open');
    }

    function closeDrawerKeep() {
        drawer!.classList.remove('open');
        scrim.classList.remove('open');
        originalStyle = null;
    }

    function closeDrawerRevert() {
        if (originalStyle) {
            state = { ...originalStyle };
            writeStyle();
            applyToForm();
        }
        drawer!.classList.remove('open');
        scrim.classList.remove('open');
        originalStyle = null;
    }

    openSettingsBtn.addEventListener('click', openDrawer);
    closeDrawerBtn.addEventListener('click', closeDrawerRevert);
    cancelBtn.addEventListener('click', closeDrawerRevert);
    scrim.addEventListener('click', closeDrawerRevert);
    saveBtn.addEventListener('click', closeDrawerKeep);

    // --- Swatches ---
    swatchesEl.querySelectorAll<HTMLElement>('.swatch[data-color]').forEach((el) => {
        el.addEventListener('click', () => {
            state = { ...state, color: el.dataset.color! };
            applyToForm();
            writeStyle();
        });
    });
    customColorInput.addEventListener('input', (e) => {
        state = { ...state, color: (e.target as HTMLInputElement).value };
        applyToForm();
        writeStyle();
    });

    // --- Ranges ---
    for (const key of Object.keys(ranges) as RangeKey[]) {
        ranges[key].addEventListener('input', (e) => {
            const v = parseFloat((e.target as HTMLInputElement).value);
            state = { ...state, [key]: v };
            outs[key].textContent = FORMATTERS[key](v);
            writeStyle();
        });
    }

    // --- Reset ---
    resetBtn.addEventListener('click', () => {
        state = { ...DEFAULT_SHADOW_STYLE };
        applyToForm();
        writeStyle();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

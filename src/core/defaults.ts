export interface ShadowStyle {
    color: string;
    fontSize: number;
    marginTop: number;
    textAlign: string;
    lineHeight: number;
    opacity: number;
}

/** 슬라이더로 조절 가능한 수치 항목. SHADOW_STYLE_RANGES의 키와 1:1로 대응한다. */
export type RangeKey = 'fontSize' | 'lineHeight' | 'opacity';

export interface ShadowStyleRange {
    min: number;
    max: number;
    step: number;
}

export const DEFAULT_SHADOW_STYLE: ShadowStyle = {
    color: '#787878',
    fontSize: 0.9,
    marginTop: 6,
    textAlign: 'left',
    lineHeight: 1.4,
    opacity: 0.8,
};

export const SHADOW_STYLE_RANGES: Record<RangeKey, ShadowStyleRange> = {
    fontSize: { min: 0.5, max: 1.6, step: 0.05 },
    lineHeight: { min: 1.0, max: 2.0, step: 0.1 },
    opacity: { min: 0.2, max: 1.0, step: 0.05 },
};

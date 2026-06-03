export type Rgba = number; // Unsigned 0xRRGGBBAA.

export const RGB_MASK = 0xffffff00;
export const ALPHA_MASK = 0x000000ff;

export function packRgba(r: number, g: number, b: number, alpha: number): Rgba {
    return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (alpha & 0xff)) >>> 0;
}

export function rgbOf(rgba: Rgba): number {
    return (rgba & RGB_MASK) >>> 0;
}

export function alphaOf(rgba: Rgba): number {
    return rgba & ALPHA_MASK;
}

export function withRgb(rgba: Rgba, rgb: number): Rgba {
    return ((rgb & RGB_MASK) | alphaOf(rgba)) >>> 0;
}

export function withAlpha(rgba: Rgba, alpha: number): Rgba {
    return (rgbOf(rgba) | (alpha & ALPHA_MASK)) >>> 0;
}

export function rgbToHex(rgb: number): string {
    return `#${(`000000${((rgb >>> 8) & 0xffffff).toString(16)}`).slice(-6)}`;
}

export function hexToRgb(hex: string): number {
    return (parseInt(hex.replace(/^#/, ""), 16) << 8) >>> 0;
}

export function rgbaToCss(rgba: Rgba): string {
    const r = (rgba >>> 24) & 0xff;
    const g = (rgba >>> 16) & 0xff;
    const b = (rgba >>> 8) & 0xff;
    return `rgba(${r},${g},${b},${alphaOf(rgba) / 255})`;
}

export const RGB_PRESETS = [
    packRgba(255, 0, 0, 0),
    packRgba(255, 127, 0, 0),
    packRgba(255, 255, 0, 0),
    packRgba(192, 255, 0, 0),
    packRgba(0, 255, 0, 0),
    packRgba(0, 255, 127, 0),
    packRgba(0, 255, 255, 0),
    packRgba(0, 127, 255, 0),
    packRgba(0, 0, 255, 0),
    packRgba(127, 0, 255, 0),
    packRgba(255, 0, 255, 0),
    packRgba(255, 0, 127, 0),
    packRgba(50, 50, 50, 0),
    packRgba(127, 127, 127, 0),
    packRgba(255, 255, 255, 0),
];

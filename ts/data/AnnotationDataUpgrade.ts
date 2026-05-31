import { ANNOTATION_DATA_VERSION, AnnotationData } from "./Annotation";

type JsonObject = { [key: string]: any };
type Upgrade = (data: JsonObject) => JsonObject;

const LEGACY_COLORS: { [name: string]: { r: number; g: number; b: number } } = {
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 255, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    cyan: { r: 0, g: 255, b: 255 },
    purple: { r: 255, g: 0, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    orange: { r: 255, g: 127, b: 0 },
    gray: { r: 127, g: 127, b: 127 },
    white: { r: 255, g: 255, b: 255 },
};

const LEGACY_ALPHAS: { [name: string]: number } = {
    "15": 0.15,
    "25": 0.25,
    "50": 0.50,
    "75": 0.75,
    "100": 1.00,
};

function legacyColor(name: string): { r: number; g: number; b: number } {
    return LEGACY_COLORS[name] || LEGACY_COLORS.white;
}

function legacyAlpha(name: string): number {
    return LEGACY_ALPHAS[name] === undefined ? 1 : LEGACY_ALPHAS[name];
}

const upgradeV1ToV2: Upgrade = data => ({
    version: 2,
    polylines: (data.polylines || []).map((polyline: JsonObject) => ({
        points: polyline.points,
        closed: polyline.closed,
        lineWidth: polyline.lineWidth,
        fill: polyline.fill,
        fillColor: legacyColor(polyline.fillColorName),
        fillAlpha: legacyAlpha(polyline.fillAlphaName),
        stroke: polyline.stroke,
        strokeColor: legacyColor(polyline.strokeColorName),
        strokeAlpha: legacyAlpha(polyline.strokeAlphaName),
    })),
    texts: (data.texts || []).map((text: JsonObject) => ({
        text: text.text,
        color: legacyColor(text.colorName),
        alpha: legacyAlpha(text.alphaName),
        fontSize: text.fontSize,
        x: text.x,
        y: text.y,
        multiline: !!text.multiline,
    })),
});

const upgrades: { [version: number]: Upgrade } = {
    1: upgradeV1ToV2,
};

export function upgradeAnnotationData(input: unknown): AnnotationData {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new Error("Invalid annotation JSON");
    }

    let data = input as JsonObject;
    let version = typeof data.version === "number" ? data.version : 1;
    if (!Number.isInteger(version) || version < 1) {
        throw new Error(`Invalid annotation JSON version: ${version}`);
    }
    if (version > ANNOTATION_DATA_VERSION) {
        throw new Error(`Unsupported annotation JSON version: ${version}`);
    }

    while (version < ANNOTATION_DATA_VERSION) {
        const upgrade = upgrades[version];
        if (!upgrade) throw new Error(`Missing annotation JSON upgrade: ${version}`);
        data = upgrade(data);
        version = data.version;
    }

    return data as AnnotationData;
}

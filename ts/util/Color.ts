export class ColorEntry {
    public constructor(public r: number, public g: number, public b: number) {
    }

    public static fromHex(hex: string): ColorEntry {
        const value = hex.replace(/^#/, "");
        return new ColorEntry(
            parseInt(value.substring(0, 2), 16),
            parseInt(value.substring(2, 4), 16),
            parseInt(value.substring(4, 6), 16),
        );
    }

    public toHex(): string {
        const toHex = (value: number) => (`0${value.toString(16)}`).slice(-2);
        return `#${toHex(this.r)}${toHex(this.g)}${toHex(this.b)}`;
    }

    public equals(other: ColorEntry): boolean {
        return this.r === other.r && this.g === other.g && this.b === other.b;
    }

    public static readonly list = [
        new ColorEntry(255, 0, 0),
        new ColorEntry(0, 255, 0),
        new ColorEntry(0, 0, 255),
        new ColorEntry(0, 255, 255),
        new ColorEntry(255, 0, 255),
        new ColorEntry(255, 255, 0),
        new ColorEntry(255, 127, 0),
        new ColorEntry(127, 127, 127),
        new ColorEntry(255, 255, 255),
    ];
}

export class AlphaEntry {
    public constructor(public value: number) {
    }

    public equals(other: AlphaEntry): boolean {
        return this.value === other.value;
    }

    public static readonly list = [
        new AlphaEntry(0.15),
        new AlphaEntry(0.25),
        new AlphaEntry(0.50),
        new AlphaEntry(0.75),
        new AlphaEntry(1.00),
    ];
}

export function combineColorAlpha(color: ColorEntry, alpha: AlphaEntry): string {
    return "rgba(" + color.r + "," + color.g + "," + color.b + "," + alpha.value + ")";
}

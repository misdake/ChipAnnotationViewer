export class ColorEntry {
    public constructor(public name: string, public r: number, public g: number, public b: number) {
    }

    public static findByName(name: string): ColorEntry {
        for (const colorValue of this.list) {
            if (name == colorValue.name) {
                return colorValue;
            }
        }
        return this.list[0];
    }

    public static list = [
        new ColorEntry("red", 255, 0, 0),
        new ColorEntry("green", 0, 255, 0),
        new ColorEntry("blue", 0, 0, 255),
        new ColorEntry("cyan", 0, 255, 255),
        new ColorEntry("purple", 255, 0, 255),
        new ColorEntry("yellow", 255, 255, 0),
        new ColorEntry("gray", 127, 127, 127),
        new ColorEntry("white", 255, 255, 255),
    ];
}

export class AlphaEntry {
    public constructor(public name: string, public buttonColor: string, public value: number) {
    }

    public static findByName(name: string): AlphaEntry {
        for (const alphaValue of this.list) {
            if (name == alphaValue.name) {
                return alphaValue;
            }
        }
        return this.list[0];
    }
    public static findByValue(value: number): AlphaEntry {
        for (const alphaValue of this.list) {
            if (value == alphaValue.value) {
                return alphaValue;
            }
        }
        return this.list[0];
    }

    public static list = [
        new AlphaEntry("15", "rgb(217,217,217)", 0.15),
        new AlphaEntry("25", "rgb(191,191,191)", 0.25),
        new AlphaEntry("50", "rgb(127,127,127)", 0.50),
        new AlphaEntry("75", "rgb(63,63,63)", 0.75),
        new AlphaEntry("100", "rgb(0,0,0)", 1.00),
    ];
}

export function combineColorAlpha(color: ColorEntry, alpha: AlphaEntry): string {
    return "rgba(" + color.r + "," + color.g + "," + color.b + "," + alpha.value + ")";
}

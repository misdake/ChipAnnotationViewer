class ColorEntry {
    public constructor(public name: string, public r: number, public g: number, public b: number) {
    }
}

class AlphaEntry {
    public constructor(public name: string, public buttonColor: string, public value: number) {
    }
}

export class Ui {

    static bindButtonOnClick(id: string, onclick: () => void) {
        let button: HTMLButtonElement = <HTMLButtonElement>document.getElementById(id);
        button.onclick = onclick;
    }

    static setVisibility(id: string, visible: boolean) {
        let element: HTMLElement = document.getElementById(id);
        element.style.visibility = visible ? "visible" : "hidden";
    }

    static bindCheckbox(id: string, initialValue: boolean, onchange: (newValue: boolean) => void) {
        let checkbox = <HTMLInputElement>document.getElementById(id);
        checkbox.checked = initialValue;
        checkbox.onchange = ev => {
            onchange(checkbox.checked);
        };
    }

    static bindValue(id: string, initialValue: string, onchange: (newValue: string) => void) {
        let colorPicker = <HTMLInputElement>document.getElementById(id);
        colorPicker.value = initialValue;
        colorPicker.onchange = ev => {
            onchange(colorPicker.value);
        };
    }

    private static colorValues = [
        new ColorEntry("gray", 127, 127, 127),
        new ColorEntry("white", 255, 255, 255),
        new ColorEntry("red", 255, 0, 0),
        new ColorEntry("green", 0, 255, 0),
        new ColorEntry("blue", 0, 0, 255),
        new ColorEntry("cyan", 0, 255, 255),
        new ColorEntry("purple", 255, 0, 255),
        new ColorEntry("yellow", 255, 255, 0),
    ];
    private static alphaValues = [
        new AlphaEntry("25", "rgb(255,255,255)", 0.25),
        new AlphaEntry("50", "rgb(191,191,191)", 0.50),
        new AlphaEntry("75", "rgb(127,127,127)", 0.75),
        new AlphaEntry("100", "rgb(63,63,63)", 1.00),
    ];

    static bindColor(colorContainerId: string, alphaContainerId: string, initialColor: string, initialAlpha: string, onchange: (newColor: string, newAlpha: string, colorString: string) => void) {
        let colorContainer = <HTMLInputElement>document.getElementById(colorContainerId);
        let alphaContainer = <HTMLInputElement>document.getElementById(alphaContainerId);
        colorContainer.innerHTML = "";
        alphaContainer.innerHTML = "";

        let thisColor = this.colorValues[0];
        let thisAlpha = this.alphaValues[0];

        for (const colorValue of Ui.colorValues) {
            if (initialColor == colorValue.name) {
                thisColor = colorValue;
            }
        }
        for (const alphaValue of Ui.alphaValues) {
            if (initialAlpha == alphaValue.name) {
                thisAlpha = alphaValue;
            }
        }

        for (const colorValue of Ui.colorValues) {
            let id = colorContainerId + "_" + colorValue.name;
            let style = "background:" + colorValue.name;
            colorContainer.innerHTML = colorContainer.innerHTML + "<button id=\"" + id + "\" class=\"configColorButton\" style=\"" + style + "\"></button>\n";
        }
        for (const alphaValue of Ui.alphaValues) {
            let id = alphaContainerId + "_" + alphaValue.name;
            let style = "background:" + alphaValue.buttonColor;
            alphaContainer.innerHTML = alphaContainer.innerHTML + "<button id=\"" + id + "\" class=\"configAlphaButton\" style=\"" + style + "\"></button>\n";
        }

        for (const colorValue of Ui.colorValues) {
            let id = colorContainerId + "_" + colorValue.name;
            let button: HTMLButtonElement = <HTMLButtonElement>document.getElementById(id);
            button.onclick = ev => {
                thisColor = colorValue;
                let colorString = "rgba(" + thisColor.r + "," + thisColor.g + "," + thisColor.b + "," + thisAlpha.value + ")";
                onchange(thisColor.name, thisAlpha.name, colorString);
            };
        }
        for (const alphaValue of Ui.alphaValues) {
            let id = alphaContainerId + "_" + alphaValue.name;
            let button: HTMLButtonElement = <HTMLButtonElement>document.getElementById(id);
            button.onclick = ev => {
                thisAlpha = alphaValue;
                let colorString = "rgba(" + thisColor.r + "," + thisColor.g + "," + thisColor.b + "," + thisAlpha.value + ")";
                onchange(thisColor.name, thisAlpha.name, colorString);
            };
        }
    }

    static bindNumber(id: string, initialValue: number, onchange: (newValue: number) => void) {
        let input = <HTMLInputElement>document.getElementById(id);
        input.value = initialValue.toString();
        input.onchange = ev => {
            let result = parseFloat(input.value);
            if (result >= 0) {
                onchange(result);
            } else {
                input.value = "0";
                onchange(0);
            }
        };
    }

}
import {AlphaEntry, ColorEntry} from "./Color";

export class Ui {

    static setContent(id: string, content: string) {
        let element = document.getElementById(id);
        element.innerHTML = content;
    }

    static bindButtonOnClick(id: string, onclick: () => void) {
        let button: HTMLButtonElement = <HTMLButtonElement>document.getElementById(id);
        button.onclick = onclick;
    }

    static setVisibility(id: string, visible: boolean) {
        let element: HTMLElement = document.getElementById(id);
        element.style.display = visible ? "block" : "none";
    }

    static bindCheckbox(id: string, initialValue: boolean, onchange: (newValue: boolean) => void) {
        let checkbox = <HTMLInputElement>document.getElementById(id);
        checkbox.checked = initialValue;
        checkbox.onchange = ev => {
            onchange(checkbox.checked);
        };
    }

    static bindValue(id: string, initialValue: string, onchange: (newValue: string) => void) {
        let element = <HTMLInputElement>document.getElementById(id);
        element.value = initialValue;
        element.oninput = element.onchange = ev => {
            onchange(element.value);
        };
    }

    static bindColor(colorContainerId: string, alphaContainerId: string, initialColor: ColorEntry, initialAlpha: AlphaEntry, onchange: (newColor: ColorEntry, newAlpha: AlphaEntry) => void) {
        let colorContainer = <HTMLInputElement>document.getElementById(colorContainerId);
        let alphaContainer = <HTMLInputElement>document.getElementById(alphaContainerId);
        colorContainer.innerHTML = "";
        alphaContainer.innerHTML = "";

        let thisColor = initialColor;
        let thisAlpha = initialAlpha;

        for (const colorValue of ColorEntry.list) {
            let id = colorContainerId + "_" + colorValue.name;
            let style = "background:" + colorValue.name;
            colorContainer.innerHTML = colorContainer.innerHTML + "<button id=\"" + id + "\" class=\"configColorButton\" style=\"" + style + "\"></button>\n";
        }
        for (const alphaValue of AlphaEntry.list) {
            let id = alphaContainerId + "_" + alphaValue.name;
            let style = "background:" + alphaValue.buttonColor;
            alphaContainer.innerHTML = alphaContainer.innerHTML + "<button id=\"" + id + "\" class=\"configAlphaButton\" style=\"" + style + "\"></button>\n";
        }

        for (const colorValue of ColorEntry.list) {
            let id = colorContainerId + "_" + colorValue.name;
            let button: HTMLButtonElement = <HTMLButtonElement>document.getElementById(id);
            button.onclick = ev => {
                thisColor = colorValue;
                onchange(thisColor, thisAlpha);
            };
        }
        for (const alphaValue of AlphaEntry.list) {
            let id = alphaContainerId + "_" + alphaValue.name;
            let button: HTMLButtonElement = <HTMLButtonElement>document.getElementById(id);
            button.onclick = ev => {
                thisAlpha = alphaValue;
                onchange(thisColor, thisAlpha);
            };
        }
    }

    static bindNumber(id: string, initialValue: number, onchange: (newValue: number) => void) {
        let input = <HTMLInputElement>document.getElementById(id);
        input.value = initialValue.toString();
        input.oninput = input.onchange = ev => {
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
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
        let checkbox = <HTMLInputElement> document.getElementById(id);
        checkbox.checked = initialValue;
        checkbox.onchange = ev => {
            onchange(checkbox.checked);
        };
    }

    static bindValue(id: string, initialValue: string, onchange: (newValue: string) => void) {
        let colorPicker = <HTMLInputElement> document.getElementById(id);
        colorPicker.value = initialValue;
        colorPicker.onchange = ev => {
            onchange(colorPicker.value);
        };
    }

    static bindNumber(id: string, initialValue: number, onchange: (newValue: number) => void) {
        let input = <HTMLInputElement> document.getElementById(id);
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
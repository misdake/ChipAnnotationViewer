import { css, customElement, html, LitElement, property } from 'lit-element';

@customElement('number-input')
export class NumberInputElement extends LitElement {

    @property()
    value: number | null | undefined = null;

    @property()
    placeholder: string = '-';

    @property()
    min: number | undefined;

    @property()
    max: number | undefined;

    @property()
    onChange: (value: number) => void;

    private isEmpty(): boolean {
        return this.value === null || this.value === undefined;
    }

    private handleInput(e: Event) {
        const input = e.target as HTMLInputElement;
        const val = input.value.trim();

        if (val === '') {
            this.value = this.min ?? 0;
        } else {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                this.value = num;
            }
        }

        if (this.onChange) {
            this.onChange(this.value!);
        }
    }

    static override styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            vertical-align: middle;
        }

        input {
            width: 60px;
            padding: 2px 4px;
            border: 1px solid #666;
            border-radius: 3px;
            background: #fff;
            color: #333;
            font-size: 12px;
            text-align: center;
            -moz-appearance: textfield;
        }

        // input::-webkit-outer-spin-button,
        // input::-webkit-inner-spin-button {
        //     -webkit-appearance: none;
        //     margin: 0;
        // }

        input:focus {
            outline: none;
            border-color: #4a90d9;
        }

        input.empty {
            color: #999;
        }

        input::placeholder {
            color: #999;
        }
    `;

    render() {
        const displayValue = this.isEmpty() ? '-' : String(this.value);

        return html`
            <input
                type="number"
                class="${this.isEmpty() ? 'empty' : ''}"
                .value="${displayValue}"
                placeholder="${this.placeholder}"
                min="${this.min !== undefined ? this.min : ''}"
                max="${this.max !== undefined ? this.max : ''}"
                @input="${this.handleInput}"
            >
        `;
    }
}

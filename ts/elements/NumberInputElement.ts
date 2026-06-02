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
    compact: boolean = false;

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
                this.value = Math.max(this.min ?? num, Math.min(this.max ?? num, num));
            }
        }
        input.value = String(this.value);

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
            padding: 4px 8px;
            border: 1px solid #334155;
            border-radius: 4px;
            box-sizing: border-box;
            background: #1e293b;
            color: #f1f5f9;
            font-family: inherit;
            font-size: 13px;
            text-align: center;
            transition: all 0.2s ease;
            appearance: textfield;
            -moz-appearance: textfield;
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
            margin: 0;
            -webkit-appearance: none;
        }

        input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        input.compact {
            width: 40px;
            padding: 3px 4px;
            font-size: 12px;
        }

        input.empty {
            color: #94a3b8;
        }

        input::placeholder {
            color: #94a3b8;
        }
    `;

    render() {
        const displayValue = this.isEmpty() ? '-' : String(this.value);

        return html`
            <input
                type="number"
                class="${this.isEmpty() ? 'empty' : ''}${this.compact ? ' compact' : ''}"
                .value="${displayValue}"
                placeholder="${this.placeholder}"
                min="${this.min !== undefined ? this.min : ''}"
                max="${this.max !== undefined ? this.max : ''}"
                @input="${this.handleInput}"
            >
        `;
    }
}

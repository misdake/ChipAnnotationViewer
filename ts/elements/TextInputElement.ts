import { css, customElement, html, LitElement, property } from 'lit-element';

@customElement('text-input')
export class TextInputElement extends LitElement {

    @property()
    value: string | null | undefined = null;

    @property()
    placeholder: string = '-';

    @property()
    onChange: (value: string) => void;

    private isEmpty(): boolean {
        return this.value === null || this.value === undefined;
    }

    private handleInput(e: Event) {
        const input = e.target as HTMLInputElement;
        const val = input.value;
        this.value = val;

        if (this.onChange) {
            this.onChange(val);
        }
    }

    static override styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            vertical-align: middle;
        }

        input {
            width: 120px;
            padding: 2px 4px;
            border: 1px solid #666;
            border-radius: 3px;
            background: #fff;
            color: #333;
            font-size: 12px;
        }

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
        const displayValue = this.isEmpty() ? '' : String(this.value);

        return html`
            <input
                type="text"
                class="${this.isEmpty() ? 'empty' : ''}"
                .value="${displayValue}"
                placeholder="${this.placeholder}"
                @input="${this.handleInput}"
            >
        `;
    }
}

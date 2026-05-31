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

    createRenderRoot() {
        return this;
    }
}

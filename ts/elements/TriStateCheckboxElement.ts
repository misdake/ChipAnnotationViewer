import { css, customElement, html, LitElement, property } from 'lit-element';

@customElement('tristate-checkbox')
export class TriStateCheckboxElement extends LitElement {

    @property()
    state: 'none' | 'some' | 'all' = 'none';

    @property()
    label: string = '';

    @property()
    onChange: (state: 'none' | 'all') => void;

    static override styles = css`
        :host {
            display: inline;
            cursor: pointer;
            user-select: none;
            // line-height: 24px;
            // height: 24px;
            vertical-align: middle;
        }

        .tsc-box {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid #666;
            border-radius: 3px;
            background: #fff;
            transition: all 0.2s;
            vertical-align: middle;
            text-align: center;
        }

        :host(:hover) .tsc-box {
            border-color: #333;
        }

        .tsc-box svg {
            width: 14px;
            height: 14px;
            vertical-align: top;
        }

        .tsc-box.tsc-checked {
            background: #4a90d9;
            border-color: #4a90d9;
        }

        .tsc-label {
            display: inline;
            white-space: nowrap;
            vertical-align: middle;
        }
    `;

    private toggle() {
        const nextState: 'none' | 'all' = this.state === 'all' ? 'none' : 'all';
        if (this.onChange) {
            this.onChange(nextState);
        } else {
            this.state = nextState;
        }
    }

    private getSvg() {
        if (this.state === 'none') {
            return html``;
        } else if (this.state === 'some') {
            return html`
                <svg viewBox="0 0 14 14">
                    <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
        } else {
            return html`
                <svg viewBox="0 0 24 24">
                    <polyline points="4,12 10,18 20,6" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }
    }

    render() {
        return html`
            <span class="tsc-box ${this.state === 'all' ? 'tsc-checked' : ''}" @click=${() => this.toggle()}>
                ${this.getSvg()}
            </span>
            ${this.label ? html`<span class="tsc-label" @click=${() => this.toggle()}>${this.label}</span>` : ''}
        `;
    }

}

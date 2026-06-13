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
            display: inline-flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            user-select: none;
        }

        .tsc-box {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            width: 11px;
            height: 11px;
            border: 1px solid #666;
            border-radius: 2px;
            background: #fff;
            transition: all 0.2s;
        }

        :host(:hover) .tsc-box {
            border-color: #333;
        }

        .tsc-box svg {
            width: 11px;
            height: 11px;
            vertical-align: top;
        }

        .tsc-box.tsc-checked {
            background: #4a90d9;
            border-color: #4a90d9;
        }

        .tsc-label {
            display: inline-flex;
            align-items: center;
            white-space: nowrap;
            font-size: 12px;
            line-height: 16px;
            font-weight: 400;
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
            <span class="tsc-box ${this.state !== 'none' ? 'tsc-checked' : ''}" @click=${() => this.toggle()}>
                ${this.getSvg()}
            </span>
            ${this.label ? html`<span class="tsc-label" @click=${() => this.toggle()}>${this.label}</span>` : ''}
        `;
    }

}

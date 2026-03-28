import { customElement, html, LitElement, property } from "lit-element";
import { AlphaEntry, ColorEntry } from "../util/Color";

@customElement('coloralpha-element')
export class ColorAlphaElement extends LitElement {

    @property()
    private setColor: (color: ColorEntry) => void;
    @property()
    private setAlpha: (alpha: AlphaEntry) => void;
    @property()
    private currentColor: ColorEntry | undefined = undefined;
    @property()
    private currentAlpha: AlphaEntry | undefined = undefined;

    private isSelected(color: ColorEntry): boolean {
        return this.currentColor !== undefined && this.currentColor.name === color.name;
    }

    private isAlphaSelected(alpha: AlphaEntry): boolean {
        return this.currentAlpha !== undefined && this.currentAlpha.value === alpha.value;
    }

    private getColorButtonClass(color: ColorEntry): string {
        const selected = this.isSelected(color) ? 'selected' : '';
        const empty = this.currentColor === undefined ? 'empty' : '';
        return `configColorButton ${selected} ${empty}`.trim();
    }

    private getAlphaButtonClass(alpha: AlphaEntry): string {
        const selected = this.isAlphaSelected(alpha) ? 'selected' : '';
        const empty = this.currentAlpha === undefined ? 'empty' : '';
        return `configAlphaButton ${selected} ${empty}`.trim();
    }

    render() {
        return html`
            <style>
                .configColorButton.selected {
                    outline: 3px solid #007bff;
                    outline-offset: -3px;
                }
                .configAlphaButton.selected {
                    outline: 3px solid #007bff;
                    outline-offset: -3px;
                }
                .configColorButton.empty, .configAlphaButton.empty {
                    opacity: 0.5;
                }
            </style>
            <div class="configColorAlphaContainer">
                ${ColorEntry.list.map(color => html`<button class="${this.getColorButtonClass(color)}" style="background:${color.name}" @click="${() => { this.currentColor = color; this.setColor(color); }}"></button>`)}
                <br/>
                ${AlphaEntry.list.map(alpha => {
            let color = 255 * (1 - alpha.value);
            return html`<button class="${this.getAlphaButtonClass(alpha)}" style="background:rgb(${color},${color},${color})" @click="${() => { this.currentAlpha = alpha; this.setAlpha(alpha); }}"></button>`
        })}
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

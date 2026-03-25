import { customElement, html, LitElement, property } from "lit-element";
import { AlphaEntry, ColorEntry } from "../util/Color";

@customElement('coloralpha-element')
export class ColorAlphaElement extends LitElement {

    @property()
    private setColor: (color: ColorEntry) => void;
    @property()
    private setAlpha: (alpha: AlphaEntry) => void;
    @property()
    private currentColor: ColorEntry;
    @property()
    private currentAlpha: AlphaEntry;

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
            </style>
            <div class="configColorAlphaContainer">
                ${ColorEntry.list.map(color => html`<button class="configColorButton ${this.currentColor && this.currentColor.name === color.name ? 'selected' : ''}" style="background:${color.name}" @click="${() => { this.currentColor = color; this.setColor(color); }}"></button>`)}
                <br/>
                ${AlphaEntry.list.map(alpha => {
            let color = 255 * (1 - alpha.value);
            return html`<button class="configAlphaButton ${this.currentAlpha && this.currentAlpha.value === alpha.value ? 'selected' : ''}" style="background:rgb(${color},${color},${color})" @click="${() => { this.currentAlpha = alpha; this.setAlpha(alpha); }}"></button>`
        })}
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

import {customElement, html, LitElement, property} from "lit-element";
import {AlphaEntry, ColorEntry} from "../util/Color";

@customElement('coloralpha-element')
export class ColorAlphaElement extends LitElement {

    @property()
    private setColor: (color: ColorEntry) => void;
    private setAlpha: (alpha: AlphaEntry) => void;

    render() {
        return html`
            <div class="configColorAlphaContainer">
                ${ColorEntry.list.map(color => html`<button class="configColorButton" style="background:${color.name}" @click="${() => this.setColor(color)}"></button>`)}
                <span class="colorAlphaContainerSplit"></span>
                ${AlphaEntry.list.map(alpha => {
                    let color = 255 * (1 - alpha.value);
                    return html`<button class="configAlphaButton" style="background:rgb(${color},${color},${color})" @click="${() => this.setAlpha(alpha)}"></button>`
                })}
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}
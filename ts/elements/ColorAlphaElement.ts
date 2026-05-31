import { customElement, html, LitElement, property } from "lit-element";
import { hexToRgb, RGB_PRESETS, rgbToHex } from "../util/Color";

@customElement('coloralpha-element')
export class ColorAlphaElement extends LitElement {

    @property()
    private setRgb: (rgb: number) => void;
    @property()
    private setAlpha: (alpha: number) => void;
    @property()
    private currentRgb: number | undefined = undefined;
    @property()
    private currentAlpha: number | undefined = undefined;

    private applyRgb(rgb: number): void {
        this.currentRgb = rgb;
        this.setRgb(rgb);
        this.requestUpdate();
    }

    private updateRgb(hex: string): void {
        this.applyRgb(hexToRgb(hex));
    }

    private applyAlpha(alpha: number): void {
        this.currentAlpha = alpha;
        this.setAlpha(alpha);
        this.requestUpdate();
    }

    private updateAlpha(value: string): void {
        this.applyAlpha(parseInt(value, 10));
    }

    render() {
        const alpha = this.currentAlpha === undefined ? 255 : this.currentAlpha;
        const colorText = this.currentRgb === undefined || this.currentAlpha === undefined
            ? "Mixed"
            : `${rgbToHex(this.currentRgb)}${(`0${this.currentAlpha.toString(16)}`).slice(-2)}`;
        return html`
            <style>
                .configColorPresetGrid {
                    display: grid;
                    grid-template-columns: repeat(5, 18px);
                    gap: 2px;
                }
                .configColorPresetGrid .configColorButton {
                    width: 18px;
                    height: 18px;
                    margin: 0;
                    border-radius: 2px;
                }
                .configColorControls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .configCustomColorControls {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .configCustomColorRow {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .configCustomColorControls input[type="range"] {
                    width: 100px;
                }
                .configColorValue {
                    font-family: monospace;
                }
                .configColorPicker {
                    width: 28px;
                    height: 28px;
                    padding: 2px;
                    border: 1px solid rgba(255, 255, 255, 0.28);
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.08);
                    cursor: pointer;
                    vertical-align: middle;
                }
                .configColorPicker:hover {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }
                .configColorPicker::-webkit-color-swatch-wrapper {
                    padding: 0;
                }
                .configColorPicker::-webkit-color-swatch {
                    border: none;
                    border-radius: 2px;
                }
                .configColorPicker::-moz-color-swatch {
                    border: none;
                    border-radius: 2px;
                }
            </style>
            <div class="configColorAlphaContainer">
                <div class="configColorControls">
                    <div class="configColorPresetGrid">
                        ${RGB_PRESETS.map(rgb => html`
                            <button
                                class="configColorButton"
                                style="background:${rgbToHex(rgb)}"
                                @click=${() => this.applyRgb(rgb)}
                                title="${rgbToHex(rgb)}"
                            ></button>
                        `)}
                    </div>
                    <div class="configCustomColorControls">
                        <div class="configCustomColorRow">
                            <input
                                class="configColorPicker"
                                type="color"
                                .value=${this.currentRgb === undefined ? "#ffffff" : rgbToHex(this.currentRgb)}
                                @input=${(event: Event) => this.updateRgb((event.target as HTMLInputElement).value)}
                                title="Custom color"
                            >
                            <span class="configColorValue">${colorText}</span>
                        </div>
                        <div class="configCustomColorRow">
                            <input
                                type="range"
                                min="1"
                                max="255"
                                step="1"
                                .value=${String(alpha)}
                                @input=${(event: Event) => this.updateAlpha((event.target as HTMLInputElement).value)}
                                title="Custom alpha"
                            >
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }
}

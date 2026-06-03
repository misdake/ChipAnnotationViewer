import { customElement, html, LitElement, property, TemplateResult } from "lit-element";
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

    private editingColorValue = false;
    private colorValueDraft = "";
    private colorValueInvalid = false;

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

    private getColorText(): string {
        return this.currentRgb === undefined || this.currentAlpha === undefined
            ? "Mixed"
            : `${rgbToHex(this.currentRgb)}${(`0${this.currentAlpha.toString(16)}`).slice(-2)}`;
    }

    private editColorValue(): void {
        this.colorValueDraft = this.getColorText() === "Mixed" ? "#ffffffff" : this.getColorText();
        this.colorValueInvalid = false;
        this.editingColorValue = true;
        this.requestUpdate();
        this.updateComplete.then(() => {
            const input = this.querySelector(".configColorValueInput") as HTMLInputElement;
            if (input) {
                input.focus();
                input.select();
            }
        });
    }

    private updateColorValueDraft(value: string): void {
        this.colorValueDraft = value;
        const wasInvalid = this.colorValueInvalid;
        this.colorValueInvalid = false;
        if (wasInvalid) this.requestUpdate();
    }

    private applyColorValue(): void {
        const match = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(this.colorValueDraft.trim());
        if (!match) {
            this.colorValueInvalid = true;
            this.requestUpdate();
            return;
        }

        this.applyRgb(hexToRgb(match[1]));
        if (match[2]) this.applyAlpha(parseInt(match[2], 16));
        this.editingColorValue = false;
        this.colorValueInvalid = false;
        this.requestUpdate();
    }

    private cancelColorValueEdit(): void {
        this.editingColorValue = false;
        this.colorValueInvalid = false;
        this.requestUpdate();
    }

    private onColorValueKeydown(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            this.applyColorValue();
        } else if (event.key === "Escape") {
            this.cancelColorValueEdit();
        }
    }

    render() {
        const alpha = this.currentAlpha === undefined ? 255 : this.currentAlpha;
        const colorText = this.getColorText();
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
                    gap: 12px;
                    margin-top: 6px;
                    margin-bottom: 2px;
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
                    cursor: text;
                }
                .configColorValueWrapper {
                    position: relative;
                }
                .configCustomColorRow input.configColorValueInput[type="text"] {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    z-index: 1;
                    width: 9ch;
                    padding: 6px 4px;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    box-sizing: content-box;
                    background: var(--surface-color);
                    color: var(--text-primary);
                    font-family: monospace;
                    font-size: 12px;
                    transform: translateY(-50%);
                }
                .configCustomColorRow input.configColorValueInput[type="text"]:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }
                .configCustomColorRow input.configColorValueInput[type="text"].invalid {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
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
                            <span class="configColorValueWrapper">
                                <span class="configColorValue" @click=${() => this.editColorValue()} title="Click to edit">${colorText}</span>
                                ${this.editingColorValue
                                    ? html`
                                        <input
                                            class="configColorValueInput${this.colorValueInvalid ? " invalid" : ""}"
                                            type="text"
                                            maxlength="9"
                                            .value=${this.colorValueDraft}
                                            @input=${(event: Event) => this.updateColorValueDraft((event.target as HTMLInputElement).value)}
                                            @blur=${() => this.applyColorValue()}
                                            @keydown=${(event: KeyboardEvent) => this.onColorValueKeydown(event)}
                                            title="${this.colorValueInvalid ? "Use #RRGGBB or #RRGGBBAA" : "Enter #RRGGBB or #RRGGBBAA"}"
                                        >
                                    `
                                    : ""}
                            </span>
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

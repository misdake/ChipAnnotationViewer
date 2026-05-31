import { customElement, html, LitElement, property } from "lit-element";
import { DrawableText } from "./DrawableText";
import { Canvas } from "../Canvas";
import { alphaOf, rgbOf } from "../util/Color";
import "../elements/ColorAlphaElement"
import "../elements/NumberInputElement"
import "../elements/TextInputElement"
import { Selection, SelectType } from "../layers/Selection";
import { getUnifiedValue } from "../util/MultiSelect";

@customElement('textedit-element')
export class TextEdit extends LitElement {

    @property()
    texts: DrawableText[] = [];

    @property()
    canvas: Canvas;

    deleteText() {
        for (const text of this.texts) {
            text.deleteOnCanvas(this.canvas);
        }
        if (this.texts.length > 1) {
            Selection.deselectAny();
        } else {
            Selection.deselect(SelectType.TEXT);
        }
    }
    copyText() {
        let offset = this.canvas.getCamera().screenSizeToCanvas(20);
        const newTexts: DrawableText[] = [];
        for (const text of this.texts) {
            const cloned = text.cloneOnCanvas(this.canvas, offset, offset) as DrawableText;
            if (cloned) newTexts.push(cloned);
        }
        if (newTexts.length > 0) {
            if (this.texts.length > 1) {
                const selected = Selection.getSelected();
                if (Array.isArray(selected.item)) {
                    (selected.item as DrawableText[]).splice(0, selected.item.length, ...newTexts);
                }
            } else {
                Selection.select(SelectType.TEXT, newTexts[0]);
            }
        }
    }

    private getText(): string | undefined {
        return getUnifiedValue(this.texts, t => t.text);
    }
    private getMultiline(): boolean {
        const value = getUnifiedValue(this.texts, t => t.multiline);
        return value === true;
    }
    private getRgb(): number | undefined {
        return getUnifiedValue(this.texts, t => rgbOf(t.color));
    }
    private getAlpha(): number | undefined {
        return getUnifiedValue(this.texts, t => alphaOf(t.color));
    }
    private getOnScreen(): number | undefined {
        return getUnifiedValue(this.texts, t => t.onScreen);
    }
    private getOnCanvas(): number | undefined {
        return getUnifiedValue(this.texts, t => t.onCanvas);
    }

    private editText = (content: string) => {
        for (const text of this.texts) {
            text.text = content;
        }
        this.canvas.requestRender();
        this.requestUpdate();
    };
    private setMultiline = (multiline: boolean) => {
        for (const text of this.texts) {
            text.multiline = multiline;
        }
        this.canvas.requestRender();
        this.requestUpdate();
    };

    private onSizeInput = (options: { screen?: string, canvas?: string }) => {
        for (const text of this.texts) {
            if (options.screen !== undefined) text.onScreen = parseInt(options.screen, 10);
            if (options.canvas !== undefined) text.onCanvas = parseInt(options.canvas, 10);
        }
        this.canvas.requestRender();
        this.requestUpdate();
    };

    render() {
        const multiline = this.getMultiline();
        const textValue = this.getText() || "";
        return html`
            <div class="actionButtonRow">
                <button class="configButton" @click=${() => this.deleteText()}>Delete Text</button>
                <button class="configButton" @click=${() => this.copyText()}>Clone Text</button>
            </div>

            Text
            <label style="margin-left: 8px;">
                <input
                    type="checkbox"
                    .checked=${multiline}
                    @change="${(ev: Event) => this.setMultiline((ev.target as HTMLInputElement).checked)}"
                >
                Multiline
            </label>
            <br>
            ${multiline
                ? html`
                    <textarea
                        class="configText"
                        style="width: 160px; height: 72px;"
                        .value=${textValue}
                        @input="${(ev: Event) => this.editText((ev.target as HTMLTextAreaElement).value)}"
                    ></textarea>
                `
                : html`
                    <text-input
                        .value=${textValue}
                        .placeholder=${"-"}
                        .onChange=${(val: string) => this.editText(val)}
                    ></text-input>
                `
            }
            <br>

            <div class="colorFoldWrapper">
                <div>Text Color</div>
                <coloralpha-element
                    .currentRgb=${this.getRgb()}
                    .currentAlpha=${this.getAlpha()}
                    .setRgb=${(rgb: number) => {
                for (const text of this.texts) {
                    text.setColorAlpha(rgb, undefined);
                }
                this.canvas.requestRender();
            }}
                    .setAlpha=${(alpha: number) => {
                for (const text of this.texts) {
                    text.setColorAlpha(undefined, alpha);
                }
                this.canvas.requestRender();
            }} 
                ></coloralpha-element>
            </div>

            <div class="sizeInput">
                <number-input
                    .value="${this.getOnScreen()}"
                    .min="${0}"
                    .onChange="${(val: number) => this.onSizeInput({ screen: String(val) })}"
                ></number-input>
                <label>Pixel on Screen</label>
            </div>
            <div class="sizeInput">
                <number-input
                    .value="${this.getOnCanvas()}"
                    .min="${0}"
                    .onChange="${(val: number) => this.onSizeInput({ canvas: String(val) })}"
                ></number-input>
                <label>Pixel on Canvas</label>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

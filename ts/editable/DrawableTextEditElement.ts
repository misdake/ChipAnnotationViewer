import { customElement, html, LitElement, property } from "lit-element";
import { DrawableText } from "./DrawableText";
import { Canvas } from "../Canvas";
import { AlphaEntry, ColorEntry } from "../util/Color";
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

    private get firstText(): DrawableText | undefined {
        return this.texts.length > 0 ? this.texts[0] : undefined;
    }

    deleteText() {
        for (const text of this.texts) {
            text.deleteOnCanvas(this.canvas);
        }
    }
    copyText() {
        let offset = this.canvas.getCamera().screenSizeToCanvas(20);
        for (const text of this.texts) {
            text.cloneOnCanvas(this.canvas, offset, offset);
        }
        Selection.select(SelectType.TEXT, this.texts[0]);
    }

    private getText(): string | undefined {
        return getUnifiedValue(this.texts, t => t.text);
    }
    private getColor(): ColorEntry | undefined {
        return getUnifiedValue(this.texts, t => t.color);
    }
    private getAlpha(): AlphaEntry | undefined {
        return getUnifiedValue(this.texts, t => t.alpha);
    }
    private getOnScreen(): number | undefined {
        return getUnifiedValue(this.texts, t => t.onScreen);
    }
    private getOnCanvas(): number | undefined {
        return getUnifiedValue(this.texts, t => t.onCanvas);
    }

    private editText = (content: string) => {
        for (const text of this.texts) {
            if (content.length) {
                text.text = content;
            }
        }
        this.canvas.requestRender();
        this.performUpdate();
    };

    private onSizeInput = (options: { screen?: string, canvas?: string }) => {
        for (const text of this.texts) {
            if (options.screen !== undefined) text.onScreen = parseInt(options.screen);
            if (options.canvas !== undefined) text.onCanvas = parseInt(options.canvas);
        }
        this.canvas.requestRender();
        this.performUpdate();
    };

    render() {
        return html`
            <button class="configButton" @click=${() => this.deleteText()}>Delete Text</button><br>
            <button class="configButton" @click=${() => this.copyText()}>Clone Text</button><br>

            Text<br>
            <text-input
                .value="${this.getText()}"
                .placeholder="-"
                .onChange="${(val: string) => this.editText(val)}"
            ></text-input>
            <br>

            <div>Text Color</div>
            <coloralpha-element
                .currentColor=${this.getColor()}
                .currentAlpha=${this.getAlpha()}
                .setColor=${(color: ColorEntry) => {
                for (const text of this.texts) {
                    text.setColorAlpha(color, undefined);
                }
                this.canvas.requestRender();
            }}
                .setAlpha=${(alpha: AlphaEntry) => {
                for (const text of this.texts) {
                    text.setColorAlpha(undefined, alpha);
                }
                this.canvas.requestRender();
            }}
            ></coloralpha-element>

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

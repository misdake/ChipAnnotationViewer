import { customElement, html, LitElement, property } from "lit-element";
import { DrawableText } from "./DrawableText";
import { Canvas } from "../Canvas";
import { AlphaEntry, ColorEntry } from "../util/Color";
import "../elements/ColorAlphaElement"
import { Selection, SelectType } from "../layers/Selection";

@customElement('textedit-element')
export class TextEdit extends LitElement {

    @property()
    text: DrawableText;

    @property()
    canvas: Canvas;

    deleteText() {
        this.text.deleteOnCanvas(this.canvas);
    }
    copyText() {
        let offset = this.canvas.getCamera().screenSizeToCanvas(20);
        this.text.cloneOnCanvas(this.canvas, offset, offset);
        Selection.select(SelectType.TEXT, this.text);
    }

    private editText = (content: string) => {
        if (!content.length) content = "text";
        this.text.text = content;
        this.canvas.requestRender();
        this.performUpdate();
    };

    private onSizeInput = (ev: Event, options: { screen?: string, canvas?: string }) => {
        if (options.screen !== undefined) this.text.onScreen = parseInt(options.screen);
        if (options.canvas !== undefined) this.text.onCanvas = parseInt(options.canvas);
        this.canvas.requestRender();
        this.performUpdate();
    };

    render() {
        return html`
            <button class="configButton" @click=${() => this.deleteText()}>Delete Text</button><br>
            <button class="configButton" @click=${() => this.copyText()}>Copy Text</button><br>

            Text<br>
            <input class="configText" type="text" style="width:10em" .value="${this.text.text}" @input=${(ev: Event) => this.editText((<HTMLInputElement>ev.target).value)}><br>

            <div>Color</div>
            <coloralpha-element
                .setColor=${(color: ColorEntry) => {
                this.text.setColorAlpha(color, undefined);
                this.canvas.requestRender();
            }}
                .setAlpha=${(alpha: AlphaEntry) => {
                this.text.setColorAlpha(undefined, alpha);
                this.canvas.requestRender();
            }}
            ></coloralpha-element>

            <div class="sizeInput">
                <input type="number" min=0 .value="${this.text.onScreen}" @input=${(ev: Event) => this.onSizeInput(ev, { screen: (<HTMLInputElement>ev.target).value })}>
                <label>Pixel on Screen</label>
            </div>
            <div class="sizeInput">
                <input type="number" min=0 .value="${this.text.onCanvas}" @input=${(ev: Event) => this.onSizeInput(ev, { canvas: (<HTMLInputElement>ev.target).value })}>
                <label>Pixel on Canvas</label>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

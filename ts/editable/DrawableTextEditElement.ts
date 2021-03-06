import {customElement, html, LitElement, property} from "lit-element";
import {DrawableText} from "./DrawableText";
import {Canvas} from "../Canvas";
import {AlphaEntry, ColorEntry} from "../util/Color";
import "elements/ColorAlphaElement"
import {Selection, SelectType} from "../layers/Selection";

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
            <button class="configButton" @click=${() => this.deleteText()}>delete text</button><br>
            <button class="configButton" @click=${() => this.copyText()}>copy text</button><br>

            text<br>
            <input class="configText" type="text" style="width:10em" .value="${this.text.text}" @input=${(ev: Event) => this.editText((<HTMLInputElement>ev.target).value)}><br>

            <div>color</div>
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

            <input class="configText" type="number" min=0 style="width:5em" .value="${this.text.onScreen}" @input=${(ev: Event) => this.onSizeInput(ev, {screen: (<HTMLInputElement>ev.target).value})}>pixel onScreen<br>
            <input class="configText" type="number" min=0 style="width:5em" .value="${this.text.onCanvas}" @input=${(ev: Event) => this.onSizeInput(ev, {canvas: (<HTMLInputElement>ev.target).value})}>pixel onCanvas<br>
        `;
    }

    createRenderRoot() {
        return this;
    }

}
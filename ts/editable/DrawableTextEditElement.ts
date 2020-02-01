import {customElement, html, LitElement, property} from "lit-element";
import {DrawableText} from "./DrawableText";
import {Canvas} from "../Canvas";
import {AlphaEntry, ColorEntry} from "../util/Color";
import "elements/ColorAlphaElement"
import {Selection, SelectType} from "../layers/Selection";
import {LayerTextView} from "../layers/LayerTextView";
import {LayerName} from "../layers/Layers";

@customElement('textedit-element')
export class TextEdit extends LitElement {

    @property()
    text: DrawableText;

    @property()
    canvas: Canvas;

    deleteText() {
        let layerView = <LayerTextView>this.canvas.findLayer(LayerName.TEXT_VIEW);
        layerView.deleteText(this.text);
        Selection.deselect(SelectType.TEXT);
        Selection.deselect(SelectType.TEXT_CREATE);
        this.canvas.requestRender();
    }
    copyText() {
        //TODO
    }

    private editText = (content: string) => {
        this.text.text = content;
        this.canvas.requestRender();
    };

    private onSizeInput = (ev: Event, options: { screen?: string, canvas?: string }) => {
        if (options.screen !== undefined) this.text.onScreen = parseInt(options.screen);
        if (options.canvas !== undefined) this.text.onCanvas = parseInt(options.canvas);
        this.canvas.requestRender();
    };

    render() {
        return html`
            <button class="configButton" @click=${() => this.deleteText()}>delete text</button><br>
            <button class="configButton" @click=${() => this.copyText()}>copy text</button><br>

            text<br>
            <input class="configText" type="text" style="width:10em" value="${this.text.text}" @input=${(ev: Event) => this.editText((<HTMLInputElement>ev.target).value)}><br>

            <div>color</div>
            <coloralpha-element
                .setColor=${(color: ColorEntry) => { this.text.setColorAlpha(color, this.text.alpha); this.canvas.requestRender(); }}
                .setAlpha=${(alpha: AlphaEntry) => { this.text.setColorAlpha(this.text.color, alpha); this.canvas.requestRender(); }}
            ></coloralpha-element>

            <input class="configText" type="number" min=0 style="width:5em" value="${this.text.onScreen}" @input=${(ev: Event) => this.onSizeInput(ev, {screen: (<HTMLInputElement>ev.target).value})}>pixel onScreen<br>
            <input class="configText" type="number" min=0 style="width:5em" value="${this.text.onCanvas}" @input=${(ev: Event) => this.onSizeInput(ev, {canvas: (<HTMLInputElement>ev.target).value})}>pixel onCanvas<br>
        `;
    }

    createRenderRoot() {
        return this;
    }

}
import {customElement, html, LitElement, property} from "lit-element";
import {DrawablePolyline} from "./DrawablePolyline";
import {Canvas} from "../Canvas";

@customElement('polylineedit-element')
export class PolylineEdit extends LitElement {

    @property()
    polyline: DrawablePolyline;

    @property()
    canvas: Canvas;

    deletePolyline() {
        //TODO
    }
    copyPolyline() {
        //TODO
    }

    @property()
    area: string = "";
    calcArea() {
        //TODO
    }

    rotateCCW() {
        this.polyline.editor.rotateCCW();
        this.canvas.requestRender();
    }
    rotateCW() {
        this.polyline.editor.rotateCW();
        this.canvas.requestRender();
    }
    flipX() {
        this.polyline.editor.flipX();
        this.canvas.requestRender();
    }
    flipY() {
        this.polyline.editor.flipY();
        this.canvas.requestRender();
    }

    private onStyleCheck = (ev: Event) => {
        //TODO
    };
    private onSizeInput = (ev: Event) => {
        //TODO
    };

    render() {
        return html`
            <button class="configButton" @click=${() => this.deletePolyline()}>delete polyline</button><br>
            <button class="configButton" @click=${() => this.copyPolyline()}>copy polyline</button><br>
            <span id="polylineAreaContainer">
                <button class="configButton" @click=${() => this.calcArea()}>area/length</button>
                <span id="polylineTextArea">${this.area}</span>
                <br>
            </span>

            <button class="configButton" @click=${() => this.rotateCCW()} >rotate ccw</button>
            <button class="configButton" @click=${() => this.rotateCW()}  >rotate cw</button>
            <button class="configButton" @click=${() => this.flipX()}     >flip x</button>
            <button class="configButton" @click=${() => this.flipY()}     >flip y</button>

            <br>

            <input class="configCheckbox" type="checkbox" @change=${this.onStyleCheck} ?checked="${this.polyline.style.fill}" >fill<br>
            <input class="configCheckbox" type="checkbox" @change=${this.onStyleCheck} ?checked="${this.polyline.style.stroke}" >stroke<br>
            <input class="configCheckbox" type="checkbox" @change=${this.onStyleCheck} ?checked="${this.polyline.style.closed}" >closed<br>

<!--            <div>strokeColor</div>-->
<!--            <div class="configColorAlphaContainer">-->
<!--                <span class="configColorContainer" id="polylineContainerStrokeColor"></span><span class="colorAlphaContainerSplit"></span>-->
<!--                <span class="configAlphaContainer" id="polylineContainerStrokeAlpha"></span><br>-->
<!--            </div>-->
<!--            <div>fillColor</div>-->
<!--            <div class="configColorAlphaContainer">-->
<!--                <span class="configColorContainer" id="polylineContainerFillColor"></span><span class="colorAlphaContainerSplit"></span>-->
<!--                <span class="configAlphaContainer" id="polylineContainerFillAlpha"></span><br>-->
<!--            </div>-->

            <input class="configText" type="number" min=0 style="width:5em" value="${this.polyline.style.onScreen}" @input=${this.onSizeInput}>pixel onScreen<br>
            <input class="configText" type="number" min=0 style="width:5em" value="${this.polyline.style.onCanvas}" @input=${this.onSizeInput}>pixel onCanvas<br>
        `;
    }

    createRenderRoot() {
        return this;
    }

}
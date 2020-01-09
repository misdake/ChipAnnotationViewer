import {customElement, html, LitElement, property} from "lit-element";
import {DrawablePolyline} from "./DrawablePolyline";
import {Canvas} from "../Canvas";
import {Map} from "../data/Map";

@customElement('polylineedit-element')
export class PolylineEdit extends LitElement {

    @property()
    polyline: DrawablePolyline;

    @property()
    canvas: Canvas;
    @property()
    map: Map;

    deletePolyline() {
        //TODO
    }
    copyPolyline() {
        //TODO
    }

    @property()
    area: string = "";
    calcArea() {
        let width = this.map.widthMillimeter;
        let height = this.map.heightMillimeter;
        let unit = this.polyline.style.fill ? "mm^2" : "mm";
        if (!(this.map.widthMillimeter > 0 && this.map.heightMillimeter > 0)) {
            width = this.map.width;
            height = this.map.height;
            unit = "pixels"
        }
        if (this.polyline.style.fill) {
            let area = this.polyline.calculator.area();
            let areaMM2 = area / this.map.width / this.map.height * width * height;
            areaMM2 = Math.round(areaMM2 * 100) / 100;
            this.area = areaMM2 + unit;
        } else {
            let length = this.polyline.calculator.length();
            let lengthMM = length * Math.sqrt(width * height / this.map.width / this.map.height);
            lengthMM = Math.round(lengthMM * 100) / 100;
            this.area = lengthMM + unit;
        }
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

    private onStyleCheck = (ev: Event, options: { fill?: boolean, stroke?: boolean, closed?: boolean }) => {
        if (options.fill !== undefined) this.polyline.style.fill = options.fill;
        if (options.stroke !== undefined) this.polyline.style.stroke = options.stroke;
        if (options.closed !== undefined) this.polyline.style.closed = options.closed;
        this.canvas.requestRender();
    };
    private onSizeInput = (ev: Event, options: { screen?: string, canvas?: string }) => {
        if (options.screen !== undefined) this.polyline.style.onScreen = parseInt(options.screen);
        if (options.canvas !== undefined) this.polyline.style.onCanvas = parseInt(options.canvas);
        this.canvas.requestRender();
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

            <input class="configCheckbox" type="checkbox" @change=${(ev: Event) => this.onStyleCheck(ev, {fill: (<HTMLInputElement>ev.target).checked})} ?checked="${this.polyline.style.fill}" >fill<br>
            <input class="configCheckbox" type="checkbox" @change=${(ev: Event) => this.onStyleCheck(ev, {stroke: (<HTMLInputElement>ev.target).checked})} ?checked="${this.polyline.style.stroke}" >stroke<br>
            <input class="configCheckbox" type="checkbox" @change=${(ev: Event) => this.onStyleCheck(ev, {closed: (<HTMLInputElement>ev.target).checked})} ?checked="${this.polyline.style.closed}" >closed<br>

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

            <input class="configText" type="number" min=0 style="width:5em" value="${this.polyline.style.onScreen}" @input=${(ev: Event) => this.onSizeInput(ev, {screen: (<HTMLInputElement>ev.target).value})}>pixel onScreen<br>
            <input class="configText" type="number" min=0 style="width:5em" value="${this.polyline.style.onCanvas}" @input=${(ev: Event) => this.onSizeInput(ev, {canvas: (<HTMLInputElement>ev.target).value})}>pixel onCanvas<br>
        `;
    }

    createRenderRoot() {
        return this;
    }

}
import { customElement, html, LitElement, property } from "lit-element";
import { DrawablePolyline } from "./DrawablePolyline";
import { Canvas } from "../Canvas";
import { Map } from "../data/Map";
import { AlphaEntry, ColorEntry } from "../util/Color";
import "../elements/ColorAlphaElement"
import "../elements/TriStateCheckboxElement"
import { Selection, SelectType } from "../layers/Selection";
import { rotateCCWIcon, rotateCWIcon, flipXIcon, flipYIcon } from "../util/Icons";

@customElement('polylineedit-element')
export class PolylineEdit extends LitElement {

    @property()
    polyline: DrawablePolyline;

    @property()
    canvas: Canvas;
    @property()
    map: Map;

    deletePolyline() {
        this.polyline.deleteOnCanvas(this.canvas);
    }
    copyPolyline() {
        let offset = this.canvas.getCamera().screenSizeToCanvas(20);
        this.polyline.cloneOnCanvas(this.canvas, offset, offset);
        Selection.select(SelectType.POLYLINE, this.polyline);
    }

    @property()
    area: string = "";
    calcArea() {
        let width = this.map.widthMillimeter;
        let height = this.map.heightMillimeter;
        let unit = this.polyline.style.fill ? "mm²" : "mm";
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
        this.performUpdate();
    };
    private onSizeInput = (ev: Event, options: { screen?: string, canvas?: string }) => {
        if (options.screen !== undefined) this.polyline.style.onScreen = parseInt(options.screen);
        if (options.canvas !== undefined) this.polyline.style.onCanvas = parseInt(options.canvas);
        this.canvas.requestRender();
        this.performUpdate();
    };

    render() {
        return html`
            <button class="configButton" @click=${() => this.deletePolyline()}>Delete Polyline</button><br>
            <button class="configButton" @click=${() => this.copyPolyline()}>Clone Polyline</button><br>
            <span id="polylineAreaContainer">
                <button class="configButton" @click=${() => this.calcArea()}>Area/Length</button>
                <span id="polylineTextArea">${this.area}</span>
                <br>
            </span>

            <button class="iconButton" @click=${() => this.rotateCCW()} title="Rotate CCW">${rotateCCWIcon}</button>
            <button class="iconButton" @click=${() => this.rotateCW()}  title="Rotate CW">${rotateCWIcon}</button>
            <button class="iconButton" @click=${() => this.flipX()}     title="Flip X">${flipXIcon}</button>
            <button class="iconButton" @click=${() => this.flipY()}     title="Flip Y">${flipYIcon}</button>

            <div class="checkboxRow">
                <tristate-checkbox
                    .state="${this.polyline.style.fill ? 'all' : 'none'}"
                    label="Fill"
                    .onChange="${(state: string) => this.onStyleCheck(null, { fill: state === 'all' })}"
                ></tristate-checkbox>
                <tristate-checkbox
                    .state="${this.polyline.style.stroke ? 'all' : 'none'}"
                    label="Stroke"
                    .onChange="${(state: string) => this.onStyleCheck(null, { stroke: state === 'all' })}"
                ></tristate-checkbox>
                <tristate-checkbox
                    .state="${this.polyline.style.closed ? 'all' : 'none'}"
                    label="Closed"
                    .onChange="${(state: string) => this.onStyleCheck(null, { closed: state === 'all' })}"
                ></tristate-checkbox>
            </div>

            <div>Stroke Color</div>
            <coloralpha-element
                .currentColor=${this.polyline.style.strokeColor}
                .currentAlpha=${this.polyline.style.strokeAlpha}
                .setColor=${(color: ColorEntry) => {
                this.polyline.style.setStrokeColor(color, undefined);
                this.canvas.requestRender();
            }}
                .setAlpha=${(alpha: AlphaEntry) => {
                this.polyline.style.setStrokeColor(undefined, alpha);
                this.canvas.requestRender();
            }}
            ></coloralpha-element>
            <div>Fill Color</div>
            <coloralpha-element
                .currentColor=${this.polyline.style.fillColor}
                .currentAlpha=${this.polyline.style.fillAlpha}
                .setColor=${(color: ColorEntry) => {
                this.polyline.style.setFillColor(color, undefined);
                this.canvas.requestRender();
            }}
                .setAlpha=${(alpha: AlphaEntry) => {
                this.polyline.style.setFillColor(undefined, alpha);
                this.canvas.requestRender();
            }}
            ></coloralpha-element>

            <div class="sizeInput">
                <input type="number" min=0 .value="${this.polyline.style.onScreen}" @input=${(ev: Event) => this.onSizeInput(ev, { screen: (<HTMLInputElement>ev.target).value })}>
                <label>Pixel on Screen</label>
            </div>
            <div class="sizeInput">
                <input type="number" min=0 .value="${this.polyline.style.onCanvas}" @input=${(ev: Event) => this.onSizeInput(ev, { canvas: (<HTMLInputElement>ev.target).value })}>
                <label>Pixel on Canvas</label>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

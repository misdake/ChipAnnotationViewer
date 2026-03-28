import { customElement, html, LitElement, property } from "lit-element";
import { DrawablePolyline } from "./DrawablePolyline";
import { Canvas } from "../Canvas";
import { Map } from "../data/Map";
import { AlphaEntry, ColorEntry } from "../util/Color";
import "../elements/ColorAlphaElement"
import "../elements/TriStateCheckboxElement"
import "../elements/NumberInputElement"
import { Selection, SelectType } from "../layers/Selection";
import { rotateCCWIcon, rotateCWIcon, flipXIcon, flipYIcon } from "../util/Icons";
import { TriState, getTriState, getUnifiedValue } from "../util/MultiSelect";

@customElement('polylineedit-element')
export class PolylineEdit extends LitElement {

    @property()
    polylines: DrawablePolyline[] = [];

    @property()
    canvas: Canvas;
    @property()
    map: Map;

    private get firstPolyline(): DrawablePolyline | undefined {
        return this.polylines.length > 0 ? this.polylines[0] : undefined;
    }

    deletePolyline() {
        for (const polyline of this.polylines) {
            polyline.deleteOnCanvas(this.canvas);
        }
        if (this.polylines.length > 1) {
            Selection.deselectAny();
        } else {
            Selection.deselect(SelectType.POLYLINE);
        }
    }
    copyPolyline() {
        let offset = this.canvas.getCamera().screenSizeToCanvas(20);
        const newPolylines: DrawablePolyline[] = [];
        for (const polyline of this.polylines) {
            const cloned = polyline.cloneOnCanvas(this.canvas, offset, offset) as DrawablePolyline;
            if (cloned) newPolylines.push(cloned);
        }
        if (newPolylines.length > 0) {
            if (this.polylines.length > 1) {
                const selected = Selection.getSelected();
                if (Array.isArray(selected.item)) {
                    (selected.item as DrawablePolyline[]).splice(0, selected.item.length, ...newPolylines);
                }
            } else {
                Selection.select(SelectType.POLYLINE, newPolylines[0]);
            }
        }
    }

    @property()
    area: string = "";
    calcArea() {
        let width = this.map.widthMillimeter;
        let height = this.map.heightMillimeter;
        let unit = "mm";
        if (!(this.map.widthMillimeter > 0 && this.map.heightMillimeter > 0)) {
            width = this.map.width;
            height = this.map.height;
            unit = "pixels"
        }
        let totalValue = 0;
        for (const polyline of this.polylines) {
            if (polyline.style.fill) {
                let area = polyline.calculator.area();
                let areaMM2 = area / this.map.width / this.map.height * width * height;
                totalValue += areaMM2;
                unit = "mm²";
            } else {
                let length = polyline.calculator.length();
                let lengthMM = length * Math.sqrt(width * height / this.map.width / this.map.height);
                totalValue += lengthMM;
            }
        }
        totalValue = Math.round(totalValue * 100) / 100;
        this.area = totalValue + unit;
    }

    rotateCCW() {
        for (const polyline of this.polylines) {
            polyline.editor.rotateCCW();
        }
        this.canvas.requestRender();
    }
    rotateCW() {
        for (const polyline of this.polylines) {
            polyline.editor.rotateCW();
        }
        this.canvas.requestRender();
    }
    flipX() {
        for (const polyline of this.polylines) {
            polyline.editor.flipX();
        }
        this.canvas.requestRender();
    }
    flipY() {
        for (const polyline of this.polylines) {
            polyline.editor.flipY();
        }
        this.canvas.requestRender();
    }

    private getFillState(): TriState {
        return getTriState(this.polylines, p => p.style.fill);
    }
    private getStrokeState(): TriState {
        return getTriState(this.polylines, p => p.style.stroke);
    }
    private getClosedState(): TriState {
        return getTriState(this.polylines, p => p.style.closed);
    }
    private getStrokeColor(): ColorEntry | undefined {
        return getUnifiedValue(this.polylines, p => p.style.strokeColor);
    }
    private getStrokeAlpha(): AlphaEntry | undefined {
        return getUnifiedValue(this.polylines, p => p.style.strokeAlpha);
    }
    private getFillColor(): ColorEntry | undefined {
        return getUnifiedValue(this.polylines, p => p.style.fillColor);
    }
    private getFillAlpha(): AlphaEntry | undefined {
        return getUnifiedValue(this.polylines, p => p.style.fillAlpha);
    }
    private getOnScreen(): number | undefined {
        return getUnifiedValue(this.polylines, p => p.style.onScreen);
    }
    private getOnCanvas(): number | undefined {
        return getUnifiedValue(this.polylines, p => p.style.onCanvas);
    }

    private onStyleCheck = (options: { fill?: boolean, stroke?: boolean, closed?: boolean }) => {
        for (const polyline of this.polylines) {
            if (options.fill !== undefined) polyline.style.fill = options.fill;
            if (options.stroke !== undefined) polyline.style.stroke = options.stroke;
            if (options.closed !== undefined) polyline.style.closed = options.closed;
        }
        this.canvas.requestRender();
        this.performUpdate();
    };
    private onSizeInput = (options: { screen?: string, canvas?: string }) => {
        for (const polyline of this.polylines) {
            if (options.screen !== undefined) polyline.style.onScreen = parseInt(options.screen);
            if (options.canvas !== undefined) polyline.style.onCanvas = parseInt(options.canvas);
        }
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
                    .state="${this.getFillState()}"
                    label="Fill"
                    .onChange="${(state: 'none' | 'all') => this.onStyleCheck({ fill: state === 'all' })}"
                ></tristate-checkbox>
                <tristate-checkbox
                    .state="${this.getStrokeState()}"
                    label="Stroke"
                    .onChange="${(state: 'none' | 'all') => this.onStyleCheck({ stroke: state === 'all' })}"
                ></tristate-checkbox>
                <tristate-checkbox
                    .state="${this.getClosedState()}"
                    label="Closed"
                    .onChange="${(state: 'none' | 'all') => this.onStyleCheck({ closed: state === 'all' })}"
                ></tristate-checkbox>
            </div>

            <div>Stroke Color</div>
            <coloralpha-element
                .currentColor=${this.getStrokeColor()}
                .currentAlpha=${this.getStrokeAlpha()}
                .setColor=${(color: ColorEntry) => {
                for (const polyline of this.polylines) {
                    polyline.style.setStrokeColor(color, undefined);
                }
                this.canvas.requestRender();
            }}
                .setAlpha=${(alpha: AlphaEntry) => {
                for (const polyline of this.polylines) {
                    polyline.style.setStrokeColor(undefined, alpha);
                }
                this.canvas.requestRender();
            }}
            ></coloralpha-element>
            <div>Fill Color</div>
            <coloralpha-element
                .currentColor=${this.getFillColor()}
                .currentAlpha=${this.getFillAlpha()}
                .setColor=${(color: ColorEntry) => {
                for (const polyline of this.polylines) {
                    polyline.style.setFillColor(color, undefined);
                }
                this.canvas.requestRender();
            }}
                .setAlpha=${(alpha: AlphaEntry) => {
                for (const polyline of this.polylines) {
                    polyline.style.setFillColor(undefined, alpha);
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

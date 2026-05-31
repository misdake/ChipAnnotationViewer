import { customElement, html, LitElement, property } from "lit-element";
import { DrawablePolyline } from "./DrawablePolyline";
import { DrawableText } from "./DrawableText";
import { Canvas } from "../Canvas";
import { ChipContent } from "../data/Chip";
import { AlphaEntry, ColorEntry } from "../util/Color";
import "../elements/ColorAlphaElement";
import "../elements/TriStateCheckboxElement";
import "../elements/NumberInputElement";
import { Selection, SelectType } from "../layers/Selection";
import { rotateCCWIcon, rotateCWIcon, flipXIcon, flipYIcon } from "../util/Icons";
import { TriState, getTriState, getUnifiedValue } from "../util/MultiSelect";
import { AABB } from "../util/AABB";

@customElement("polylineedit-element")
export class PolylineEdit extends LitElement {
    @property()
    polylines: DrawablePolyline[] = [];

    @property()
    linkedDrawables: (DrawablePolyline | DrawableText)[] = [];

    @property()
    canvas: Canvas;
    @property()
    chipContent: ChipContent;

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
        let width = this.chipContent.widthMillimeter;
        let height = this.chipContent.heightMillimeter;
        let unit = "mm";
        if (!(this.chipContent.widthMillimeter > 0 && this.chipContent.heightMillimeter > 0)) {
            width = this.chipContent.width;
            height = this.chipContent.height;
            unit = "pixels";
        }
        let totalValue = 0;
        for (const polyline of this.polylines) {
            if (polyline.style.fill) {
                let area = polyline.calculator.area();
                let areaMM2 = area / this.chipContent.width / this.chipContent.height * width * height;
                totalValue += areaMM2;
                unit = "mm²";
            } else {
                let length = polyline.calculator.length();
                let lengthMM = length * Math.sqrt(width * height / this.chipContent.width / this.chipContent.height);
                totalValue += lengthMM;
            }
        }
        totalValue = Math.round(totalValue * 100) / 100;
        this.area = totalValue + unit;
    }

    private getTransformTargets(): (DrawablePolyline | DrawableText)[] {
        if (this.linkedDrawables && this.linkedDrawables.length > 0) {
            return this.linkedDrawables;
        }
        return this.polylines;
    }

    private getSelectionCenter(): { x: number; y: number } | undefined {
        const targets = this.getTransformTargets();
        if (!targets || targets.length === 0) return undefined;
        const aabb = AABB.combineAll(targets.map(item => item.aabb()));
        return { x: aabb.centerX, y: aabb.centerY };
    }

    rotateCCW() {
        const center = this.getSelectionCenter();
        if (!center) return;
        for (const item of this.getTransformTargets()) {
            item.rotateCCW(center.x, center.y);
        }
        this.canvas.requestRender();
    }
    rotateCW() {
        const center = this.getSelectionCenter();
        if (!center) return;
        for (const item of this.getTransformTargets()) {
            item.rotateCW(center.x, center.y);
        }
        this.canvas.requestRender();
    }
    flipX() {
        const center = this.getSelectionCenter();
        if (!center) return;
        for (const item of this.getTransformTargets()) {
            item.flipX(center.x);
        }
        this.canvas.requestRender();
    }
    flipY() {
        const center = this.getSelectionCenter();
        if (!center) return;
        for (const item of this.getTransformTargets()) {
            item.flipY(center.y);
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
        return getUnifiedValue(this.polylines, p => p.style.strokeColor, (left, right) => left.equals(right));
    }
    private getStrokeAlpha(): AlphaEntry | undefined {
        return getUnifiedValue(this.polylines, p => p.style.strokeAlpha, (left, right) => left.equals(right));
    }
    private getFillColor(): ColorEntry | undefined {
        return getUnifiedValue(this.polylines, p => p.style.fillColor, (left, right) => left.equals(right));
    }
    private getFillAlpha(): AlphaEntry | undefined {
        return getUnifiedValue(this.polylines, p => p.style.fillAlpha, (left, right) => left.equals(right));
    }
    private getOnScreen(): number | undefined {
        return getUnifiedValue(this.polylines, p => p.style.onScreen);
    }
    private getOnCanvas(): number | undefined {
        return getUnifiedValue(this.polylines, p => p.style.onCanvas);
    }

    private onStyleCheck = (options: { fill?: boolean; stroke?: boolean; closed?: boolean }) => {
        for (const polyline of this.polylines) {
            if (options.fill !== undefined) polyline.style.fill = options.fill;
            if (options.stroke !== undefined) polyline.style.stroke = options.stroke;
            if (options.closed !== undefined) polyline.style.closed = options.closed;
        }
        this.canvas.requestRender();
        this.requestUpdate();
    };
    private onSizeInput = (options: { screen?: string; canvas?: string }) => {
        for (const polyline of this.polylines) {
            if (options.screen !== undefined) polyline.style.onScreen = parseInt(options.screen, 10);
            if (options.canvas !== undefined) polyline.style.onCanvas = parseInt(options.canvas, 10);
        }
        this.canvas.requestRender();
        this.requestUpdate();
    };

    render() {
        return html`
            <div class="actionButtonRow">
                <button class="configButton" @click=${() => this.deletePolyline()}>Delete Polyline</button>
                <button class="configButton" @click=${() => this.copyPolyline()}>Clone Polyline</button>
            </div>
            <div id="polylineAreaContainer">
                <button class="configButton" @click=${() => this.calcArea()}>Area/Length</button>
                <span id="polylineTextArea">${this.area}</span>
            </div>

            <div class="toolButtonRow">
                <button class="iconButton" @click=${() => this.rotateCCW()} title="Rotate CCW">${rotateCCWIcon}</button>
                <button class="iconButton" @click=${() => this.rotateCW()} title="Rotate CW">${rotateCWIcon}</button>
                <button class="iconButton" @click=${() => this.flipX()} title="Flip X">${flipXIcon}</button>
                <button class="iconButton" @click=${() => this.flipY()} title="Flip Y">${flipYIcon}</button>
            </div>

            <div class="checkboxRow">
                <tristate-checkbox
                    .state="${this.getFillState()}"
                    label="Fill"
                    .onChange="${(state: "none" | "all") => this.onStyleCheck({ fill: state === "all" })}"
                ></tristate-checkbox>
                <tristate-checkbox
                    .state="${this.getStrokeState()}"
                    label="Stroke"
                    .onChange="${(state: "none" | "all") => this.onStyleCheck({ stroke: state === "all" })}"
                ></tristate-checkbox>
                <tristate-checkbox
                    .state="${this.getClosedState()}"
                    label="Closed"
                    .onChange="${(state: "none" | "all") => this.onStyleCheck({ closed: state === "all" })}"
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

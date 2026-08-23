import { customElement, html, LitElement, property } from "lit-element";
import { DrawablePolyline } from "./DrawablePolyline";
import { DrawableText } from "./DrawableText";
import { Canvas } from "../Canvas";
import { ChipContent } from "../data/Chip";
import { alphaOf, rgbOf } from "../util/Color";
import "../elements/ColorAlphaElement";
import "../elements/TriStateCheckboxElement";
import "../elements/NumberInputElement";
import "../elements/SizeInputElement";
import { rotateCCWIcon, rotateCWIcon, flipXIcon, flipYIcon, deleteIcon, cloneIcon } from "../util/Icons";
import { TriState, getTriState, getUnifiedValue } from "../util/MultiSelect";
import { AABB } from "../util/AABB";
import { DeleteConfirmation } from "../util/DeleteConfirmation";
import { annotationHistory } from "../history/AnnotationHistory";

@customElement("polylineedit-element")
export class PolylineEdit extends LitElement {
    @property()
    polylines: DrawablePolyline[] = [];

    @property()
    linkedDrawables: (DrawablePolyline | DrawableText)[] = [];

    @property({ type: Boolean })
    showActions: boolean = true;
    @property({ type: Boolean })
    showTransformActions: boolean = true;
    @property({ type: Boolean })
    showMeasurement: boolean = true;
    @property({ type: Boolean })
    measurementOnly: boolean = false;

    @property()
    canvas: Canvas;
    @property()
    chipContent: ChipContent;

    private strokeChangedByUser = false;
    private fillChangedByUser = false;

    deletePolyline() {
        annotationHistory.removeDrawables(this.canvas, this.polylines, "polyline.delete");
    }

    confirmDeletePolyline() {
        const target = this.polylines.length === 1 ? "this polyline" : `${this.polylines.length} polylines`;
        DeleteConfirmation.confirm(target).then(confirmed => {
            if (confirmed) this.deletePolyline();
        });
    }

    copyPolyline() {
        const offset = this.canvas.getCamera().screenSizeToCanvas(20);
        annotationHistory.cloneDrawables(this.canvas, this.polylines, offset, offset, "polyline.clone");
    }

    @property()
    measurementLabel: string = "Length";
    @property()
    measurementValue: string = "";
    private measurementTimer: number = null;
    private unsubscribeHistory: () => void = null;

    connectedCallback() {
        super.connectedCallback();
        this.unsubscribeHistory = annotationHistory.subscribe(() => {
            if (!this.showMeasurement) return;
            if (this.measurementTimer !== null) window.clearTimeout(this.measurementTimer);
            this.measurementTimer = window.setTimeout(() => {
                this.measurementTimer = null;
                this.calculateMeasurement();
            }, 600);
        });
    }

    disconnectedCallback() {
        if (this.unsubscribeHistory) this.unsubscribeHistory();
        if (this.measurementTimer !== null) window.clearTimeout(this.measurementTimer);
        super.disconnectedCallback();
    }

    firstUpdated() {
        if (this.showMeasurement) this.calculateMeasurement();
    }

    private calculateMeasurement() {
        let width = this.chipContent.widthMillimeter;
        let height = this.chipContent.heightMillimeter;
        let lengthUnit = "mm";
        let areaUnit = "mm²";
        if (!(this.chipContent.widthMillimeter > 0 && this.chipContent.heightMillimeter > 0)) {
            width = this.chipContent.width;
            height = this.chipContent.height;
            lengthUnit = "pixels";
            areaUnit = "pixels²";
        }
        let totalArea = 0;
        let totalLength = 0;
        let hasArea = false;
        let hasLength = false;
        for (const polyline of this.polylines) {
            if (polyline.style.fill) {
                let area = polyline.calculator.area();
                totalArea += area / this.chipContent.width / this.chipContent.height * width * height;
                hasArea = true;
            } else {
                let length = polyline.calculator.length();
                totalLength += length * Math.sqrt(width * height / this.chipContent.width / this.chipContent.height);
                hasLength = true;
            }
        }
        const format = (value: number) => Math.round(value * 100) / 100;
        this.measurementLabel = hasArea && hasLength ? "Area / Length" : hasArea ? "Area" : "Length";
        this.measurementValue = [
            hasArea ? `${format(totalArea)} ${areaUnit}` : "",
            hasLength ? `${format(totalLength)} ${lengthUnit}` : "",
        ].filter(Boolean).join(" / ");
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
        annotationHistory.mutateDrawables(this.canvas, this.getTransformTargets(), "selection.rotateCCW", (items) => {
            for (const item of items as (DrawablePolyline | DrawableText)[]) item.rotateCCW(center.x, center.y);
        });
    }
    rotateCW() {
        const center = this.getSelectionCenter();
        if (!center) return;
        annotationHistory.mutateDrawables(this.canvas, this.getTransformTargets(), "selection.rotateCW", (items) => {
            for (const item of items as (DrawablePolyline | DrawableText)[]) item.rotateCW(center.x, center.y);
        });
    }
    flipX() {
        const center = this.getSelectionCenter();
        if (!center) return;
        annotationHistory.mutateDrawables(this.canvas, this.getTransformTargets(), "selection.flipX", (items) => {
            for (const item of items as (DrawablePolyline | DrawableText)[]) item.flipX(center.x);
        });
    }
    flipY() {
        const center = this.getSelectionCenter();
        if (!center) return;
        annotationHistory.mutateDrawables(this.canvas, this.getTransformTargets(), "selection.flipY", (items) => {
            for (const item of items as (DrawablePolyline | DrawableText)[]) item.flipY(center.y);
        });
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
    private getStrokeRgb(): number | undefined {
        return getUnifiedValue(this.polylines, p => rgbOf(p.style.strokeColor));
    }
    private getStrokeAlpha(): number | undefined {
        return getUnifiedValue(this.polylines, p => alphaOf(p.style.strokeColor));
    }
    private getFillRgb(): number | undefined {
        return getUnifiedValue(this.polylines, p => rgbOf(p.style.fillColor));
    }
    private getFillAlpha(): number | undefined {
        return getUnifiedValue(this.polylines, p => alphaOf(p.style.fillColor));
    }
    private getOnScreen(): number | undefined {
        return getUnifiedValue(this.polylines, p => p.style.onScreen);
    }
    private getOnCanvas(): number | undefined {
        return getUnifiedValue(this.polylines, p => p.style.onCanvas);
    }

    private onStyleCheck = (options: { fill?: boolean; stroke?: boolean; closed?: boolean }) => {
        if (options.stroke !== undefined) this.strokeChangedByUser = true;
        if (options.fill !== undefined) this.fillChangedByUser = true;
        annotationHistory.mutateDrawables(this.canvas, this.polylines, "polyline.style", (items) => {
            for (const polyline of items as DrawablePolyline[]) {
                if (options.fill !== undefined) polyline.style.fill = options.fill;
                if (options.stroke !== undefined) polyline.style.stroke = options.stroke;
                if (options.closed !== undefined) polyline.style.closed = options.closed;
            }
        });
        this.requestUpdate();
    };
    private onSizeInput = (options: { screen?: number; canvas?: number }) => {
        annotationHistory.mutateDrawables(this.canvas, this.polylines, "polyline.size", (items) => {
            for (const polyline of items as DrawablePolyline[]) {
                if (options.screen !== undefined) polyline.style.onScreen = options.screen;
                if (options.canvas !== undefined) polyline.style.onCanvas = options.canvas;
            }
        }, annotationHistory.mergeKey("polyline.size", this.polylines));
        this.requestUpdate();
    };

    updated(changedProperties: Map<string | number | symbol, unknown>) {
        if (changedProperties.has("polylines")) {
            this.strokeChangedByUser = false;
            this.fillChangedByUser = false;
            if (this.showMeasurement && this.chipContent) this.calculateMeasurement();
        }
    }

    render() {
        if (this.measurementOnly) {
            return this.showMeasurement ? html`
                <div id="polylineAreaContainer" class="polylineMeasurement">
                    <span>${this.measurementLabel}</span>
                    <strong id="polylineTextArea">${this.measurementValue}</strong>
                </div>` : html``;
        }
        const strokeState = this.getStrokeState();
        const fillState = this.getFillState();
        const strokeVisible = strokeState !== "none";
        const fillVisible = fillState !== "none";
        const actionButtons = this.showActions
            ? html`
                <button class="iconButton deleteIconButton" @click=${() => this.confirmDeletePolyline()} title="Delete Polyline" aria-label="Delete Polyline">${deleteIcon}</button>
                <button class="iconButton" @click=${() => this.copyPolyline()} title="Clone Polyline" aria-label="Clone Polyline">${cloneIcon}</button>
            `
            : html``;

        return html`
            ${this.showActions || this.showTransformActions ? html`<div class="toolButtonRow">
                ${actionButtons}
                ${this.showTransformActions ? html`
                    <button class="iconButton" @click=${() => this.rotateCCW()} title="Rotate CCW">${rotateCCWIcon}</button>
                    <button class="iconButton" @click=${() => this.rotateCW()} title="Rotate CW">${rotateCWIcon}</button>
                    <button class="iconButton" @click=${() => this.flipX()} title="Flip X">${flipXIcon}</button>
                    <button class="iconButton" @click=${() => this.flipY()} title="Flip Y">${flipYIcon}</button>
                ` : html``}
            </div>` : html``}
            ${this.showMeasurement ? html`<div id="polylineAreaContainer" class="polylineMeasurement">
                <span>${this.measurementLabel}</span>
                <strong id="polylineTextArea">${this.measurementValue}</strong>
            </div>` : html``}

            <div class="editorConfigSection${strokeVisible ? "" : " collapsed"}${this.strokeChangedByUser ? "" : " noAnimation"}">
                <div class="configColorHeader">
                    <span class="configColorPrimary editorConfigTitle">
                        <tristate-checkbox
                            .state="${strokeState}"
                            .onChange="${(state: "none" | "all") => this.onStyleCheck({ stroke: state === "all" })}"
                        ></tristate-checkbox>
                        <span>Stroke</span>
                    </span>
                    <span class="configColorHeaderControls">
                        <tristate-checkbox
                            .state="${this.getClosedState()}"
                            label="Closed"
                            .onChange="${(state: "none" | "all") => this.onStyleCheck({ closed: state === "all" })}"
                        ></tristate-checkbox>
                    </span>
                </div>
                <coloralpha-element
                    .currentRgb=${this.getStrokeRgb()}
                    .currentAlpha=${this.getStrokeAlpha()}
                    .setRgb=${(rgb: number) => {
                annotationHistory.mutateDrawables(this.canvas, this.polylines, "polyline.strokeColor", (items) => {
                    for (const polyline of items as DrawablePolyline[]) polyline.style.setStrokeColor(rgb, undefined);
                }, annotationHistory.mergeKey("polyline.strokeColor", this.polylines));
            }}
                    .setAlpha=${(alpha: number) => {
                annotationHistory.mutateDrawables(this.canvas, this.polylines, "polyline.strokeAlpha", (items) => {
                    for (const polyline of items as DrawablePolyline[]) polyline.style.setStrokeColor(undefined, alpha);
                }, annotationHistory.mergeKey("polyline.strokeAlpha", this.polylines));
            }}
                ></coloralpha-element>
                <size-input
                    .screen=${this.getOnScreen()}
                    .image=${this.getOnCanvas()}
                    .setScreen=${(value: number) => this.onSizeInput({ screen: value })}
                    .setImage=${(value: number) => this.onSizeInput({ canvas: value })}
                ></size-input>
            </div>
            <div class="editorConfigSection${fillVisible ? "" : " collapsed"}${this.fillChangedByUser ? "" : " noAnimation"}">
                <div class="configColorHeader">
                    <span class="configColorPrimary editorConfigTitle">
                        <tristate-checkbox
                            .state="${fillState}"
                            .onChange="${(state: "none" | "all") => this.onStyleCheck({ fill: state === "all" })}"
                        ></tristate-checkbox>
                        <span>Fill</span>
                    </span>
                </div>
                <coloralpha-element
                    .currentRgb=${this.getFillRgb()}
                    .currentAlpha=${this.getFillAlpha()}
                    .setRgb=${(rgb: number) => {
                annotationHistory.mutateDrawables(this.canvas, this.polylines, "polyline.fillColor", (items) => {
                    for (const polyline of items as DrawablePolyline[]) polyline.style.setFillColor(rgb, undefined);
                }, annotationHistory.mergeKey("polyline.fillColor", this.polylines));
            }}
                    .setAlpha=${(alpha: number) => {
                annotationHistory.mutateDrawables(this.canvas, this.polylines, "polyline.fillAlpha", (items) => {
                    for (const polyline of items as DrawablePolyline[]) polyline.style.setFillColor(undefined, alpha);
                }, annotationHistory.mergeKey("polyline.fillAlpha", this.polylines));
            }}
                ></coloralpha-element>
            </div>

        `;
    }

    createRenderRoot() {
        return this;
    }
}

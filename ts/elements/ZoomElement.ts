import {css, customElement, html, LitElement, property} from "lit-element";
import {Camera} from "../Camera";
import {Canvas} from "../Canvas";

@customElement('zoom-element')
export class ZoomElement extends LitElement {

    @property()
    canvas: Canvas;
    @property()
    camera: Camera;

    protected firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
        super.firstUpdated(_changedProperties);
        this.canvas.registerAfterRender(() => this.refreshState());
    }

    private zoomIn() {
        this.zoomButtonTo(true);
    }
    private zoomOut() {
        this.zoomButtonTo(false);
    }
    private zoomButtonTo(zoomIn: boolean) {
        this.camera.setScaleAroundScreenPoint(this.getNextButtonScale(zoomIn), this.canvas.getWidth() / 2, this.canvas.getHeight() / 2);
        this.camera.action();
        this.canvas.requestRender();
    }
    private getNextButtonScale(zoomIn: boolean): number {
        let exponent = Math.log(this.camera.getScale()) / Math.log(Camera.ZOOM_STEP);
        let nearest = Math.round(exponent);
        let isOnStep = Math.abs(exponent - nearest) < 0.000001;
        let targetExponent = zoomIn
            ? (isOnStep ? nearest + 1 : Math.ceil(exponent))
            : (isOnStep ? nearest - 1 : Math.floor(exponent));
        return Math.pow(Camera.ZOOM_STEP, targetExponent);
    }
    private fitToScreen() {
        this.camera.fitToScreen();
        this.camera.action();
        this.canvas.requestRender();
    }
    private actualSize() {
        this.camera.setScaleAroundScreenPoint(1, this.canvas.getWidth() / 2, this.canvas.getHeight() / 2);
        this.camera.action();
        this.canvas.requestRender();
    }
    private onSliderInput(event: Event) {
        let value = Number((event.target as HTMLInputElement).value);
        this.camera.setScaleAroundScreenPoint(this.sliderToScale(value), this.canvas.getWidth() / 2, this.canvas.getHeight() / 2);
        this.camera.action();
        this.canvas.requestRender();
    }

    @property()
    private zoomText: string = "\xA0";
    @property()
    private sliderValue: number = 0;
    private readonly sliderMin: number = 0;
    private readonly sliderMax: number = 1000;
    private refreshState() {
        let newText = this.formatScale(this.camera.getScale());
        let newSliderValue = this.scaleToSlider(this.camera.getScale());
        if (this.zoomText !== newText) {
            this.zoomText = newText;
        }
        if (this.sliderValue !== newSliderValue) {
            this.sliderValue = newSliderValue;
        }
    }
    private formatScale(scale: number): string {
        let exponent = Math.log2(scale);
        let nearest = Math.round(exponent);
        if (Math.abs(exponent - nearest) < 0.000001) {
            if (nearest >= 0) return `${Math.pow(2, nearest)}:1`;
            return `1:${Math.pow(2, -nearest)}`;
        }
        return `${Math.round(scale * 100)}%`;
    }
    private scaleToSlider(scale: number): number {
        let min = Math.log(this.camera.getScaleMin());
        let max = Math.log(this.camera.getScaleMax());
        return Math.round((Math.log(scale) - min) / (max - min) * this.sliderMax);
    }
    private sliderToScale(value: number): number {
        let min = Math.log(this.camera.getScaleMin());
        let max = Math.log(this.camera.getScaleMax());
        let ratio = (value - this.sliderMin) / (this.sliderMax - this.sliderMin);
        return Math.exp(min + (max - min) * ratio);
    }

    render() {
        return html`
            <div class="zoomControls">
                <button class="zoomButton" title="Zoom out" @click=${() => this.zoomOut()}>
                    <img src="res/zoomOut.png" alt="" />
                </button>
                <input
                    class="zoomSlider"
                    type="range"
                    min=${this.sliderMin}
                    max=${this.sliderMax}
                    .value=${String(this.sliderValue)}
                    title=${this.zoomText}
                    @input=${(event: Event) => this.onSliderInput(event)}
                />
                <button class="zoomButton" title="Zoom in" @click=${() => this.zoomIn()}>
                    <img src="res/zoomIn.png" alt="" />
                </button>
                <span class="zoomText">${this.zoomText}</span>
                <button class="viewButton" title="Fit to screen" @click=${() => this.fitToScreen()}>Fit</button>
                <button class="viewButton" title="Actual size" @click=${() => this.actualSize()}>100%</button>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

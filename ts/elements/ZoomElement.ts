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
        this.zoomAroundCenter(1.2);
    }
    private zoomOut() {
        this.zoomAroundCenter(1 / 1.2);
    }
    private zoomAroundCenter(ratio: number) {
        this.camera.changeScaleAroundScreenPoint(ratio, this.canvas.getWidth() / 2, this.canvas.getHeight() / 2);
        this.camera.action();
        this.canvas.requestRender();
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
    private resetView() {
        this.camera.resetView();
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
        let newText = `${Math.round(this.camera.getScale() * 100)}%`;
        let newSliderValue = this.scaleToSlider(this.camera.getScale());
        if (this.zoomText !== newText) {
            this.zoomText = newText;
        }
        if (this.sliderValue !== newSliderValue) {
            this.sliderValue = newSliderValue;
        }
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
                <button class="viewButton" title="Reset view" @click=${() => this.resetView()}>Reset</button>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

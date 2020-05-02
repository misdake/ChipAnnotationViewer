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
        this.canvas.registerAfterRender(() => this.refreshText());
    }

    private zoomIn() {
        this.camera.changeZoomBy(-1);
        this.camera.action();
        this.canvas.requestRender();
    }
    private zoomOut() {
        this.camera.changeZoomBy(1);
        this.camera.action();
        this.canvas.requestRender();
    }

    @property()
    private zoomText: string = "\xA0";
    private refreshText() {
        let density = this.camera.screenSizeToCanvas(1);
        let newText = "";
        if(density === 1) {
            newText = "1x";
        } else if(density>1) {
            newText = `1/${density}x`;
        } else {
            newText = `${1/density}x`;
        }
        if (this.zoomText !== newText) {
            this.zoomText = newText;
        }
    }

    render() {
        return html`
            <img src="res/zoomIn.png" class="zoomButton" alt="zoomIn" @click=${() => this.zoomIn()} /><br>
            <img src="res/zoomOut.png" class="zoomButton" alt="zoomOut" @click=${() => this.zoomOut()} /><br>
            <span class="zoomText">${this.zoomText}</span>
        `;
    }

    createRenderRoot() {
        return this;
    }

}
import {Content} from "./Content";

export class Camera {
    private zoomMin: number;
    private zoomMax: number;
    private zoom: number;

    private cx: number;
    private cy: number;

    public constructor() {
    }

    public load(content: Content) {
        this.zoomMin = 0;
        this.zoomMax = content.maxLevel;
        this.zoom = content.maxLevel;
        this.checkZoom();

        this.cx = content.width / 2;
        this.cy = content.height / 2;
    }

    public move(dx: number, dy: number) {
        this.cx += dx;
        this.cy += dy;
    }
    public getX(): number {
        return this.cx;
    }
    public getY(): number {
        return this.cy;
    }

    public getZoom(): number {
        return this.zoom;
    }
    public changeZoomBy(amount: number) {
        this.zoom += amount;
        this.checkZoom();
    }
    public setZoomTo(zoom: number) {
        this.zoom = zoom;
        this.checkZoom();
    }
    private checkZoom() {
        if (this.zoom < this.zoomMin) this.zoom = this.zoomMin;
        if (this.zoom > this.zoomMax) this.zoom = this.zoomMax;
    }
}
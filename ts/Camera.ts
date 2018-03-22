import {Content} from "./Content";
import {Canvas} from "./Canvas";
import {Point} from "./Point";

export class Camera {
    private canvas: Canvas;

    private zoom: number;
    private zoomMin: number;
    private zoomMax: number;

    private x: number;
    private y: number;
    private xMin: number;
    private xMax: number;
    private yMin: number;
    private yMax: number;

    public constructor() {
    }

    public load(canvas: Canvas, content: Content) {
        this.canvas = canvas;
        this.zoomMin = 0;
        this.zoomMax = content.maxLevel;
        this.zoom = content.maxLevel;
        this.checkZoom();

        this.x = content.width / 2;
        this.y = content.height / 2;
        this.xMin = 0;
        this.xMax = content.width;
        this.yMin = 0;
        this.yMax = content.height;
    }

    public setXy(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.checkXy();
    }
    public moveXy(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
        this.checkXy();
    }
    public getX(): number {
        return this.x;
    }
    public getY(): number {
        return this.y;
    }
    private checkXy() {
        this.x = Math.min(Math.max(this.x, this.xMin), this.xMax);
        this.y = Math.min(Math.max(this.y, this.yMin), this.yMax);
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
        this.zoom = Math.min(Math.max(this.zoom, this.zoomMin), this.zoomMax);
    }


    private scale: number;
    private tx: number;
    private ty: number;

    public action() {
        this.checkXy();
        this.checkZoom();

        let scale = 1.0 / (1 << this.zoom);
        this.scale = scale;
        this.tx = this.canvas.getWidth() / 2 - this.x * scale;
        this.ty = this.canvas.getHeight() / 2 - this.y * scale;
    }

    public screenPointToCanvas(point: Point): Point {
        return this.screenXyToCanvas(point.x, point.y);
    }
    public screenXyToCanvas(x: number, y: number): Point {
        let targetX = (x - this.tx) / this.scale;
        let targetY = (y - this.ty) / this.scale;
        return new Point(targetX, targetY);
    }
    public canvasPointToScreen(point: Point): Point {
        return this.canvasXyToScreen(point.x, point.y);
    }
    public canvasXyToScreen(x: number, y: number): Point {
        let targetX = x * this.scale + this.tx;
        let targetY = y * this.scale + this.ty;
        return new Point(targetX, targetY);
    }
    public screenSizeToCanvas(s: number): number {
        return s / this.scale;
    }
    public canvasSizeToScreen(s: number): number {
        return s * this.scale;
    }
}
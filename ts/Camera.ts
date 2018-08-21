import {Content} from "./Content";
import {Canvas} from "./Canvas";
import {Position} from "./util/Transform";

export class Camera {
    private canvas: Canvas;

    private zoom: number;
    private zoomMin: number;
    private zoomMax: number;

    private position: Position = new Position(0, 0);

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

        this.position.x = content.width / 2;
        this.position.y = content.height / 2;
        this.xMin = 0;
        this.xMax = content.width;
        this.yMin = 0;
        this.yMax = content.height;
    }
    public moveXy(dx: number, dy: number) {
        this.position.x += dx;
        this.position.y += dy;
        this.checkXy();
    }
    private checkXy() {
        this.position.x = Math.min(Math.max(this.position.x, this.xMin), this.xMax);
        this.position.y = Math.min(Math.max(this.position.y, this.yMin), this.yMax);
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
        this.tx = this.canvas.getWidth() / 2 - this.position.x * scale;
        this.ty = this.canvas.getHeight() / 2 - this.position.y * scale;
    }

    public screenXyToCanvas(x: number, y: number): Position {
        let targetX = (x - this.tx) / this.scale;
        let targetY = (y - this.ty) / this.scale;
        return new Position(targetX, targetY);
    }
    public canvasToScreen(x: number, y: number): Position {
        let targetX = x * this.scale + this.tx;
        let targetY = y * this.scale + this.ty;
        return new Position(targetX, targetY);
    }
    public screenSizeToCanvas(s: number): number {
        return s / this.scale;
    }
    public canvasSizeToScreen(s: number): number {
        return s * this.scale;
    }
}
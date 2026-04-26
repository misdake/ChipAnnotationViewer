import {Map} from "./data/Map";
import {Canvas} from "./Canvas";
import {Position} from "./util/Transform";
import {AABB} from "./util/AABB";

export class Camera {
    private canvas: Canvas;

    private scale: number;
    private scaleMin: number;
    private scaleMax: number;
    private maxLevel: number;

    private position: Position = new Position(0, 0);
    private defaultPosition: Position = new Position(0, 0);
    private defaultScale: number;

    private xMin: number;
    private xMax: number;
    private yMin: number;
    private yMax: number;

    public constructor() {
    }

    public load(canvas: Canvas, map: Map) {
        this.canvas = canvas;
        this.maxLevel = map.maxLevel;
        this.scaleMax = this.zoomToScale(-2);
        this.scaleMin = this.zoomToScale(map.maxLevel);
        //zoom in a bit if screen is large enough.
        let zoomOffset = Math.floor(Math.log2(Math.min(this.canvas.getWidth(), this.canvas.getHeight())) - Math.log2(Math.max(map.width, map.height)) + map.maxLevel);
        this.scale = this.zoomToScale(map.maxLevel - zoomOffset);
        this.checkScale();

        this.position.x = map.width / 2;
        this.position.y = map.height / 2;
        this.defaultPosition.x = this.position.x;
        this.defaultPosition.y = this.position.y;
        this.defaultScale = this.scale;
        this.xMin = 0;
        this.xMax = map.width;
        this.yMin = 0;
        this.yMax = map.height;
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
        return this.scaleToZoom(this.scale);
    }
    public changeZoomBy(amount: number) {
        this.setZoomTo(this.getZoom() + amount);
    }
    public setZoomTo(zoom: number) {
        this.setScaleTo(this.zoomToScale(zoom));
    }
    public getScale(): number {
        return this.scale;
    }
    public getScaleMin(): number {
        return this.scaleMin;
    }
    public getScaleMax(): number {
        return this.scaleMax;
    }
    public changeScaleBy(ratio: number) {
        this.setScaleTo(this.scale * ratio);
    }
    public setScaleTo(scale: number) {
        this.scale = scale;
        this.checkScale();
    }
    public setScaleAroundScreenPoint(scale: number, x: number, y: number) {
        this.action();
        let point1 = this.screenXyToCanvas(x, y);
        this.setScaleTo(scale);
        this.action();
        let point2 = this.screenXyToCanvas(x, y);
        this.moveXy(point1.x - point2.x, point1.y - point2.y);
    }
    public changeScaleAroundScreenPoint(ratio: number, x: number, y: number) {
        this.setScaleAroundScreenPoint(this.scale * ratio, x, y);
    }
    public resetView() {
        this.position.x = this.defaultPosition.x;
        this.position.y = this.defaultPosition.y;
        this.scale = this.defaultScale;
        this.checkXy();
        this.checkScale();
    }
    public fitToScreen() {
        if (!this.canvas) return;
        this.position.x = (this.xMin + this.xMax) / 2;
        this.position.y = (this.yMin + this.yMax) / 2;
        this.setScaleTo(Math.min(
            this.canvas.getWidth() / (this.xMax - this.xMin),
            this.canvas.getHeight() / (this.yMax - this.yMin),
        ));
    }
    public getTileLevel(): number {
        return Math.min(Math.max(Math.round(this.getZoom()), 0), this.maxLevel);
    }
    private checkScale() {
        this.scale = Math.min(Math.max(this.scale, this.scaleMin), this.scaleMax);
    }
    private zoomToScale(zoom: number): number {
        return 1.0 / Math.pow(2, zoom);
    }
    private scaleToZoom(scale: number): number {
        return Math.log2(1.0 / scale);
    }


    private tx: number;
    private ty: number;

    public action() {
        if (!this.canvas) return;
        this.checkXy();
        this.checkScale();

        this.tx = this.canvas.getWidth() / 2 - this.position.x * this.scale;
        this.ty = this.canvas.getHeight() / 2 - this.position.y * this.scale;
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

    public canvasAABBInScreen(aabb: AABB): boolean {
        let x1 = aabb.x1 * this.scale + this.tx;
        let y1 = aabb.y1 * this.scale + this.ty;
        let x2 = aabb.x2 * this.scale + this.tx;
        let y2 = aabb.y2 * this.scale + this.ty;

        let w = this.canvas.getWidth();
        let h = this.canvas.getHeight();
        return !(x2 < 0 || x1 > w || y2 < 0 || y1 > h);
    }
}

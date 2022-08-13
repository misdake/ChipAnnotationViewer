import {ChipContent} from "./data/Chip";
import {Canvas} from "./Canvas";
import {Position} from "./util/Transform";
import {AABB} from "./util/AABB";

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

    public load(canvas: Canvas, chip: ChipContent) {
        this.canvas = canvas;
        this.zoomMin = -2;
        this.zoomMax = chip.maxLevel;
        //zoom in a bit if screen is large enough.
        let zoomOffset = Math.floor(Math.log2(Math.min(this.canvas.getWidth(), this.canvas.getHeight())) - Math.log2(Math.max(chip.width, chip.height)) + chip.maxLevel);
        this.zoom = chip.maxLevel - zoomOffset;
        this.checkZoom();

        this.position.x = chip.width / 2;
        this.position.y = chip.height / 2;
        this.xMin = 0;
        this.xMax = chip.width;
        this.yMin = 0;
        this.yMax = chip.height;
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
        if (!this.canvas) return;
        this.checkXy();
        this.checkZoom();

        let scale = 1.0 / Math.pow(2, this.zoom);
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

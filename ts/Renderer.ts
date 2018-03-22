import {Canvas} from "./Canvas";
import {Camera} from "./Camera";
import {Point} from "./Point";

export class Renderer {
    private canvas: Canvas;
    private canvasElement: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private sx: number;
    private sy: number;
    private tx: number;
    private ty: number;

    public constructor(canvas: Canvas, canvasElement: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.canvasElement = canvasElement;
        this.context = context;
    }

    public begin(camera: Camera): void {
        this.context.fillStyle = "#000000";
        this.context.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        let zoom = 1.0 / (1 << camera.getZoom());
        this.sx = zoom;
        this.tx = this.canvas.getWidth() / 2 - camera.getX() * zoom;
        this.sy = zoom;
        this.ty = this.canvas.getHeight() / 2 - camera.getY() * zoom;
    }

    public image(image: HTMLImageElement, x: number, y: number, width: number, height: number) {
        let point = this.canvasXyToScreen(x, y);
        let targetW = width * this.sx;
        let targetH = height * this.sy;

        if (point.x > this.canvas.getWidth() || point.y > this.canvas.getHeight()) return;
        if (point.x + targetW < 0 || point.y + targetH < 0) return;
        this.context.drawImage(image, point.x, point.y, targetW, targetH);
    }

    public screenPointToCanvas(point: Point): Point {
        return this.screenXyToCanvas(point.x, point.y);
    }

    public screenXyToCanvas(x: number, y: number): Point {
        let targetX = (x - this.tx) / this.sx;
        let targetY = (y - this.ty) / this.sy;
        return new Point(targetX, targetY);
    }

    public canvasPointToScreen(point: Point): Point {
        return this.canvasXyToScreen(point.x, point.y);
    }

    public canvasXyToScreen(x: number, y: number): Point {
        let targetX = x * this.sx + this.tx;
        let targetY = y * this.sy + this.ty;
        return new Point(targetX, targetY);
    }

}
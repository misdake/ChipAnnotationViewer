import {Canvas} from "./Canvas";
import {Camera} from "./Camera";

export class Renderer {
    private canvas: Canvas;
    private canvasElement: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    public constructor(canvas: Canvas, canvasElement: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.canvasElement = canvasElement;
        this.context = context;
    }

    public clear(): void {
        this.context.fillStyle = "#000000";
        this.context.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    public setColor(color: string) {
        this.context.fillStyle = color;
        this.context.strokeStyle = color;
    }

    public image(camera: Camera, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
        //transform to screen space
        let point = camera.canvasXyToScreen(x, y);
        let targetW = camera.canvasSizeToScreen(width);
        let targetH = camera.canvasSizeToScreen(height);

        //skip out-of-screen images
        if (point.x > this.canvas.getWidth() || point.y > this.canvas.getHeight()) return;
        if (point.x + targetW < 0 || point.y + targetH < 0) return;

        this.context.drawImage(image, point.x, point.y, targetW, targetH);
    }

}
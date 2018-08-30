import {Canvas} from "./Canvas";
import {Camera} from "./Camera";
import {Transform} from "./util/Transform";
import {LineWidth} from "./util/LineWidth";
import {ScreenRect} from "./util/ScreenRect";

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

    private calculateLineWidth(camera: Camera, lineWidth?: LineWidth): number {
        if (!lineWidth) return 1;
        let onScreen = lineWidth.onScreen;
        let onCanvas = camera.canvasSizeToScreen(lineWidth.onCanvas);
        let ofScreenSize = lineWidth.ofScreenSize * Math.min(this.canvasElement.width, this.canvasElement.height);
        return onScreen + onCanvas + ofScreenSize;
    }


    //---------------------------------------------
    //polyline

    public renderPolyline(camera: Camera, points: number[][], closed: boolean, fill: boolean, stroke: boolean, lineWidth?: LineWidth) {
        if (points.length == 0) return;

        this.context.lineWidth = this.calculateLineWidth(camera, lineWidth);
        this.context.beginPath();

        let start = camera.canvasToScreen(points[0][0], points[0][1]);
        this.context.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
            let point = camera.canvasToScreen(points[i][0], points[i][1]);
            this.context.lineTo(point.x, point.y);
        }
        if (closed) {
            this.context.closePath();
        }

        if (fill) {
            this.context.fill();
        }
        if (stroke) {
            this.context.stroke();
        }
    }

    //polyline
    //---------------------------------------------


    //---------------------------------------------
    //image

    public testImageVisibility(camera: Camera, image: HTMLImageElement, transform: Transform, width: number, height: number, range: number): ScreenRect {
        //transform to screen space
        let point = camera.canvasToScreen(transform.position.x, transform.position.y);
        let targetW = camera.canvasSizeToScreen(width);
        let targetH = camera.canvasSizeToScreen(height);

        //skip out-of-screen images
        if (point.x - range > this.canvas.getWidth() || point.y - range > this.canvas.getHeight()) return null;
        if (point.x + targetW + range < 0 || point.y + targetH + range < 0) return null;

        return new ScreenRect(point.x, point.y, targetW, targetH);
    }

    public renderImage(camera: Camera, image: HTMLImageElement, transform: Transform, width: number, height: number) {
        let rect = this.testImageVisibility(camera, image, transform, width, height, 0);
        this.drawImage(image, rect);
    }

    public drawImage(image: HTMLImageElement, rect: ScreenRect) {
        if (rect) {
            //actually render image
            this.context.drawImage(image, rect.left, rect.top, rect.width, rect.height);
        }
    }

    //image
    //---------------------------------------------


    //---------------------------------------------
    //circle rect

    public renderCircle(camera: Camera, x: number, y: number, radius: number, fill: boolean, stroke: boolean, lineWidth?: LineWidth) {
        let position = camera.canvasToScreen(x, y);
        let size = camera.canvasSizeToScreen(radius);
        this.drawCircle(position.x, position.y, size, fill, stroke);
        this.context.lineWidth = this.calculateLineWidth(camera, lineWidth);
    }

    public drawCircle(x: number, y: number, radius: number, fill: boolean, stroke: boolean, lineWidth?: number) {
        if (lineWidth) this.context.lineWidth = lineWidth;

        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        this.context.closePath();

        if (fill) {
            this.context.fill();
        }
        if (stroke) {
            this.context.stroke();
        }
    }

    //circle rect
    //---------------------------------------------
}
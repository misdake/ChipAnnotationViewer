import { Canvas } from './Canvas';
import { Camera } from './Camera';
import { Transform } from './util/Transform';
import { Size } from './util/Size';
import { ScreenRect } from './util/ScreenRect';
import { Point } from './editable/DrawablePolyline';

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
    public setFillColor(color: string) {
        this.context.fillStyle = color;
    }
    public setStrokeColor(color: string) {
        this.context.strokeStyle = color;
    }

    public calculateLineWidth(camera: Camera, lineWidth?: Size): number {
        if (!lineWidth) return 1;
        let onScreen = lineWidth.onScreen;
        let onCanvas = camera.canvasSizeToScreen(lineWidth.onCanvas);
        return onScreen + onCanvas;
    }


    //---------------------------------------------
    //polyline

    public renderPolyline(camera: Camera, points: Point[], closed: boolean, fill: boolean, stroke: boolean, lineWidth?: Size) {
        if (points.length == 0) return;

        this.context.lineWidth = this.calculateLineWidth(camera, lineWidth);
        this.context.beginPath();
        this.context.lineCap = "round";
        this.context.lineJoin = "round";

        let start = camera.canvasToScreen(points[0].x, points[0].y);
        this.context.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
            let point = camera.canvasToScreen(points[i].x, points[i].y);
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

    public testImageVisibility(camera: Camera, transform: Transform, width: number, height: number, range: number): ScreenRect {
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
        let rect = this.testImageVisibility(camera, transform, width, height, 0);
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
    //shape

    public renderCircle(camera: Camera, x: number, y: number, radius: number, fill: boolean, stroke: boolean, lineWidth?: Size) {
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

    public drawRect(x1: number, y1: number, x2: number, y2: number, fill: boolean, stroke: boolean, lineWidth?: number) {
        if (lineWidth) this.context.lineWidth = lineWidth;

        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x1, y2);
        this.context.lineTo(x2, y2);
        this.context.lineTo(x2, y1);
        this.context.closePath();

        if (fill) {
            this.context.fill();
        }
        if (stroke) {
            this.context.stroke();
        }
    }

    //shape
    //---------------------------------------------


    //---------------------------------------------
    //text

    public measureText(camera: Camera, text: string, fontSize: Size) {
        let lines = text.split('^^');
        let size = this.calculateLineWidth(camera, fontSize);
        this.context.font = size + "px Arial";
        let maxWidth = 0;
        for (let line of lines) {
            let textMetrics = this.context.measureText(line);
            maxWidth = Math.max(textMetrics.width, maxWidth);
        }
        return {width: maxWidth, totalHeight: size * lines.length, fontSize: size};
    }

    public renderText(camera: Camera, text: string, fontSize: number, x: number, y: number, anchorX: CanvasTextAlign, anchorY: CanvasTextBaseline) {
        let position = camera.canvasToScreen(x, y);
        let lines = text.split("^^");
        let offsetY = (lines.length - 1) * fontSize / 2;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            this.drawText(line, fontSize, position.x, position.y + (i * fontSize) - offsetY, anchorX, anchorY);
        }
    }

    public drawText(text: string, fontSize: number, x: number, y: number, anchorX: CanvasTextAlign, anchorY: CanvasTextBaseline) {
        this.context.textAlign = anchorX;
        this.context.textBaseline = anchorY;
        this.context.font = fontSize + "px Arial";

        this.context.shadowColor = "black";
        this.context.shadowBlur = fontSize * 0.2;
        this.context.fillText(text, x, y);
        this.context.shadowBlur = 0;
    }

    //text
    //---------------------------------------------
}

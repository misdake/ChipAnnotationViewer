import {Drawable} from "./Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";
import {LineWidth} from "../util/LineWidth";

export class Point {
    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    public x: number;
    public y: number;
}

export class PointSegmentResult {
    constructor(position: Point, p1Index: number, p2Index: number, distance: number) {
        this.position = position;
        this.p1Index = p1Index;
        this.p2Index = p2Index;
        this.distance = distance;
    }
    position: Point;
    p1Index: number;
    p2Index: number;
    distance: number;
}

export class DrawablePolyline extends Drawable {

    public closed: boolean;
    public fill: boolean;
    public stroke: boolean;
    public fillColor?: string;
    public strokeColor?: string;
    public lineWidth?: LineWidth;
    public points: Point[];

    public constructor(points: Point[], closed: boolean, fill: boolean, lineWidth?: LineWidth) {
        super();
        this.points = points;
        this.closed = closed;
        this.fill = fill;
        this.stroke = true; //TODO add to parameter
        this.lineWidth = lineWidth;
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        if (this.fillColor) renderer.setFillColor(this.fillColor);
        if (this.strokeColor) renderer.setStrokeColor(this.strokeColor);
        renderer.renderPolyline(camera, this.points, this.closed, this.fill, this.stroke, this.lineWidth);
    }

    private static sqr(dx: number, dy: number) {
        return dx * dx + dy * dy;
    }
    private static testPointSegment(points: Point[], i1: number, i2: number, x: number, y: number): PointSegmentResult {
        let p1 = points[i1];
        let p2 = points[i2];
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dd = DrawablePolyline.sqr(dx, dy);
        if (dd < 0.0001) return null;

        let scalar = ((x - p1.x) * dx + (y - p1.y) * dy) / dd;
        if (scalar > 1) scalar = 1;
        if (scalar < 0) scalar = 0;

        let tx = p1.x + scalar * dx;
        let ty = p1.y + scalar * dy;

        let distance2 = DrawablePolyline.sqr(x - tx, y - ty);
        return new PointSegmentResult(new Point(tx, ty), i1, i2, Math.sqrt(distance2));
    }
    private static testPointPolygon(points: Point[], x: number, y: number): boolean {
        let length = points.length;
        let r: boolean = false;
        for (let i = 0, j = length - 1; i < length; j = i++) {
            if (((points[i].y > y) != (points[j].y > y)) &&
                (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x))
                r = !r;
        }
        return r;
    }

    public pickPoint(canvasX: number, canvasY: number, radius: number): Point {
        let radius2 = radius * radius;
        for (const point of this.points) {
            if (DrawablePolyline.sqr(point.x - canvasX, point.y - canvasY) <= radius2) {
                return point;
            }
        }
        return null;
    }
    public pickLine(canvasX: number, canvasY: number, radius: number): PointSegmentResult {
        let minResult: PointSegmentResult = null;
        let minDistance: number = Number.MAX_VALUE;

        let length = this.points.length;
        for (let i = 0, j = length - 1; i < length; j = i++) {
            let result = DrawablePolyline.testPointSegment(this.points, i, j, canvasX, canvasY);
            if (result && result.distance < radius) {
                if (result.distance < minDistance) {
                    minDistance = result.distance;
                    minResult = result;
                }
            }
        }
        return minResult;
    }
    public pickShape(canvasX: number, canvasY: number): boolean {
        return DrawablePolyline.testPointPolygon(this.points, canvasX, canvasY);
    }

}
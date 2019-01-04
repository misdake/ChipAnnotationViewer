import {Drawable} from "./Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";
import {Size} from "../util/Size";
import {AlphaEntry, ColorEntry, combineColorAlpha} from "../util/Color";

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

export class DrawablePolylinePack {
    public constructor(points: Point[], closed: boolean, lineWidth: Size,
                       fill: boolean, fillColorName: string, fillAlphaName: string,
                       stroke: boolean, strokeColorName: string, strokeAlphaName: string) {
        this.points = points;
        this.closed = closed;
        this.lineWidth = lineWidth;

        this.fill = fill;
        this.fillColorName = fillColorName;
        this.fillAlphaName = fillAlphaName;

        this.stroke = stroke;
        this.strokeColorName = strokeColorName;
        this.strokeAlphaName = strokeAlphaName;
    }

    points: Point[];
    closed: boolean;
    lineWidth: Size;

    fill: boolean;
    fillColorName: string;
    fillAlphaName: string;

    stroke: boolean;
    strokeColorName: string;
    strokeAlphaName: string;
}

export class DrawablePolyline extends Drawable {
    public static readonly typeName = "DrawablePolyline";

    public points: Point[];
    public closed: boolean;
    public lineWidth?: Size;

    public fill: boolean;
    public fillColor: ColorEntry;
    public fillAlpha: AlphaEntry;
    public fillString: string;

    public stroke: boolean;
    public strokeColor: ColorEntry;
    public strokeAlpha: AlphaEntry;
    public strokeString: string;


    public constructor(pack: DrawablePolylinePack) {
        super();
        this.points = pack.points;
        this.closed = pack.closed;
        this.lineWidth = pack.lineWidth;

        this.fill = pack.fill;
        this.fillColor = ColorEntry.findByName(pack.fillColorName);
        this.fillAlpha = AlphaEntry.findByName(pack.fillAlphaName);
        this.fillString = combineColorAlpha(this.fillColor, this.fillAlpha);

        this.stroke = pack.stroke;
        this.strokeColor = ColorEntry.findByName(pack.strokeColorName);
        this.strokeAlpha = AlphaEntry.findByName(pack.strokeAlphaName);
        this.strokeString = combineColorAlpha(this.strokeColor, this.strokeAlpha);
    }

    public clone(offsetX: number, offsetY: number): DrawablePolylinePack {
        let points = [];
        for (const point of this.points) {
            points.push(new Point(point.x + offsetX, point.y + offsetY));
        }

        return new DrawablePolylinePack(
            points,
            this.closed,
            this.lineWidth,

            this.fill,
            this.fillColor.name,
            this.fillAlpha.name,

            this.stroke,
            this.strokeColor.name,
            this.strokeAlpha.name,
        )
    }

    public pack(): DrawablePolylinePack {
        return new DrawablePolylinePack(
            this.points,
            this.closed,
            this.lineWidth,

            this.fill,
            this.fillColor.name,
            this.fillAlpha.name,

            this.stroke,
            this.strokeColor.name,
            this.strokeAlpha.name,
        )
    }

    public move(offsetX: number, offsetY: number) {
        for (const point of this.points) {
            point.x += offsetX;
            point.y += offsetY;
        }
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        renderer.setFillColor(this.fillString);
        renderer.setStrokeColor(this.strokeString);
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
        return this.fill && DrawablePolyline.testPointPolygon(this.points, canvasX, canvasY);
    }

    public centroid(): Point {
        let area2 = 0;
        let accX = 0;
        let accY = 0;
        for (let i = 0; i < this.points.length; i++) {
            let p1 = this.points[i];
            let p2 = this.points[(i + 1) % this.points.length];
            let c = p1.x * p2.y - p2.x * p1.y;
            area2 += c;
            accX += (p1.x + p2.x) * c;
            accY += (p1.y + p2.y) * c;
        }
        let x = accX / 6 / (area2 / 2);
        let y = accY / 6 / (area2 / 2);
        return new Point(x, y);
    }

    public aabb(): Point[] {
        let minX = Math.min(), maxX = Math.max();
        let minY = Math.min(), maxY = Math.max();
        for (const point of this.points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        return [new Point(minX, minY), new Point(maxX, maxY)];
    }
    public aabbCenter(): Point {
        let aabb = this.aabb();
        let center = new Point((aabb[0].x + aabb[1].x) / 2, (aabb[0].y + aabb[1].y) / 2);
        return center;
    }

    public flipX() {
        let minX = Math.min();
        let maxX = Math.max();
        for (const point of this.points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
        }
        let xx = minX + maxX;
        for (const point of this.points) {
            point.x = xx - point.x;
        }
    }
    public flipY() {
        let minY = Math.min();
        let maxY = Math.max();
        for (const point of this.points) {
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        let yy = minY + maxY;
        for (const point of this.points) {
            point.y = yy - point.y;
        }
    }
    public rotateCW() {
        let center = this.aabbCenter();
        for (const point of this.points) {
            let dx = point.x - center.x;
            let dy = point.y - center.y;
            point.x = center.x - dy;
            point.y = center.y + dx;
        }
    }
    public rotateCCW() {
        let center = this.aabbCenter();
        for (const point of this.points) {
            let dx = point.x - center.x;
            let dy = point.y - center.y;
            point.x = center.x + dy;
            point.y = center.y - dx;
        }
    }

}
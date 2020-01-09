import {Drawable} from "../drawable/Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";
import {Size} from "../util/Size";
import {AlphaEntry, ColorEntry, combineColorAlpha} from "../util/Color";
import {AABB} from "../util/AABB";
import {html, TemplateResult} from "lit-html";
import {Map} from "../data/Map";

export class Point {
    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    public x: number;
    public y: number;
}

class PointSegmentResult {
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

export class DrawablePolylinePicker {
    private polyline: DrawablePolyline;
    private readonly points: Point[];
    public constructor(polyline: DrawablePolyline, points: Point[]) {
        this.polyline = polyline;
        this.points = points;
    }
    private static sqr(dx: number, dy: number) {
        return dx * dx + dy * dy;
    }
    private static testPointSegment(points: Point[], i1: number, i2: number, x: number, y: number): PointSegmentResult {
        let p1 = points[i1];
        let p2 = points[i2];
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dd = DrawablePolylinePicker.sqr(dx, dy);
        if (dd < 0.0001) return null;

        let scalar = ((x - p1.x) * dx + (y - p1.y) * dy) / dd;
        if (scalar > 1) scalar = 1;
        if (scalar < 0) scalar = 0;

        let tx = p1.x + scalar * dx;
        let ty = p1.y + scalar * dy;

        let distance2 = DrawablePolylinePicker.sqr(x - tx, y - ty);
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

    public pickPoint(canvasX: number, canvasY: number, radius: number): number {
        let radius2 = radius * radius;
        let points = this.points;
        for (const point of points) {
            if (DrawablePolylinePicker.sqr(point.x - canvasX, point.y - canvasY) <= radius2) {
                return points.indexOf(point);
            }
        }
        return null;
    }
    public pickLine(canvasX: number, canvasY: number, radius: number): PointSegmentResult {
        let minResult: PointSegmentResult = null;
        let minDistance: number = Number.MAX_VALUE;

        let points = this.points;
        let length = points.length;
        for (let i = 0, j = length - 1; i < length; j = i++) {
            let result = DrawablePolylinePicker.testPointSegment(points, i, j, canvasX, canvasY);
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
        return this.polyline.style.fill && DrawablePolylinePicker.testPointPolygon(this.points, canvasX, canvasY);
    }
}

export class DrawablePolylineEditor {
    private polyline: DrawablePolyline;
    private readonly points: Point[];
    public constructor(polyline: DrawablePolyline, points: Point[]) {
        this.polyline = polyline;
        this.points = points;
    }

    public forEachPoint(func: ((x: number, y: number, index: number) => void)) {
        this.points.forEach((point, index) => {
            func(point.x, point.y, index);
        });
    }

    public pointCount(): number {
        return this.points.length;
    }
    public getPoint(index: number): Point {
        let points = this.points;
        index = (index + points.length) % points.length;
        return points[index];
    }
    public addPoint(x: number, y: number) {
        this.points.push(new Point(x, y));
        this.polyline.invalidate();
    }
    public insertPoint(x: number, y: number, beforeIndex: number = -1) {
        let points = this.points;
        beforeIndex = (beforeIndex + points.length) % points.length;
        points.splice(beforeIndex, 0, new Point(x, y));
        this.polyline.invalidate();
    }
    public removePoint(index: number) {
        let points = this.points;
        index = (index + points.length) % points.length;
        points.splice(index, 1);
        this.polyline.invalidate();
    }
    public setPoint(index: number, x: number, y: number) {
        let points = this.points;
        index = (index + points.length) % points.length;
        let point = points[index];
        point.x = x;
        point.y = y;
        this.polyline.invalidate();
    }
    public move(offsetX: number, offsetY: number) {
        for (const point of this.points) {
            point.x += offsetX;
            point.y += offsetY;
        }
        this.polyline.invalidate();
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
        let center = this.polyline.calculator.aabbCenter();
        for (const point of this.points) {
            let dx = point.x - center.x;
            let dy = point.y - center.y;
            point.x = center.x - dy;
            point.y = center.y + dx;
        }
    }
    public rotateCCW() {
        let center = this.polyline.calculator.aabbCenter();
        for (const point of this.points) {
            let dx = point.x - center.x;
            let dy = point.y - center.y;
            point.x = center.x + dy;
            point.y = center.y - dx;
        }
    }
}

export class DrawablePolylineCalculator {
    private polyline: DrawablePolyline;
    private readonly points: Point[];
    public constructor(polyline: DrawablePolyline, points: Point[]) {
        this.polyline = polyline;
        this.points = points;
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

    public aabb(aabb: AABB = new AABB()): AABB {
        if (!aabb) aabb = new AABB();
        let minX = Math.min(), maxX = Math.max();
        let minY = Math.min(), maxY = Math.max();
        for (const point of this.points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        aabb.set(minX, minY, maxX, maxY);
        return aabb;
    }
    public aabbCenter(): Point {
        let aabb = this.aabb();
        let center = new Point((aabb.x1 + aabb.x2) / 2, (aabb.y1 + aabb.y2) / 2);
        return center;
    }

    public area(): number {
        if (this.points.length < 3) return 0;
        let s = this.points[0].y * (this.points[this.points.length - 1].x - this.points[1].x);
        for (let i = 1; i < this.points.length; i++) {
            s += this.points[i].y * (this.points[i - 1].x - this.points[(i + 1) % this.points.length].x);
        }
        return Math.abs(s * 0.5);
    }
    public length(): number {
        if (this.points.length < 2) return 0;

        let s = 0;
        let p0 = this.points[0];
        let pn = this.points[this.points.length - 1];
        if (this.polyline.style.closed) {
            s = DrawablePolylineCalculator.hypot(p0.x - pn.x, p0.y - pn.y);
        }
        for (let i = 0; i < this.points.length - 1; i++) {
            let pi = this.points[i];
            let pj = this.points[i + 1];
            s += DrawablePolylineCalculator.hypot(pi.x - pj.x, pi.y - pj.y);
        }
        return s;
    }

    private static hypot(x: number, y: number): number {
        return Math.sqrt(x * x + y * y);
    }

    public alignPoint(index: number, radius: number): Point {
        index = (index + this.points.length) % this.points.length;
        let xy = this.points[index];
        let newX = xy.x;
        let newY = xy.y;
        let first = this.points[(index + 1) % this.points.length];
        if (Math.abs(first.x - xy.x) <= radius) newX = first.x;
        if (Math.abs(first.y - xy.y) <= radius) newY = first.y;
        if (this.points.length > 2) {
            let last = this.points[(index - 1 + this.points.length) % this.points.length];
            if (Math.abs(last.x - xy.x) <= radius) newX = last.x;
            if (Math.abs(last.y - xy.y) <= radius) newY = last.y;
        }
        return new Point(newX, newY);
    }
}

export class DrawablePolylineStyle {
    public constructor(pack: DrawablePolylinePack) {
        this._closed = pack.closed;
        this._lineWidth = pack.lineWidth;

        this._fill = pack.fill;
        this._fillColor = ColorEntry.findByName(pack.fillColorName);
        this._fillAlpha = AlphaEntry.findByName(pack.fillAlphaName);
        this._fillString = combineColorAlpha(this._fillColor, this._fillAlpha);

        this._stroke = pack.stroke;
        this._strokeColor = ColorEntry.findByName(pack.strokeColorName);
        this._strokeAlpha = AlphaEntry.findByName(pack.strokeAlphaName);
        this._strokeString = combineColorAlpha(this._strokeColor, this._strokeAlpha);
    }
    protected _closed: boolean;
    protected _lineWidth: Size;

    protected _fill: boolean;
    protected _fillColor: ColorEntry;
    protected _fillAlpha: AlphaEntry;
    protected _fillString: string;

    protected _stroke: boolean;
    protected _strokeColor: ColorEntry;
    protected _strokeAlpha: AlphaEntry;
    protected _strokeString: string;

    get closed(): boolean {
        return this._closed;
    }
    get lineWidth(): Size {
        return this._lineWidth;
    }

    get fill(): boolean {
        return this._fill;
    }
    get fillColor(): ColorEntry {
        return this._fillColor;
    }
    get fillAlpha(): AlphaEntry {
        return this._fillAlpha;
    }
    get fillString(): string {
        return this._fillString;
    }

    get stroke(): boolean {
        return this._stroke;
    }
    get strokeColor(): ColorEntry {
        return this._strokeColor;
    }
    get strokeAlpha(): AlphaEntry {
        return this._strokeAlpha;
    }
    get strokeString(): string {
        return this._strokeString;
    }

    get onScreen(): number {
        return this._lineWidth.onScreen;
    }
    get onCanvas(): number {
        return this._lineWidth.onCanvas;
    }

    public pack(): DrawablePolylinePack {
        return new DrawablePolylinePack(
            null,
            this._closed,
            this._lineWidth.clone(),

            this._fill,
            this._fillColor.name,
            this._fillAlpha.name,

            this._stroke,
            this._strokeColor.name,
            this._strokeAlpha.name,
        )
    }

    set closed(value: boolean) {
        this._closed = value;
    }
    set fill(value: boolean) {
        this._fill = value;
    }
    set stroke(value: boolean) {
        this._stroke = value;
    }

    set onScreen(onScreen: number) {
        this._lineWidth.onScreen = onScreen;
    }
    set onCanvas(onCanvas: number) {
        this._lineWidth.onCanvas = onCanvas;
    }

    public setFillColor(fillColor: ColorEntry, fillAlpha: AlphaEntry) {
        this._fillColor = fillColor;
        this._fillAlpha = fillAlpha;
        this._fillString = combineColorAlpha(this._fillColor, this._fillAlpha);
    }
    public setStrokeColor(strokeColor: ColorEntry, strokeAlpha: AlphaEntry) {
        this._strokeColor = strokeColor;
        this._strokeAlpha = strokeAlpha;
        this._strokeString = combineColorAlpha(this._strokeColor, this._strokeAlpha);
    }
}

export class DrawablePolylineEditUi {
    private readonly polyline: DrawablePolyline;
    constructor(polyline: DrawablePolyline) {
        this.polyline = polyline;
    }

    render(canvas: Canvas, map: Map): TemplateResult {
        return html`<polylineedit-element .polyline=${this.polyline} .canvas=${canvas} .map=${map}></polylineedit-element>`;
    }
}

export class DrawablePolyline extends Drawable {
    private readonly points: Point[];

    public constructor(pack: DrawablePolylinePack) {
        super();
        this.points = pack.points;
        this.style = new DrawablePolylineStyle(pack);
        this.picker = new DrawablePolylinePicker(this, this.points);
        this.editor = new DrawablePolylineEditor(this, this.points);
        this.calculator = new DrawablePolylineCalculator(this, this.points);

        this.ui = new DrawablePolylineEditUi(this);
    }

    public readonly style: DrawablePolylineStyle;
    public readonly picker: DrawablePolylinePicker;
    public readonly editor: DrawablePolylineEditor;
    public readonly calculator: DrawablePolylineCalculator;

    public readonly ui: DrawablePolylineEditUi;

    public clone(offsetX: number = 0, offsetY: number = 0): DrawablePolylinePack {
        let points = [];
        for (const point of this.points) {
            points.push(new Point(point.x + offsetX, point.y + offsetY));
        }
        let pack = this.style.pack();
        pack.points = points;
        return pack;
    }
    public pack() : DrawablePolylinePack {
        let pack = this.style.pack();
        pack.points = this.points;
        return pack;
    }

    public invalidate() {
        this.valid = false;
    }
    private canvasAABB: AABB = new AABB();
    private valid: boolean = false;
    private validate() {
        if (!this.valid) {
            this.calculator.aabb(this.canvasAABB);
        }
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        this.validate();
        let inScreen = camera.canvasAABBInScreen(this.canvasAABB);
        if (inScreen) {
            renderer.setFillColor(this.style.fillString);
            renderer.setStrokeColor(this.style.strokeString);
            renderer.renderPolyline(camera, this.points, this.style.closed, this.style.fill, this.style.stroke, this.style.lineWidth);
        }
    }

}

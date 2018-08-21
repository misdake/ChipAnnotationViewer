import {Drawable} from "./Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";

export class DrawablePolyline extends Drawable {

    public closed: boolean;
    public fill: boolean;
    public lineWidth: number;

    private readonly points: number[][];

    public constructor(points: number[][], closed: boolean, fill: boolean, lineWidth: number) {
        super();
        this.points = points;
        this.closed = closed;
        this.fill = fill;
        this.lineWidth = lineWidth;
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera) {
        super.render(canvas, renderer, camera);
        renderer.renderPolyline(camera, this.points, this.closed, this.fill, this.lineWidth);
    }

}
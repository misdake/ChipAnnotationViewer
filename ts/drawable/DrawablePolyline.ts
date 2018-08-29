import {Drawable} from "./Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";
import {LineWidth} from "../util/LineWidth";

export class DrawablePolyline extends Drawable {

    public closed: boolean;
    public fill: boolean;
    public stroke: boolean;
    public lineWidth?: LineWidth;

    private readonly points: number[][];

    public constructor(points: number[][], closed: boolean, fill: boolean, lineWidth?: LineWidth) {
        super();
        this.points = points;
        this.closed = closed;
        this.fill = fill;
        this.stroke = true; //TODO add to parameter
        this.lineWidth = lineWidth;
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera) {
        super.render(canvas, renderer, camera);
        renderer.renderPolyline(camera, this.points, this.closed, this.fill, this.stroke, this.lineWidth);
    }

}
import {Layer} from "../Layer";
import {Camera} from "../Camera";
import {Canvas} from "../Canvas";
import {Content} from "../Content";
import {Renderer} from "../Renderer";
import {DrawableImage} from "../drawable/DrawableImage";
import {DrawablePolyline} from "../drawable/DrawablePolyline";
import {LineWidth} from "../util/LineWidth";

export class LayerPolyline extends Layer {
    private content: Content;

    private polylines: DrawablePolyline[] = [];

    public constructor() {
        super("polyline");
    }

    private prepareRect(x1: number, y1: number, x2: number, y2: number): number[][] {
        return [
            [x1, y1],
            [x2, y1],
            [x2, y2],
            [x1, y2]
        ];
    }

    public load(canvas: Canvas, content: Content, folder: string): void {
        super.load(canvas, content, folder);
        this.content = content;

        let polyline1 = new DrawablePolyline(this.prepareRect(100, 100, 900, 900), true, false, new LineWidth(0, 10));
        polyline1.color = "#ff0000";
        this.polylines.push(polyline1);

        let polyline2 = new DrawablePolyline(this.prepareRect(100, 1100, 900, 1900), true, false, new LineWidth(5, 0));
        polyline2.color = "#00ff00";
        this.polylines.push(polyline2);

        let polyline3 = new DrawablePolyline(this.prepareRect(1100, 100, 1900, 900), true, true);
        polyline3.color = "#0000ff";
        this.polylines.push(polyline3);

        let polyline4 = new DrawablePolyline(this.prepareRect(1100, 1100, 1900, 1900), true, false, new LineWidth(0, 0, 0.002));
        polyline4.color = "#ffff00";
        this.polylines.push(polyline4);
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        super.render(canvas, renderer, camera);
        this.polylines.forEach(polyline => {
            polyline.render(canvas, renderer, camera);
        })
    }

    public unload(): void {
        super.unload();
    }
}
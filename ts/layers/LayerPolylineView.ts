import {Layer} from "../Layer";
import {Canvas} from "../Canvas";
import {Content} from "../Content";
import {Renderer} from "../Renderer";
import {DrawablePolyline} from "../drawable/DrawablePolyline";
import {LineWidth} from "../util/LineWidth";

export class LayerPolylineView extends Layer {

    private content: Content;
    private polylines: DrawablePolyline[] = [];

    public constructor(canvas: Canvas) {
        super("polyline_view", canvas);
    }

    private static prepareRect(x1: number, y1: number, x2: number, y2: number): number[][] {
        return [
            [x1, y1],
            [x2, y1],
            [x2, y2],
            [x1, y2]
        ];
    }

    public load(content: Content, folder: string): void {
        super.load(content, folder);
        this.content = content;

        let polyline1 = new DrawablePolyline(LayerPolylineView.prepareRect(100, 100, 900, 900), true, false, new LineWidth(0, 10));
        polyline1.fillColor = polyline1.strokeColor = "#ff0000";
        this.polylines.push(polyline1);

        let polyline2 = new DrawablePolyline(LayerPolylineView.prepareRect(100, 1100, 900, 1900), true, false, new LineWidth(5, 0));
        polyline2.fillColor = polyline2.strokeColor = "#00ff00";
        this.polylines.push(polyline2);

        let polyline3 = new DrawablePolyline(LayerPolylineView.prepareRect(1100, 100, 1900, 900), true, true);
        polyline3.fillColor = polyline3.strokeColor = "#0000ff";
        this.polylines.push(polyline3);

        let polyline4 = new DrawablePolyline(LayerPolylineView.prepareRect(1100, 1100, 1900, 1900), true, false, new LineWidth(0, 0, 0.002));
        polyline4.fillColor = polyline4.strokeColor = "#ffff00";
        this.polylines.push(polyline4);

        //TODO listen to mouse click to select polyline
    }

    public render(renderer: Renderer): void {
        super.render(renderer);
        this.polylines.forEach(polyline => {
            polyline.render(this.canvas, renderer, this.camera);
        })
    }

    public unload(): void {
        super.unload();
    }

}
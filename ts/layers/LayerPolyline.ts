import {Layer} from "../Layer";
import {Camera} from "../Camera";
import {Canvas} from "../Canvas";
import {Content} from "../Content";
import {Renderer} from "../Renderer";
import {DrawableImage} from "../drawable/DrawableImage";
import {DrawablePolyline} from "../drawable/DrawablePolyline";

export class LayerPolyline extends Layer {
    private content: Content;

    private polylines: DrawablePolyline[] = [];

    public constructor() {
        super("polyline");
    }

    public load(canvas: Canvas, content: Content, folder: string): void {
        super.load(canvas, content, folder);
        this.content = content;

        let polyline1 = new DrawablePolyline([[0, 1000], [1000, 1000], [1000, 0], [0, 0]], true, false, 5);
        polyline1.color = "#ff0000";
        this.polylines.push(polyline1);

        let polyline2 = new DrawablePolyline([[1000, 1000], [2000, 1000], [2000, 0], [1000, 0]], true, true, 0);
        polyline2.color = "#0000ff";
        this.polylines.push(polyline2);
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
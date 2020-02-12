import {Layer} from "./Layer";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {DrawablePolyline} from "../editable/DrawablePolyline";
import {Data} from "../data/Data";
import {LayerName} from "./Layers";
import {Env} from "../Env";

export class LayerPolylineView extends Layer {

    private polylines: DrawablePolyline[] = [];

    public constructor(canvas: Canvas) {
        super(LayerName.POLYLINE_VIEW, canvas);
    }

    loadMap(env: Env): void {
    }

    loadData(env: Env): void {
        this.polylines = env.polylines;
    }

    public addPolyline(polyline: DrawablePolyline) {
        this.polylines.push(polyline);
        this.canvas.requestRender();
    }
    public deletePolyline(polyline: DrawablePolyline): boolean {
        let index = this.polylines.indexOf(polyline);
        if (index !== -1) {
            this.polylines.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }
    public containPolyline(polyline: DrawablePolyline): boolean {
        return this.polylines.indexOf(polyline) >= 0;
    }

    public saveData(data: Data): void {
        data.polylines = [];
        for (const polyline of this.polylines) {
            data.polylines.push(polyline.pack());
        }
    }

    public render(renderer: Renderer): void {
        for (const polyline of this.polylines) {
            polyline.render(this.canvas, renderer, this.camera);
        }
    }

    public unload(): void {
    }

}

import {Layer} from "../Layer";
import {Canvas} from "../Canvas";
import {Content} from "../Content";
import {Renderer} from "../Renderer";
import {DrawablePolyline, Point} from "../drawable/DrawablePolyline";
import {LineWidth} from "../util/LineWidth";
import {MouseListener} from "../MouseListener";
import {LayerPolylineEdit} from "./LayerPolylineEdit";

export class LayerPolylineView extends Layer {

    private content: Content;
    private polylines: DrawablePolyline[] = [];
    private layerPolylineEdit: LayerPolylineEdit;

    public constructor(canvas: Canvas) {
        super("polyline_view", canvas);
    }

    public setLayer(layerPolylineEdit: LayerPolylineEdit) {
        this.layerPolylineEdit = layerPolylineEdit;
    }

    private static prepareRect(x1: number, y1: number, x2: number, y2: number): Point[] {
        return [
            new Point(x1, y1),
            new Point(x2, y1),
            new Point(x2, y2),
            new Point(x1, y2)
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

        //listen to mouse click to select polyline
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private moved = false;
            onmousedown(event: MouseEvent): boolean {
                this.moved = false;
                return false;
            }
            onmouseup(event: MouseEvent): boolean {
                if (event.button == 0 && !this.moved) {
                    let radius = self.camera.screenSizeToCanvas(5);
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;
                    for (let polyline of self.polylines) {
                        let pickPoint = polyline.pickPoint(x, y, radius);
                        let pickLine = polyline.pickLine(x, y, radius);
                        let pickShape = polyline.pickShape(x, y);
                        if (pickPoint) console.log("pickPoint: " + JSON.stringify(pickPoint));
                        if (pickLine) console.log("pickLine: " + JSON.stringify(pickLine));
                        if (pickShape) console.log("pickShape: " + JSON.stringify(pickShape));
                        if (pickPoint || pickLine || pickShape) {
                            self.layerPolylineEdit.startEditingPolyline(polyline);
                            return true;
                        }
                    }
                    self.layerPolylineEdit.finishEditing();
                    return false;
                } else {
                    return false;
                }
            }
            onmousemove(event: MouseEvent): boolean {
                this.moved = true;
                return false;
            }
        };
    }

    public addPolyline(polyline:DrawablePolyline) {
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
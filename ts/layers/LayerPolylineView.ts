import {Layer} from "../Layer";
import {Canvas} from "../Canvas";
import {Map} from "../data/Map";
import {Renderer} from "../Renderer";
import {DrawablePolyline, Point} from "../drawable/DrawablePolyline";
import {MouseListener} from "../MouseListener";
import {LayerPolylineEdit} from "./LayerPolylineEdit";
import {DrawableText} from "../drawable/DrawableText";
import {Data} from "../data/Data";

export class LayerPolylineView extends Layer {

    private map: Map;
    private polylines: DrawablePolyline[] = [];
    private layerPolylineEdit: LayerPolylineEdit;

    private texts: DrawableText[] = [];

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

    public load(map: Map, data: Data, folder: string): void {
        this.map = map;

        if (data.polylines) {
            for (let pack of data.polylines) {
                this.polylines.push(new DrawablePolyline(pack))
            }
        }
        if (data.texts) {
            for (let pack of data.texts) {
                this.texts.push(new DrawableText(pack))
            }
        }
        // let polyline1 = new DrawablePolyline(LayerPolylineView.prepareRect(100, 100, 900, 900), true, false, new Size(0, 10));
        // polyline1.fillColor = "#00ff00";
        // polyline1.strokeColor = "#ff0000";
        // this.polylines.push(polyline1);
        //
        // let polyline2 = new DrawablePolyline(LayerPolylineView.prepareRect(1100, 100, 1900, 900), true, true, new Size(5, 0));
        // polyline2.fillColor = "#0000ff";
        // polyline2.strokeColor = "#00ff00";
        // this.polylines.push(polyline2);
        //
        // let polyline3 = new DrawablePolyline(LayerPolylineView.prepareRect(2100, 100, 2900, 900), false, false, new Size(0, 0, 0.004));
        // polyline3.fillColor = "#ff0000";
        // polyline3.strokeColor = "#0000ff";
        // this.polylines.push(polyline3);
        //
        // this.texts.push(new DrawableText("a", "#ff0000", AnchorX.MIDDLE, AnchorY.MIDDLE, new Size(0, 100), 500, 500));
        // this.texts.push(new DrawableText("b", "#00ff00", AnchorX.MIDDLE, AnchorY.MIDDLE, new Size(50, 0), 1500, 500));
        // this.texts.push(new DrawableText("c", "#0000ff", AnchorX.MIDDLE, AnchorY.MIDDLE, new Size(0, 0, 0.04), 2500, 500));

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
                if ((event.buttons & 1) && (event.movementX != 0 && event.movementY != 0)) {
                    this.moved = true;
                }
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

    public save(data: Data): void {
        data.polylines = this.polylines;
        data.texts = this.texts;
    }

    public render(renderer: Renderer): void {
        super.render(renderer);
        for (const polyline of this.polylines) {
            polyline.render(this.canvas, renderer, this.camera);
        }
        for (const text of this.texts) {
            text.render(this.canvas, renderer, this.camera);
        }
    }

    public unload(): void {
        super.unload();
    }
}
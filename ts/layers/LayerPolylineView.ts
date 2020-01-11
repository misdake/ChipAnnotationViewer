import {Layer} from "./Layer";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {DrawablePolyline} from "../editable/DrawablePolyline";
import {MouseIn, MouseListener} from "../MouseListener";
import {Data} from "../data/Data";
import {Selection} from "./Selection";
import {LayerName} from "./Layers";

export class LayerPolylineView extends Layer {

    private polylines: DrawablePolyline[] = [];

    public constructor(canvas: Canvas) {
        super(LayerName.POLYLINE_VIEW, canvas);
    }

    public loadData(data: Data): void {
        this.polylines = [];

        if (data.polylines) {
            for (let pack of data.polylines) {
                this.polylines.push(new DrawablePolyline(pack))
            }
        }

        //listen to mouse click to select polyline
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private moved = false;
            onmousedown(event: MouseIn): boolean {
                this.moved = false;
                return false;
            }
            onmouseup(event: MouseIn): boolean {
                if (event.button == 0 && !this.moved) {
                    let radius = self.camera.screenSizeToCanvas(5);
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;
                    let selected: DrawablePolyline = null;
                    for (let polyline of self.polylines) {
                        let pickPointIndex = polyline.picker.pickPoint(x, y, radius);
                        let pickLine = polyline.picker.pickLine(x, y, radius);
                        let pickShape = polyline.picker.pickShape(x, y);
                        if (pickPointIndex != null || pickLine || pickShape) {
                            selected = polyline;
                        }
                    }
                    if (selected) {
                        Selection.select(LayerName.POLYLINE_EDIT, selected);
                        return true;
                    }
                    Selection.deselect(LayerName.POLYLINE_CREATE);
                    Selection.deselect(LayerName.POLYLINE_EDIT);
                    return false;
                } else {
                    return false;
                }
            }
            onmousemove(event: MouseIn): boolean {
                if ((event.buttons & 1) && (event.movementX != 0 && event.movementY != 0)) {
                    this.moved = true;
                }
                return false;
            }
        };
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
        super.render(renderer);
        for (const polyline of this.polylines) {
            polyline.render(this.canvas, renderer, this.camera);
        }
    }

    public unload(): void {
        super.unload();
    }

}

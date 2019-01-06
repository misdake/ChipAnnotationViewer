import {Layer} from "../Layer";
import {Canvas} from "../Canvas";
import {Map} from "../data/Map";
import {Renderer} from "../Renderer";
import {DrawablePolyline} from "../drawable/DrawablePolyline";
import {MouseListener} from "../MouseListener";
import {Data} from "../data/Data";
import {Selection} from "./Selection";

export class LayerPolylineView extends Layer {
    public static readonly layerName = "polyline view";

    private map: Map;
    private polylines: DrawablePolyline[] = [];

    public constructor(canvas: Canvas) {
        super(LayerPolylineView.layerName, canvas);
    }

    public load(map: Map, data: Data, folder: string): void {
        this.map = map;

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
                            Selection.select(DrawablePolyline.typeName, polyline);
                            return true;
                        }
                    }
                    Selection.deselect(DrawablePolyline.typeName);
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

    public save(data: Data): void {
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
import {Layer} from "../Layer";
import {Map} from "../data/Map";
import {DrawablePolyline, DrawablePolylinePack, Point} from "../drawable/DrawablePolyline";
import {Canvas} from "../Canvas";
import {Size} from "../util/Size";
import {MouseListener} from "../MouseListener";
import {Renderer} from "../Renderer";
import {Position} from "../util/Transform";
import {LayerPolylineView} from "./LayerPolylineView";
import {Ui} from "../util/Ui";
import {Data} from "../data/Data";
import {combineColorAlpha} from "../util/Color";
import {Selection} from "./Selection";
import {Drawable} from "../drawable/Drawable";

export class LayerPolylineEdit extends Layer {
    public static readonly layerName = "polyline edit";

    private map: Map;
    private polylineNew: DrawablePolyline = null;
    private polylineEdit: DrawablePolyline = null;
    private layerView: LayerPolylineView;

    public constructor(canvas: Canvas) {
        super(LayerPolylineEdit.layerName, canvas);
        let self = this;
        Selection.register(DrawablePolyline.typeName, (item: Drawable) => {
            this.startEditingPolyline(item as DrawablePolyline);
        }, () => {
            self.finishEditing();
        });
    }

    public load(map: Map, data: Data, folder: string): void {
        this.layerView = this.canvas.findLayer(LayerPolylineView.layerName) as LayerPolylineView;
        this.map = map;
        Ui.setVisibility("panelPolylineSelected", false);
    }

    public startCreatingPolyline(): DrawablePolyline {
        this.finishEditing();
        let self = this;

        let points: Point[] = [];
        this.polylineNew = new DrawablePolyline(new DrawablePolylinePack(
            points, true, new Size(2),
            true, "white", "25",
            true, "white", "75",
        ));
        this.bindPolylineConfigUi(this.polylineNew);

        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;

            private preview(position: Position): void {
                let xy = points[points.length - 1];
                xy.x = position.x;
                xy.y = position.y;
            }
            onmousedown(event: MouseEvent): boolean {
                if (event.button == 0 && !this.down) { //left button down => add point
                    this.down = true;
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    points.push(new Point(position.x, position.y));
                    self.canvas.requestRender();
                    return true;
                } else {
                    return false;
                }
            }
            onmouseup(event: MouseEvent): boolean {
                if (event.button == 0) { //left button up => update last point
                    this.down = false;
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    this.preview(position);
                    self.canvas.requestRender();
                    return true;
                } else {
                    return false;
                }
            }
            onmousemove(event: MouseEvent): boolean {
                if (this.down) { //left button is down => show modification
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    this.preview(position);
                    self.canvas.requestRender();
                    return true;
                } else {
                    return false;
                }
            }
        };

        return this.polylineNew;
    }

    public startEditingPolyline(polyline: DrawablePolyline): void {
        this.finishEditing();

        //show polyline and its point indicators
        this.polylineEdit = polyline;
        this.bindPolylineConfigUi(this.polylineEdit);

        //start listening to mouse events: drag point, remove point on double click, add point on double click
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;
            private dragPoint: Point = null;

            onmousedown(event: MouseEvent): boolean {
                this.dragPoint = null;

                if (event.button == 0) { //left button down => test drag point
                    this.down = true;

                    //test point
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let point = polyline.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (point) { //start dragging this point
                        this.dragPoint = point;
                        return true;
                    }
                }
                return false;
            }
            onmouseup(event: MouseEvent): boolean {
                let passEvent: boolean = !this.dragPoint; //pass event if not moving point, so that LayerPolylineView will deselect this polyline
                this.dragPoint = null;

                if (event.button == 0) { //left button up => nothing
                    this.down = false;
                    return !passEvent;
                }
                return false;
            }
            ondblclick(event: MouseEvent): boolean { //double click => remove point on selection or add point on segment
                if (event.button == 0) {
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);

                    //test points
                    let point = polyline.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (point) { //delete point
                        if (polyline.points.length > 3) { //so it will be at least a triangle
                            let index = polyline.points.indexOf(point);
                            if (index !== -1) polyline.points.splice(index, 1);
                            self.canvas.requestRender();
                        }
                        return true;
                    }

                    //test segments
                    let segment = polyline.pickLine(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (segment) { //add point
                        let newIndex = segment.p1Index; //insert point after p1
                        polyline.points.splice(newIndex, 0, segment.position);
                        self.canvas.requestRender();
                        return true;
                    }
                }

                return false;
            }
            onmousemove(event: MouseEvent): boolean {
                if (this.down) { //left button is down => drag point
                    if (this.dragPoint) {
                        let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        this.dragPoint.x = position.x;
                        this.dragPoint.y = position.y;
                        self.canvas.requestRender();
                        return true;
                    }
                }
                return false;
            }
        };

        this.canvas.requestRender();
    }

    public finishEditing(): void {
        Ui.setVisibility("panelPolylineSelected", false);

        if (this.polylineNew) {
            if (this.polylineNew.points.length > 2) {
                this.layerView.addPolyline(this.polylineNew);
            }
            this.polylineNew = null;
            this.canvas.requestRender();
        }
        if (this.polylineEdit) {
            this.polylineEdit = null;
            this.canvas.requestRender();
        }
        this._mouseListener = null;
    }

    public render(renderer: Renderer): void {
        if (this.polylineNew) {
            this.polylineNew.render(this.canvas, renderer, this.camera);
            //draw two points
            let pointCount = this.polylineNew.points.length;
            if (pointCount > 0) this.drawPointCircle(this.polylineNew.points[0], renderer);
            if (pointCount > 1) this.drawPointCircle(this.polylineNew.points[pointCount - 1], renderer);
        }
        if (this.polylineEdit) {
            //draw all points
            for (const point of this.polylineEdit.points) {
                this.drawPointCircle(point, renderer);
            }
        }
    }

    private drawPointCircle(point: Point, renderer: Renderer) {
        let position = this.camera.canvasToScreen(point.x, point.y);
        renderer.setColor("rgba(255,255,255,1)");
        renderer.drawCircle(position.x, position.y, 5, false, true, 1);
        renderer.setColor("rgba(0,0,0,0.5)");
        renderer.drawCircle(position.x, position.y, 4, true, false);
    }

    public deleteEditing() {
        if(this.polylineEdit) {
            this.layerView.deletePolyline(this.polylineEdit);
            this.finishEditing();
        }
    }

    private bindPolylineConfigUi(polyline: DrawablePolyline) {
        Ui.setVisibility("panelPolylineSelected", true);

        Ui.bindCheckbox("polylineCheckboxFill", polyline.fill, newValue => {
            polyline.fill = newValue;
            this.canvas.requestRender();
        });
        Ui.bindCheckbox("polylineCheckboxStroke", polyline.stroke, newValue => {
            polyline.stroke = newValue;
            this.canvas.requestRender();
        });
        Ui.bindCheckbox("polylineCheckboxClosed", polyline.closed, newValue => {
            polyline.closed = newValue;
            this.canvas.requestRender();
        });

        Ui.bindNumber("polylineTextSizeOnScreen", polyline.lineWidth.onScreen, newValue => {
            polyline.lineWidth.onScreen = newValue;
            this.canvas.requestRender();
        });
        Ui.bindNumber("polylineTextSizeOnCanvas", polyline.lineWidth.onCanvas, newValue => {
            polyline.lineWidth.onCanvas = newValue;
            this.canvas.requestRender();
        });
        Ui.bindNumber("polylineTextSizeOfScreen", polyline.lineWidth.ofScreen * 1000, newValue => {
            polyline.lineWidth.ofScreen = newValue * 0.001;
            this.canvas.requestRender();
        });

        Ui.bindColor("polylineContainerStrokeColor", "polylineContainerStrokeAlpha", polyline.strokeColor, polyline.strokeAlpha, (newColor, newAlpha) => {
            polyline.strokeColor = newColor;
            polyline.strokeAlpha = newAlpha;
            polyline.strokeString = combineColorAlpha(polyline.strokeColor, polyline.strokeAlpha);
            this.canvas.requestRender();
        });
        Ui.bindColor("polylineContainerFillColor", "polylineContainerFillAlpha", polyline.fillColor, polyline.fillAlpha, (newColor, newAlpha) => {
            polyline.fillColor = newColor;
            polyline.fillAlpha = newAlpha;
            polyline.fillString = combineColorAlpha(polyline.fillColor, polyline.fillAlpha);
            this.canvas.requestRender();
        });
    }
}
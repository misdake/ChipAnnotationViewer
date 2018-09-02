import {Layer} from "../Layer";
import {Content} from "../Content";
import {DrawablePolyline, Point} from "../drawable/DrawablePolyline";
import {Canvas} from "../Canvas";
import {LineWidth} from "../util/LineWidth";
import {MouseListener} from "../MouseListener";
import {Renderer} from "../Renderer";
import {Position} from "../util/Transform";
import {LayerPolylineView} from "./LayerPolylineView";

export class LayerPolylineEdit extends Layer {

    private content: Content;
    private polylineNew: DrawablePolyline = null;
    private polylineEdit: DrawablePolyline = null;
    private layerPolylineView: LayerPolylineView;

    public constructor(canvas: Canvas) {
        super("polyline_edit", canvas);
    }

    public setLayer(layerPolylineView: LayerPolylineView) {
        this.layerPolylineView = layerPolylineView;
    }

    public load(content: Content, folder: string): void {
        this.content = content;
    }

    public startCreatingPolyline(): DrawablePolyline {
        this.finishEditing();

        let points: Point[] = [];
        this.polylineNew = new DrawablePolyline(points, true, true, new LineWidth(2));
        this.polylineNew.strokeColor = "rgba(255,255,255,0.5)";
        this.polylineNew.fillColor = "rgba(255,255,255,0.2)";

        let self = this;
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

        //TODO enable checkboxes for polyline flags (switch ui to polyline-editing mode)

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

                    //test point
                    let point = polyline.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (point) { //delete point
                        if (polyline.points.length > 3) { //so it is at least a triangle
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
        if (this.polylineNew) {
            if (this.polylineNew.points.length > 2) {
                this.layerPolylineView.addPolyline(this.polylineNew);
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
            this.layerPolylineView.deletePolyline(this.polylineEdit);
            this.finishEditing();
        }
    }
}
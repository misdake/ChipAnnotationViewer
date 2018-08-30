import {Layer} from "../Layer";
import {Content} from "../Content";
import {DrawablePolyline} from "../drawable/DrawablePolyline";
import {Canvas} from "../Canvas";
import {LineWidth} from "../util/LineWidth";
import {MouseListener} from "../MouseListener";
import {Renderer} from "../Renderer";
import {Position} from "../util/Transform";

export class LayerPolylineEdit extends Layer {

    private content: Content;
    private polylineNew: DrawablePolyline = null;
    private polylines: DrawablePolyline[] = [];

    public constructor(canvas: Canvas) {
        super("polyline_edit", canvas);
    }

    public load(content: Content, folder: string): void {
        this.content = content;
    }

    public startCreatingPolyline(): DrawablePolyline {
        if (this.polylineNew) this.finishEditing();

        let points: number[][] = [];
        this.polylineNew = new DrawablePolyline(points, true, true, new LineWidth(2));
        this.polylineNew.strokeColor = "rgba(255,255,255,0.5)";
        this.polylineNew.fillColor = "rgba(255,255,255,0.2)";

        //start listening to mouse move events and show default polyline starting from mouse position.
        //after clicking, add such polyline to collection
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;

            private preview(position: Position): void {
                let xy = points[points.length - 1];
                xy[0] = position.x;
                xy[1] = position.y;
            }
            onmousedown(event: MouseEvent): boolean {
                if (event.button == 0) { //left button down => add point
                    this.down = true;
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    points.push([position.x, position.y]);
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
                if (this.down) { //left button is down => preview
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
        //TODO startEditingPolyline
        //enable checkboxes for polyline flags (switch ui to polyline-editing mode)
        //show polyline and its point indicators
        //start listening to mouse events: drag points, create point, delete point, drag shape
    }

    public finishEditing(): void {
        if (this.polylineNew) {
            if (this.polylineNew.points.length > 2) {
                this.polylines.push(this.polylineNew); //TODO move it to LayerPolylineView
            }
            this.polylineNew = null;
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
        for (const polyline of this.polylines) {
            polyline.render(this.canvas, renderer, this.camera);
        }
    }
    private drawPointCircle(point: number[], renderer: Renderer) {
        let position = this.camera.canvasToScreen(point[0], point[1]);
        renderer.setColor("rgba(255,255,255,1)");
        renderer.drawCircle(position.x, position.y, 5, false, true, 1);
        renderer.setColor("rgba(0,0,0,0.5)");
        renderer.drawCircle(position.x, position.y, 4, true, false);
    }
}
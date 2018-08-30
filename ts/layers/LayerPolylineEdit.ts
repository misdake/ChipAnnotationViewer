import {Layer} from "../Layer";
import {Content} from "../Content";
import {DrawablePolyline} from "../drawable/DrawablePolyline";
import {Canvas} from "../Canvas";
import {LineWidth} from "../util/LineWidth";
import {MouseListener} from "../MouseListener";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";
import {Position} from "../util/Transform";

export class LayerPolylineEdit extends Layer {

    private content: Content;
    private polylines: DrawablePolyline[] = [];

    public constructor(canvas: Canvas) {
        super("polyline_edit", canvas);
    }

    public load(canvas: Canvas, content: Content, folder: string): void {
        super.load(canvas, content, folder);
        this.content = content;
    }

    public startCreatingPolyline(): DrawablePolyline {
        let points: number[][] = [];
        let polyline = new DrawablePolyline(points, true, true, new LineWidth(2));
        polyline.color = "rgba(200,200,200,0.4)";
        this.polylines.push(polyline);

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

        return polyline;
    }

    public startEditingPolyline(polyline: DrawablePolyline): void {
        //TODO startEditingPolyline
        //enable checkboxes for polyline flags (switch ui to polyline-editing mode)
        //show polyline and its point indicators
        //start listening to mouse events: drag points, create point, delete point, drag shape
    }

    public finishEditing(): void {
        this._mouseListener = null;
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        super.render(canvas, renderer, camera);
        this.polylines.forEach(polyline => {
            polyline.render(canvas, renderer, camera);
        })
    }

}
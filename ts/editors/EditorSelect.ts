import {Editor} from "./Editor";
import {Renderer} from "../Renderer";
import {MouseIn, MouseListener} from "../MouseListener";
import {EditorName} from "./Editors";
import {Canvas} from "../Canvas";
import {DrawablePolyline} from "../editable/DrawablePolyline";
import {Selection, SelectType} from "../layers/Selection";
import {Env} from "../Env";

export class EditorSelect extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.SELECT, canvas);
    }

    enter(env: Env): void {
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
                    for (let polyline of env.polylines) {
                        let pickPointIndex = polyline.picker.pickPoint(x, y, radius);
                        let pickLine = polyline.picker.pickLine(x, y, radius);
                        let pickShape = polyline.picker.pickShape(x, y);
                        if (pickPointIndex != null || pickLine || pickShape) {
                            selected = polyline;
                        }
                    }
                    if (selected) {
                        Selection.select(SelectType.POLYLINE, selected);
                        return true;
                    }
                    Selection.deselectAny();
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

    exit(): void {
        this._mouseListener = null;
    }

    render(renderer: Renderer): void {
    }

}
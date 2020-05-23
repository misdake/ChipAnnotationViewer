import {Editor, Usage, UsageType} from "./Editor";
import {MouseIn, MouseListener} from "../MouseListener";
import {EditorName} from "./Editors";
import {Canvas} from "../Canvas";
import {Env} from "../Env";
import {DrawablePolyline} from "../editable/DrawablePolyline";
import {Selection, SelectType} from "../layers/Selection";
import {Ui} from "../util/Ui";
import {LayerName} from "../layers/Layers";
import {LayerPolylineView} from "../layers/LayerPolylineView";

export class EditorPolylineEdit extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.POLYLINE_EDIT, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("hold left button to drag points", UsageType.MOUSE),
            Editor.usage("hold ctrl to help with horizontal/vertical line", UsageType.MOUSE),
            Editor.usage("hold alt to drag polyline", UsageType.MOUSE),
            Editor.usage("hold ctrl+alt to copy and drag polyline", UsageType.MOUSE),
            Editor.usage("double click on line to create point", UsageType.MOUSE),
            Editor.usage("right-click / double left-click point to delete it", UsageType.MOUSE),
            Editor.usage("WSAD ↑↓←→ to move, hold shift to speed up", UsageType.KEYBOARD),
            Editor.usage("press del to delete", UsageType.KEYBOARD),
        ];
    }

    private static readonly MAG_RADIUS = 10;

    enter(env: Env): void {
        let layerView = <LayerPolylineView>env.canvas.findLayer(LayerName.POLYLINE_VIEW);

        let {item: item, type: type} = Selection.getSelected();
        if (type !== SelectType.POLYLINE) return;
        let polyline = <DrawablePolyline>item;

        //start listening to mouse events: drag point, remove point on double click, add point on double click
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;
            private moved: boolean = false;

            private dragPointIndex: number = null;

            private dragShape: boolean = false;
            private dragShapeX: number = -1;
            private dragShapeY: number = -1;

            onmousedown(event: MouseIn): boolean {
                this.dragPointIndex = null;

                if (event.button == 0) { //left button down => test drag point
                    this.down = true;

                    //test point
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (pointIndex != null) { //start dragging this point
                        this.dragPointIndex = pointIndex;
                        return true;
                    }

                    let shape = polyline.picker.pickShape(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (pointIndex == null && shape && event.altKey) {
                        if (event.ctrlKey) {
                            polyline.cloneOnCanvas(env.canvas, 0, 0);
                        }
                        this.dragShape = true;
                        this.dragShapeX = position.x;
                        this.dragShapeY = position.y;
                    }
                } else if (event.button == 2) {
                    this.moved = false;
                }
                return false;
            }
            onmouseup(event: MouseIn): boolean {
                let wasDragging: boolean = this.dragPointIndex != null || !!this.dragShape; //pass event if not dragging, so that LayerPolylineView will deselect this polyline

                this.dragPointIndex = null;

                this.dragShape = false;
                this.dragShapeX = -1;
                this.dragShapeY = -1;

                if (event.button == 0) { //left button up => nothing
                    this.down = false;
                    return wasDragging;
                } else if (event.button == 2) {
                    let hit = false;
                    if (!this.moved) {
                        let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        //test points
                        let pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (pointIndex != null) { //delete point
                            if (polyline.editor.pointCount() > 3) { //so it will be at least a triangle
                                polyline.editor.removePoint(pointIndex);
                                self.canvas.requestRender();
                            }
                            hit = true;
                        }
                    }
                    this.moved = false;
                    return hit;
                }
                return false;
            }
            ondblclick(event: MouseIn): boolean { //double click => remove point on selection or add point on segment
                if (event.button == 0) {
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);

                    //test points
                    let pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (pointIndex != null) { //delete point
                        if (polyline.editor.pointCount() > 3) { //so it will be at least a triangle
                            polyline.editor.removePoint(pointIndex);
                            self.canvas.requestRender();
                        }
                        return true;
                    }

                    //test segments
                    let segment = polyline.picker.pickLine(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (segment) { //add point
                        let newIndex = segment.p1Index; //insert point after p1
                        polyline.editor.insertPoint(segment.position.x, segment.position.y, newIndex);
                        self.canvas.requestRender();
                        return true;
                    }
                }

                return false;
            }
            onmousemove(event: MouseIn): boolean {
                if (this.down) { //left button is down => drag
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);

                    if (this.dragPointIndex != null) {
                        polyline.editor.setPoint(this.dragPointIndex, position.x, position.y);
                        if (event.ctrlKey) {
                            let radius = self.camera.screenSizeToCanvas(EditorPolylineEdit.MAG_RADIUS);
                            let result = undefined;
                            if (!result) {
                                let p = polyline.editor.getPoint(this.dragPointIndex);
                                result = layerView.tryAlignPoint(p, polyline, radius);
                            }
                            if (!result) {
                                result = polyline.calculator.alignPoint(this.dragPointIndex, radius);
                            }
                            if (result) {
                                polyline.editor.setPoint(this.dragPointIndex, result.x, result.y);
                            }
                        }

                        self.canvas.requestRender();
                        return true;

                    } else if (this.dragShape) {
                        polyline.editor.move(position.x - this.dragShapeX, position.y - this.dragShapeY);
                        this.dragShapeX = position.x;
                        this.dragShapeY = position.y;

                        self.canvas.requestRender();
                        return true;
                    }
                } else if (event.buttons & 2) {
                    this.moved = true;
                }
                return false;
            }
        };
        this._keyboardListener = Ui.createKeyboardListener(self.canvas, self.camera, polyline, () => {
            layerView.deletePolyline(polyline);
            Selection.deselect(SelectType.POLYLINE);
            env.canvas.requestRender();
        });
    }

    exit(env: Env): void {
    }

    render(env: Env): void {
    }

}
import { Editor, Usage, UsageType } from "./Editor";
import { MouseIn, MouseListener } from "../MouseListener";
import { EditorName } from "./Editors";
import { Canvas } from "../Canvas";
import { Env } from "../Env";
import { DrawablePolyline } from "../editable/DrawablePolyline";
import { Selection, SelectType } from "../layers/Selection";
import { Ui } from "../util/Ui";
import { LayerName } from "../layers/Layers";
import { LayerPolylineView } from "../layers/LayerPolylineView";
import { annotationHistory, HistoryTransaction } from "../history/AnnotationHistory";

export class EditorPolylineEdit extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.POLYLINE_EDIT, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("hold left button to drag points", UsageType.MOUSE),
            Editor.usage("hold ctrl to help with horizontal/vertical line", UsageType.MOUSE),
            Editor.usage("hold ctrl on polyline and drag to clone polyline", UsageType.MOUSE),
            Editor.usage("double click on line to create point", UsageType.MOUSE),
            Editor.usage("right-click / double left-click point to delete it", UsageType.MOUSE),
            Editor.usage("WSAD ↑↓←→ to move, hold shift to speed up", UsageType.KEYBOARD),
            Editor.usage("press delete to delete selected", UsageType.KEYBOARD),
        ];
    }

    private static readonly MAG_RADIUS = 10;

    enter(env: Env): void {
        let layerView = <LayerPolylineView>env.canvas.findLayer(LayerName.POLYLINE_VIEW);

        let { item: item, type: type } = Selection.getSelected();
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
            private transaction: HistoryTransaction = null;

            onmousedown(event: MouseIn): boolean {
                this.dragPointIndex = null;

                if (event.button === 0) { //left button down => test drag point
                    this.down = true;

                    //test point
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (pointIndex !== null && pointIndex !== undefined) { //start dragging this point
                        this.dragPointIndex = pointIndex;
                        this.transaction = annotationHistory.begin(self.canvas, [polyline], "polyline.point.move");
                        return true;
                    }

                    let shape = polyline.picker.pickShape(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if ((pointIndex === null || pointIndex === undefined) && shape && event.altKey) {
                        this.transaction = annotationHistory.begin(self.canvas, [polyline], event.ctrlKey ? "polyline.clone.drag" : "polyline.move");
                        if (event.ctrlKey) {
                            const clone = polyline.cloneOnCanvas(env.canvas, 0, 0);
                            if (clone) annotationHistory.trackAdded(this.transaction, [clone]);
                        }
                        this.dragShape = true;
                        this.dragShapeX = position.x;
                        this.dragShapeY = position.y;
                        return true;
                    }
                } else if (event.button === 2) {
                    this.moved = false;
                }
                return false;
            }
            onmouseup(event: MouseIn): boolean {
                let wasDragging: boolean = (this.dragPointIndex !== null && this.dragPointIndex !== undefined) || !!this.dragShape; //pass event if not dragging, so that LayerPolylineView will deselect this polyline
                if (annotationHistory.isActive(this.transaction)) {
                    annotationHistory.commit(self.canvas, this.transaction);
                }
                this.transaction = null;

                this.dragPointIndex = null;

                this.dragShape = false;
                this.dragShapeX = -1;
                this.dragShapeY = -1;
                if (event.button === 0) { //left button up => nothing
                    this.down = false;
                    return wasDragging;
                } else if (event.button === 2) {
                    let hit = false;
                    if (!this.moved) {
                        let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        //test points
                        let pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (pointIndex !== null && pointIndex !== undefined) { //delete point
                            if (polyline.editor.pointCount() > 3) { //so it will be at least a triangle
                                annotationHistory.mutatePolyline(self.canvas, polyline, "polyline.point.remove", draft => {
                                    draft.editor.removePoint(pointIndex);
                                });
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
                if (event.button === 0) {
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);

                    //test points
                    let pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (pointIndex !== null && pointIndex !== undefined) { //delete point
                        if (polyline.editor.pointCount() > 3) { //so it will be at least a triangle
                            annotationHistory.mutatePolyline(self.canvas, polyline, "polyline.point.remove", draft => {
                                draft.editor.removePoint(pointIndex);
                            });
                        }
                        return true;
                    }

                    //test segments
                    let segment = polyline.picker.pickLine(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (segment) { //add point
                        let newIndex = segment.p1Index; //insert point after p1
                        annotationHistory.mutatePolyline(self.canvas, polyline, "polyline.point.insert", draft => {
                            draft.editor.insertPoint(segment.position.x, segment.position.y, newIndex);
                        });
                        return true;
                    }
                }

                return false;
            }
            onmousemove(event: MouseIn): boolean {
                if (this.down) { //left button is down => drag
                    if (this.transaction && !annotationHistory.isActive(this.transaction)) {
                        this.down = false;
                        this.dragPointIndex = null;
                        this.dragShape = false;
                        this.transaction = null;
                        return false;
                    }
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);

                    if (this.dragPointIndex !== null && this.dragPointIndex !== undefined) {
                        polyline.editor.setPoint(this.dragPointIndex, position.x, position.y);
                        if (event.ctrlKey) {
                            let radius = self.camera.screenSizeToCanvas(EditorPolylineEdit.MAG_RADIUS);
                            let result = layerView.tryAlignPoint(polyline.editor.getPoint(this.dragPointIndex), polyline, radius);
                            if (!result) result = polyline.calculator.alignPoint(this.dragPointIndex, radius);
                            if (result) polyline.editor.setPoint(this.dragPointIndex, result.x, result.y);
                        }
                        self.canvas.requestRender();
                        return true;

                    } else if (this.dragShape) {
                        const dx = position.x - this.dragShapeX;
                        const dy = position.y - this.dragShapeY;
                        this.dragShapeX = position.x;
                        this.dragShapeY = position.y;
                        polyline.editor.move(dx, dy);
                        self.canvas.requestRender();
                        return true;
                    }
                } else if (event.buttons & 2) {
                    this.moved = true;
                } else {
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (pointIndex !== null && pointIndex !== undefined) {
                        self.canvas.getElement().style.cursor = "crosshair";
                        return true;
                    }
                }
                return false;
            }
        };
        this._keyboardListener = Ui.createKeyboardListener(self.canvas, self.camera, polyline, () => {
            annotationHistory.removeDrawables(env.canvas, [polyline], "polyline.delete");
        }, (dx, dy) => {
            annotationHistory.mutatePolyline(env.canvas, polyline, "polyline.move.keyboard", draft => {
                draft.move(dx, dy);
            }, annotationHistory.mergeKey("polyline.move.keyboard", [polyline]));
        });
    }

    exit(env: Env): void {
        annotationHistory.commitActive(env.canvas);
    }

    render(env: Env): void {
    }

}

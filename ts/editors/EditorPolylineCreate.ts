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
import {Position} from "../util/Transform";

export class EditorPolylineCreate extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.POLYLINE_CREATE, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("left click to create point", UsageType.MOUSE),
            Editor.usage("hold left button to preview point", UsageType.MOUSE),
            Editor.usage("right click to finish creating", UsageType.MOUSE),
            Editor.usage("hold ctrl to help with horizontal/vertical line", UsageType.MOUSE),
            Editor.usage("WSAD ↑↓←→ to move, hold shift to speed up", UsageType.KEYBOARD),
            Editor.usage("press del to delete", UsageType.KEYBOARD),
        ];
    }

    private selected: DrawablePolyline;

    private static readonly MAG_RADIUS = 10;

    enter(env: Env): void {
        this.selected = undefined;
        let layerView = <LayerPolylineView>env.canvas.findLayer(LayerName.POLYLINE_VIEW);

        let {item: item, type: type} = Selection.getSelected();
        if (type !== SelectType.POLYLINE_CREATE) return;
        let polyline = <DrawablePolyline>item;
        this.selected = polyline;

        //start listening to mouse events: drag point, remove point on double click, add point on double click
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;
            private moved: boolean = false;

            private preview(position: Position, magnetic: boolean): void {
                polyline.editor.setPoint(-1, position.x, position.y);
                if (magnetic) {
                    let radius = self.camera.screenSizeToCanvas(EditorPolylineCreate.MAG_RADIUS);
                    let result = polyline.calculator.alignPoint(-1, radius);
                    polyline.editor.setPoint(-1, result.x, result.y);
                }
            }
            onmousedown(event: MouseIn): boolean {
                if (event.button == 0 && !this.down) { //left button down => add point
                    this.down = true;
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    polyline.editor.addPoint(position.x, position.y);
                    self.canvas.requestRender();
                    return true;
                } else if (event.button == 2) {
                    this.moved = false;
                }
                return false;
            }
            onmouseup(event: MouseIn): boolean {
                if (event.button == 0) { //left button up => update last point
                    this.down = false;
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    this.preview(position, event.ctrlKey);
                    self.canvas.requestRender();
                    return true;
                } else if (event.button == 2) {
                    if (!this.moved) {
                        if (polyline.check()) {
                            self.selected = undefined;
                            //pass it to polyline edit
                            setTimeout(() => {
                                Selection.select(SelectType.POLYLINE, polyline);
                            });
                        }
                    }
                    this.moved = false;
                    return true;
                }
                return false;
            }
            onmousemove(event: MouseIn): boolean {
                if (this.down) { //left button is down => show modification
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    this.preview(position, event.ctrlKey);
                    self.canvas.requestRender();
                    return true;
                } else if (event.buttons & 2) {
                    this.moved = true;
                }
                return false;
            }
        };
        this._keyboardListener = Ui.createKeyboardListener(self.canvas, self.camera, polyline, () => {
            layerView.deletePolyline(polyline);
            this.selected = undefined;
            Selection.deselect(SelectType.POLYLINE_CREATE);
            env.canvas.requestRender();
        });
    }

    exit(env: Env): void {
        if (this.selected) {
            let layerView = <LayerPolylineView>env.canvas.findLayer(LayerName.POLYLINE_VIEW);
            layerView.deletePolyline(this.selected);
            this.selected = undefined;
            Selection.deselect(SelectType.POLYLINE_CREATE);
            env.canvas.requestRender();
        }
    }

    render(env: Env): void {
    }

}
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

export class EditorRectCreate extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.RECT_CREATE, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("drag left button to create rectangle", UsageType.MOUSE),
            Editor.usage("hold shift to keep square", UsageType.MOUSE),
            Editor.usage("right click to cancel creating", UsageType.MOUSE),
            Editor.usage("WSAD to move, hold shift to speed up", UsageType.KEYBOARD),
            Editor.usage("press del to delete", UsageType.KEYBOARD),
        ];
    }

    private selected: DrawablePolyline;

    enter(env: Env): void {
        this.selected = undefined;
        const layerView = <LayerPolylineView>env.canvas.findLayer(LayerName.POLYLINE_VIEW);

        const { item, type } = Selection.getSelected();
        if (type !== SelectType.POLYLINE_CREATE) return;
        const polyline = <DrawablePolyline>item;
        this.selected = polyline;

        let anchorX = 0;
        let anchorY = 0;
        let dragging = false;
        let started = false;

        const syncRectPoints = (x1: number, y1: number, x2: number, y2: number) => {
            if (polyline.editor.pointCount() === 0) {
                polyline.editor.addPoint(x1, y1);
                polyline.editor.addPoint(x2, y1);
                polyline.editor.addPoint(x2, y2);
                polyline.editor.addPoint(x1, y2);
                return;
            }
            polyline.editor.setPoint(0, x1, y1);
            polyline.editor.setPoint(1, x2, y1);
            polyline.editor.setPoint(2, x2, y2);
            polyline.editor.setPoint(3, x1, y2);
        };

        const updateRectPreview = (event: MouseIn) => {
            const position = this.camera.screenXyToCanvas(event.offsetX, event.offsetY);
            let x2 = position.x;
            let y2 = position.y;
            if (event.shiftKey) {
                const dx = x2 - anchorX;
                const dy = y2 - anchorY;
                const size = Math.max(Math.abs(dx), Math.abs(dy));
                x2 = anchorX + (dx >= 0 ? size : -size);
                y2 = anchorY + (dy >= 0 ? size : -size);
            }
            const x1 = Math.min(anchorX, x2);
            const y1 = Math.min(anchorY, y2);
            const xMax = Math.max(anchorX, x2);
            const yMax = Math.max(anchorY, y2);
            syncRectPoints(x1, y1, xMax, yMax);
            this.canvas.requestRender();
        };

        this._mouseListener = new class extends MouseListener {
            onmousedown(event: MouseIn): boolean {
                if (event.button === 0) {
                    const p = thisCamera.screenXyToCanvas(event.offsetX, event.offsetY);
                    anchorX = p.x;
                    anchorY = p.y;
                    started = true;
                    dragging = true;
                    syncRectPoints(anchorX, anchorY, anchorX, anchorY);
                    thisCanvas.requestRender();
                    return true;
                }
                if (event.button === 2) {
                    if (started) {
                        layerView.deletePolyline(polyline);
                        selectedRef.selected = undefined;
                        Selection.deselect(SelectType.POLYLINE_CREATE);
                        thisCanvas.requestRender();
                        return true;
                    }
                }
                return false;
            }

            onmousemove(event: MouseIn): boolean {
                if (dragging && (event.buttons & 1)) {
                    updateRectPreview(event);
                    return true;
                }
                return false;
            }

            onmouseup(event: MouseIn): boolean {
                if (event.button !== 0 || !dragging) return false;
                dragging = false;
                updateRectPreview(event);
                selectedRef.selected = undefined;
                setTimeout(() => {
                    Selection.select(SelectType.POLYLINE, polyline);
                });
                return true;
            }
        };

        const thisCanvas = this.canvas;
        const thisCamera = this.camera;
        const selectedRef = this;
        this._keyboardListener = Ui.createKeyboardListener(this.canvas, this.camera, polyline, () => {
            layerView.deletePolyline(polyline);
            this.selected = undefined;
            Selection.deselect(SelectType.POLYLINE_CREATE);
            env.canvas.requestRender();
        });
    }

    exit(env: Env): void {
        if (this.selected) {
            const layerView = <LayerPolylineView>env.canvas.findLayer(LayerName.POLYLINE_VIEW);
            layerView.deletePolyline(this.selected);
            this.selected = undefined;
            Selection.deselect(SelectType.POLYLINE_CREATE);
            env.canvas.requestRender();
        }
    }

    render(env: Env): void {
    }
}

import {Editor} from "./Editor";
import {MouseIn, MouseListener} from "../MouseListener";
import {EditorName} from "./Editors";
import {Canvas} from "../Canvas";
import {DrawablePolyline} from "../editable/DrawablePolyline";
import {Selection, SelectType} from "../layers/Selection";
import {Env} from "../Env";
import {Renderer} from "../Renderer";
import {DrawableText} from "../editable/DrawableText";

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
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;

                    //text first
                    let text = EditorSelect.pickText(x, y, env);
                    if (text) {
                        Selection.select(SelectType.TEXT, text);
                        return true;
                    }

                    //polyline next
                    let polyline = EditorSelect.pickPolyline(x, y, env);
                    if (polyline) {
                        Selection.select(SelectType.POLYLINE, polyline);
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

    exit(env: Env): void {
    }


    //pick

    private static pickPolyline(x: number, y: number, env: Env): DrawablePolyline {
        let radius = env.camera.screenSizeToCanvas(5);
        let picked: DrawablePolyline = null;
        for (let polyline of env.polylines) {
            let pickPointIndex = polyline.picker.pickPoint(x, y, radius);
            let pickLine = polyline.picker.pickLine(x, y, radius);
            let pickShape = polyline.picker.pickShape(x, y);
            if (pickPointIndex != null || pickLine || pickShape) {
                picked = polyline;
            }
        }
        return picked;
    }

    private static pickText(x: number, y: number, env: Env): DrawableText {
        let radius = env.camera.screenSizeToCanvas(5);
        let picked: DrawableText = null;
        for (let text of env.texts) {
            let pick = text.pick(x, y, radius);
            if (pick) picked = text;
        }
        return picked;
    }


    //render

    render(env: Env): void {
        let {item: item, type: type} = Selection.getSelected();
        switch (type) {
            case SelectType.POLYLINE:
            case SelectType.POLYLINE_CREATE:
                this.drawSelectedPolyline(<DrawablePolyline>item, env.renderer);
                break;
            case SelectType.TEXT:
                this.drawSelectedText(<DrawableText>item, env.renderer);
                break;
        }
    }

    private drawSelectedPolyline(polyline: DrawablePolyline, renderer: Renderer) {
        let drawPointCircle = (x: number, y: number, renderer: Renderer) => {
            let position = this.camera.canvasToScreen(x, y);
            renderer.setColor("rgba(255,255,255,1)");
            renderer.drawCircle(position.x, position.y, 5, false, true, 1);
            renderer.setColor("rgba(0,0,0,0.5)");
            renderer.drawCircle(position.x, position.y, 4, true, false);
        };
        polyline.editor.forEachPoint((x, y) => {
            drawPointCircle(x, y, renderer);
        });
    }

    private drawSelectedText(text: DrawableText, renderer: Renderer) {
        renderer.setColor(text.colorString);
        let aabb = text.validateCanvasAABB(this.camera, renderer);
        let p1 = this.camera.canvasToScreen(aabb.x1, aabb.y1);
        let p2 = this.camera.canvasToScreen(aabb.x2, aabb.y2);
        renderer.drawRect(
            p1.x - 5, p1.y - 5, p2.x + 5, p2.y + 5,
            false, true, 2
        );
    }

}
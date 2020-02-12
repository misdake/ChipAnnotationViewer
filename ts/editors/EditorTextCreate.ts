import {Editor, Usage, UsageType} from "./Editor";
import {MouseIn, MouseListener} from "../MouseListener";
import {EditorName} from "./Editors";
import {Canvas} from "../Canvas";
import {Env} from "../Env";
import {Selection, SelectType} from "../layers/Selection";
import {Ui} from "../util/Ui";
import {LayerName} from "../layers/Layers";
import {DrawableText} from "../editable/DrawableText";
import {LayerTextView} from "../layers/LayerTextView";

export class EditorTextCreate extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.TEXT_CREATE, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("left click to create text", UsageType.MOUSE),
        ];
    }

    private selected: DrawableText;

    enter(env: Env): void {
        this.selected = undefined;
        let layerView = <LayerTextView>env.canvas.findLayer(LayerName.TEXT_VIEW);

        let {item: item, type: type} = Selection.getSelected();
        if (type !== SelectType.TEXT_CREATE) return;
        let text = <DrawableText>item;
        this.selected = text;
        text.setPosition(-1e9, -1e9);

        //start listening to mouse events: drag point, remove point on double click, add point on double click
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;

            onmousedown(event: MouseIn): boolean {
                if (event.button == 0) {
                    this.down = true;
                    return true;
                }
                return false;
            }
            onmouseup(event: MouseIn): boolean {
                if (event.button == 0) { //left button up => update last point
                    this.down = false;
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    text.setPosition(position.x, position.y);
                    self.selected = undefined;
                    Selection.select(SelectType.TEXT, text);
                    self.canvas.requestRender();
                    return true;
                } else {
                    return false;
                }
            }
            onmousemove(event: MouseIn): boolean {
                return (event.buttons & 1) && this.down;
            }
        };

        this._keyboardListener = Ui.createTextKeyboardListener(self.canvas, self.camera, text, () => {
            layerView.deleteText(text);
            this.selected = undefined;
            Selection.deselect(SelectType.TEXT_CREATE);
            env.canvas.requestRender();
        });
    }

    exit(env: Env): void {
        if (this.selected) {
            let layerView = <LayerTextView>env.canvas.findLayer(LayerName.TEXT_VIEW);
            layerView.deleteText(this.selected);
            this.selected = undefined;
            Selection.deselect(SelectType.TEXT_CREATE);
            env.canvas.requestRender();
        }
    }

    render(env: Env): void {
    }

}
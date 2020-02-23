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

export class EditorTextEdit extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.TEXT_EDIT, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("hold ctrl+alt to copy and drag", UsageType.MOUSE),
            Editor.usage("WSAD ↑↓←→ to move, hold shift to speed up", UsageType.KEYBOARD),
            Editor.usage("press del to delete", UsageType.KEYBOARD),
        ];
    }

    enter(env: Env): void {
        let layerView = <LayerTextView>env.canvas.findLayer(LayerName.TEXT_VIEW);

        let {item: item, type: type} = Selection.getSelected();
        if (type !== SelectType.TEXT) return;
        let text = <DrawableText>item;

        //start listening to mouse events: drag point, remove point on double click, add point on double click
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;
            private drag: boolean = false;
            private dragX: number = 0;
            private dragY: number = 0;

            onmousedown(event: MouseIn): boolean {
                if (event.button == 0) { //left button down => test drag point
                    this.down = true;
                    this.drag = false;

                    //test
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let pick = text.pick(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (pick && event.altKey) { //start dragging
                        if (event.ctrlKey) {
                            let copied = new DrawableText(text.clone(0, 0));
                            layerView.addText(copied);
                        }
                        this.drag = true;
                        this.dragX = position.x - text.x;
                        this.dragY = position.y - text.y;
                        return event.altKey;
                    }
                }
                return false;
            }
            onmouseup(event: MouseIn): boolean {
                let passEvent: boolean = !this.drag; //pass event if not moving point, so that LayerTextView will deselect this text
                this.drag = false;

                if (event.button == 0) { //left button up => nothing
                    this.down = false;
                    return !passEvent;
                }
                return false;
            }
            onmousemove(event: MouseIn): boolean {
                if (this.down && this.drag) {
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    text.setPosition(position.x - this.dragX, position.y - this.dragY);
                    self.canvas.requestRender();
                    return true;
                }
                return false;
            }
        };

        this._keyboardListener = Ui.createKeyboardListener(self.canvas, self.camera, text, () => {
            layerView.deleteText(text);
            Selection.deselect(SelectType.TEXT);
            env.canvas.requestRender();
        });
    }

    exit(env: Env): void {
    }

    render(env: Env): void {
    }

}
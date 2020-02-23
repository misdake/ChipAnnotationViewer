import {Editor, Usage, UsageType} from "./Editor";
import {MouseIn, MouseListener} from "../MouseListener";
import {EditorName} from "./Editors";
import {Canvas} from "../Canvas";
import {Env} from "../Env";
import {Selection, SelectType} from "../layers/Selection";
import {Ui} from "../util/Ui";
import {Drawable} from "../drawable/Drawable";
import {EditableColor, EditableDeleteClone, EditableMove, editableMultiple, EditablePick} from "../editable/Editable";
import {EditorSelect} from "./EditorSelect";

export class EditorMultiple extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.MULTIPLE_EDIT, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("hold alt to drag", UsageType.MOUSE),
            Editor.usage("hold ctrl+alt to copy and drag", UsageType.MOUSE),
            Editor.usage("WSAD ↑↓←→ to move, hold shift to speed up", UsageType.KEYBOARD),
            Editor.usage("press del to delete", UsageType.KEYBOARD),
        ];
    }

    enter(env: Env): void {
        let editorSelect = <EditorSelect>env.canvas.findEditor(EditorName.SELECT);

        let {item: item, type: type} = Selection.getSelected();
        if (type !== SelectType.MULTIPLE) return;
        let drawables = <(Drawable & EditablePick & EditableColor)[]>item;

        let editable: EditableDeleteClone & EditableMove & EditableColor = editableMultiple(drawables);

        //start listening to mouse events: drag point, remove point on double click, add point on double click
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;
            private drag: boolean = false;
            private dragX: number = 0;
            private dragY: number = 0;

            onmousedown(event: MouseIn): boolean {
                if (event.button == 0) { //left button down => check pick => get ready to move
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);

                    this.down = true;
                    this.drag = false;

                    if (!event.altKey) return false;

                    let {item} = editorSelect.pickAny(position.x, position.y, env, drawables);
                    if (item && drawables.indexOf(<(Drawable & EditablePick & EditableColor)>item) >= 0) { // mouse down on select => good

                        if (event.ctrlKey) {
                            editable.cloneOnCanvas(env.canvas, 0, 0); //create clones at where they were
                        }

                        this.drag = true;
                        this.dragX = position.x;
                        this.dragY = position.y;
                        return true;
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

                    let dx = position.x - this.dragX;
                    let dy = position.y - this.dragY;
                    editable.move(dx, dy);
                    this.dragX = position.x;
                    this.dragY = position.y;

                    self.canvas.requestRender();
                    return true;
                }
                return false;
            }
        };

        this._keyboardListener = Ui.createKeyboardListener(self.canvas, self.camera, editable, () => {
            editable.deleteOnCanvas(env.canvas);
            Selection.deselect(SelectType.MULTIPLE);
            env.canvas.requestRender();
        });
    }

    exit(env: Env): void {
    }

    render(env: Env): void {
    }

}
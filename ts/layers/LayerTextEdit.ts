import {Layer} from "../Layer";
import {DrawableText} from "../drawable/DrawableText";
import {Canvas} from "../Canvas";
import {MouseListener} from "../MouseListener";
import {Renderer} from "../Renderer";
import {LayerTextView} from "./LayerTextView";
import {Ui} from "../util/Ui";
import {Data} from "../data/Data";
import {Selection} from "./Selection";
import {Drawable} from "../drawable/Drawable";
import {Names} from "./Names";
import {KeyboardListener} from "../KeyboardListener";

export class LayerTextEdit extends Layer {

    private static readonly HINT_ELEMENT_ID = "hint";

    private static readonly HINT_EDIT_TEXT =
        "1. hold alt to drag<br>" +
        "2. hold ctrl+alt to copy and drag <br>";

    private textEdit: DrawableText = null;
    private layerView: LayerTextView;

    public constructor(canvas: Canvas) {
        super(Names.TEXT_EDIT, canvas);
        let self = this;
        Selection.register(Names.TEXT_EDIT, (item: Drawable) => {
            self.startEditingText(item as DrawableText);
        }, () => {
            self.finishEditing();
        });
    }

    public loadData(data: Data): void {
        this.layerView = this.canvas.findLayer(Names.TEXT_VIEW) as LayerTextView;
        this.finishEditing();
        Ui.setVisibility("panelTextSelected", false);
    }

    public startEditingText(text: DrawableText): void {
        this.finishEditing();

        //show text and its point indicators
        this.textEdit = text;
        this.bindTextConfigUi(this.textEdit);

        Ui.setContent(LayerTextEdit.HINT_ELEMENT_ID, LayerTextEdit.HINT_EDIT_TEXT);

        //start listening to mouse events: drag point, remove point on double click, add point on double click
        let self = this;

        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;
            private drag: boolean = false;
            private dragX: number = 0;
            private dragY: number = 0;

            onmousedown(event: MouseEvent): boolean {
                if (event.button == 0) { //left button down => test drag point
                    this.down = true;
                    this.drag = false;

                    //test
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let pick = text.pick(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (pick && event.altKey) { //start dragging
                        if (event.ctrlKey) {
                            let copied = new DrawableText(text.clone(0, 0));
                            self.layerView.addText(copied);
                        }
                        this.drag = true;
                        this.dragX = position.x - text.x;
                        this.dragY = position.y - text.y;
                        return event.altKey;
                    }
                }
                return false;
            }
            onmouseup(event: MouseEvent): boolean {
                let passEvent: boolean = !this.drag; //pass event if not moving point, so that LayerTextView will deselect this text
                this.drag = false;

                if (event.button == 0) { //left button up => nothing
                    this.down = false;
                    return !passEvent;
                }
                return false;
            }
            onmousemove(event: MouseEvent): boolean {
                if (this.down && this.drag) {
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    self.textEdit.setPosition(position.x - this.dragX, position.y - this.dragY);
                    self.canvas.requestRender();
                    return true;
                }
                return false;
            }
        };

        this._keyboardListener = Ui.createTextKeyboardListener(self.canvas, self.camera, self.textEdit);

        this.canvas.requestRender();
    }

    public finishEditing(): void {
        Ui.setVisibility("panelTextSelected", false);

        if (this.textEdit) {
            if (this.textEdit.text.length == 0) {
                this.layerView.deleteText(this.textEdit);
            }
            this.textEdit = null;
            this.canvas.requestRender();
        }
        this._mouseListener = null;
        this._keyboardListener = null;
    }

    public render(renderer: Renderer): void {
        if (this.textEdit) {
            //draw rect
            renderer.setColor(this.textEdit.colorString);
            let aabb = this.textEdit.validateCanvasAABB(this.camera, renderer);
            let p1 = this.camera.canvasToScreen(aabb.x1, aabb.y1);
            let p2 = this.camera.canvasToScreen(aabb.x2, aabb.y2);
            renderer.drawRect(
                p1.x - 5, p1.y - 5, p2.x + 5, p2.y + 5,
                false, true, 2
            );
        }
    }

    public deleteEditing() {
        if (this.textEdit) {
            this.layerView.deleteText(this.textEdit);
            this.finishEditing();
        }
    }

    private bindTextConfigUi(text: DrawableText) {
        Ui.setVisibility("panelTextSelected", true);

        Ui.bindButtonOnClick("textButtonCopy", () => {
            let offset = this.canvas.getCamera().screenSizeToCanvas(10);
            let newText = new DrawableText(text.clone(offset, offset));

            this.finishEditing();
            this.layerView.addText(newText);
            this.startEditingText(newText);

            this.canvas.requestRender();
        });

        Ui.bindValue("textTextContent", text.text, newValue => {
            text.text = newValue;
            this.canvas.requestRender();
        });

        Ui.bindNumber("textTextSizeOnScreen", text.onScreen, newValue => {
            text.onScreen = newValue;
            this.canvas.requestRender();
        });
        Ui.bindNumber("textTextSizeOnCanvas", text.onCanvas, newValue => {
            text.onCanvas = newValue;
            this.canvas.requestRender();
        });
        Ui.bindNumber("textTextSizeOfScreen", text.ofScreen * 1000, newValue => {
            text.ofScreen = newValue * 0.001;
            this.canvas.requestRender();
        });

        Ui.bindColor("textContainerColor", "textContainerAlpha", text.color, text.alpha, (newColor, newAlpha) => {
            text.setColorAlpha(newColor, newAlpha);
            this.canvas.requestRender();
        });
    }
}

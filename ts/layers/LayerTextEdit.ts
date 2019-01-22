import {Layer} from "../Layer";
import {DrawableText, DrawableTextPack} from "../drawable/DrawableText";
import {Canvas} from "../Canvas";
import {Size} from "../util/Size";
import {MouseListener} from "../MouseListener";
import {Renderer} from "../Renderer";
import {LayerTextView} from "./LayerTextView";
import {Ui} from "../util/Ui";
import {Data} from "../data/Data";
import {Selection} from "./Selection";
import {Drawable} from "../drawable/Drawable";

export class LayerTextEdit extends Layer {
    public static readonly layerName = "text edit";

    private static readonly HINT_ELEMENT_ID = "textHint";
    private static readonly HINT_NEW_TEXT =
        "1. left click to create text<br>";
    private static readonly HINT_EDIT_TEXT =
        "1. hold alt to drag<br>" +
        "2. hold ctrl+alt to copy and drag <br>";

    private textEdit: DrawableText = null;
    private layerView: LayerTextView;

    public constructor(canvas: Canvas) {
        super(LayerTextEdit.layerName, canvas);
        let self = this;
        Selection.register(DrawableText.typeName, (item: Drawable) => {
            self.startEditingText(item as DrawableText);
        }, () => {
            self.finishEditing();
        });
    }

    public loadData(data: Data): void {
        this.layerView = this.canvas.findLayer(LayerTextView.layerName) as LayerTextView;
        this.finishEditing();
        Ui.setVisibility("panelTextSelected", false);
    }

    public startCreatingText() {
        this.finishEditing();
        let self = this;

        //show text and its point indicators
        let textNew = new DrawableText(new DrawableTextPack(
            "text",
            "white", "100", new Size(20, 50),
            0, 0
        ));
        this.bindTextConfigUi(textNew);

        Ui.setContent(LayerTextEdit.HINT_ELEMENT_ID, LayerTextEdit.HINT_NEW_TEXT);

        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;

            onmousedown(event: MouseEvent): boolean {
                if (event.button == 0) {
                    this.down = true;
                    return true;
                }
                return false;
            }
            onmouseup(event: MouseEvent): boolean {
                if (event.button == 0) { //left button up => update last point
                    this.down = false;
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    textNew.setPosition(position.x, position.y);
                    self.layerView.addText(textNew);
                    Selection.select(DrawableText.typeName, textNew);
                    self.canvas.requestRender();
                    return true;
                } else {
                    return false;
                }
            }
            onmousemove(event: MouseEvent): boolean {
                return (event.buttons & 1) && this.down;

            }
        };
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

        Ui.bindNumber("textTextSizeOnScreen", text.fontSize.onScreen, newValue => {
            text.fontSize.onScreen = newValue;
            this.canvas.requestRender();
        });
        Ui.bindNumber("textTextSizeOnCanvas", text.fontSize.onCanvas, newValue => {
            text.fontSize.onCanvas = newValue;
            this.canvas.requestRender();
        });
        Ui.bindNumber("textTextSizeOfScreen", text.fontSize.ofScreen * 1000, newValue => {
            text.fontSize.ofScreen = newValue * 0.001;
            this.canvas.requestRender();
        });

        Ui.bindColor("textContainerColor", "textContainerAlpha", text.color, text.alpha, (newColor, newAlpha) => {
            text.setColorAlpha(newColor, newAlpha);
            this.canvas.requestRender();
        });
    }
}

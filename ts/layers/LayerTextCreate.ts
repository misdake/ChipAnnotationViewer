import {Layer} from "../Layer";
import {DrawableText, DrawableTextPack} from "../drawable/DrawableText";
import {Canvas} from "../Canvas";
import {Size} from "../util/Size";
import {MouseIn, MouseListener} from "../MouseListener";
import {Renderer} from "../Renderer";
import {LayerTextView} from "./LayerTextView";
import {Ui} from "../util/Ui";
import {Data} from "../data/Data";
import {Selection} from "./Selection";
import {Drawable} from "../drawable/Drawable";
import {Names} from "./Names";

export class LayerTextCreate extends Layer {

    private static readonly HINT_ELEMENT_ID = "hint";
    private static readonly HINT_NEW_TEXT =
        "1. left click to create text<br>" +
        "2. WSAD ↑↓←→ to move, hold shift to speed up<br>" +
        "3. press del to delete<br>";

    private textNew: DrawableText;
    private layerView: LayerTextView;

    public constructor(canvas: Canvas) {
        super(Names.TEXT_CREATE, canvas);
        Selection.register(Names.TEXT_CREATE, (item: Drawable) => {
            this.startCreatingText();
        }, () => {
            this.finishCreating();
        });
    }

    public loadData(data: Data): void {
        this.layerView = this.canvas.findLayer(Names.TEXT_VIEW) as LayerTextView;
        this.finishCreating();
        Ui.setVisibility("panelTextSelected", false);
    }

    public createTextAndEdit() {
        //show text and its point indicators
        this.textNew = new DrawableText(new DrawableTextPack(
            "text",
            "white", "100", new Size(5, 50),
            0, 0
        ));
        Selection.select(Names.TEXT_CREATE, this.textNew);
    }

    private startCreatingText() {
        this.finishCreating();
        let self = this;
        this.bindTextConfigUi(this.textNew);

        Ui.setContent(LayerTextCreate.HINT_ELEMENT_ID, LayerTextCreate.HINT_NEW_TEXT);

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
                    self.textNew.setPosition(position.x, position.y);
                    self.layerView.addText(self.textNew);
                    Selection.select(Names.TEXT_EDIT, self.textNew);
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

        this._keyboardListener = Ui.createTextKeyboardListener(self.canvas, self.camera, self.textNew, () => {
            this.deleteCreating();
            Selection.deselect(Names.TEXT_CREATE);
        });
    }

    public finishCreating(): void {
        Ui.setVisibility("panelTextSelected", false);

        this._mouseListener = null;
        this._keyboardListener = null;
    }

    public render(renderer: Renderer): void {

    }

    public deleteCreating() {
        if (this.textNew) {
            this.layerView.deleteText(this.textNew);
            this.textNew = null;
            this.finishCreating();
        }
    }

    private bindTextConfigUi(text: DrawableText) {
        Ui.setVisibility("panelTextSelected", true);

        Ui.bindButtonOnClick("textButtonCopy", () => {
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

        Ui.bindColor("textContainerColor", "textContainerAlpha", text.color, text.alpha, (newColor, newAlpha) => {
            text.setColorAlpha(newColor, newAlpha);
            this.canvas.requestRender();
        });
    }
}

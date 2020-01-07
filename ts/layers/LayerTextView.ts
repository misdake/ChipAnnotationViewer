import {Layer} from "../Layer";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {MouseIn, MouseListener} from "../MouseListener";
import {DrawableText} from "../editable/DrawableText";
import {Data} from "../data/Data";
import {Selection} from "./Selection";
import {Names} from "./Names";

export class LayerTextView extends Layer {

    private texts: DrawableText[] = [];

    public constructor(canvas: Canvas) {
        super(Names.TEXT_VIEW, canvas);
    }

    public loadData(data: Data): void {
        this.texts = [];

        if (data.texts) {
            for (let pack of data.texts) {
                this.texts.push(new DrawableText(pack))
            }
        }

        //listen to mouse click to select text
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
                    let selected: DrawableText = null;
                    for (let text of self.texts) {
                        let pick = text.pick(x, y, self.camera.screenSizeToCanvas(5));
                        if (pick) selected = text;
                    }
                    if (selected) {
                        Selection.select(Names.TEXT_EDIT, selected);
                        return true;
                    }
                    Selection.deselect(Names.TEXT_CREATE);
                    Selection.deselect(Names.TEXT_EDIT);
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

    public addText(text: DrawableText) {
        this.texts.push(text);
        this.canvas.requestRender();
    }
    public deleteText(text: DrawableText): boolean {
        let index = this.texts.indexOf(text);
        if (index !== -1) {
            this.texts.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }

    public saveData(data: Data): void {
        data.texts = [];
        for (const text of this.texts) {
            data.texts.push(text.pack());
        }
    }

    public render(renderer: Renderer): void {
        super.render(renderer);
        for (const text of this.texts) {
            text.render(this.canvas, renderer, this.camera);
        }
    }

    public unload(): void {
        super.unload();
    }

}

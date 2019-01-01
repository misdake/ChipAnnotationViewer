import {Layer} from "../Layer";
import {Canvas} from "../Canvas";
import {Map} from "../data/Map";
import {Renderer} from "../Renderer";
import {MouseListener} from "../MouseListener";
import {DrawableText} from "../drawable/DrawableText";
import {Data} from "../data/Data";
import {LayerTextEdit} from "./LayerTextEdit";
import {Selection} from "../util/Selection";

export class LayerTextView extends Layer {
    public static readonly layerName = "text view";

    private map: Map;
    private texts: DrawableText[] = [];
    private layerEdit: LayerTextEdit;

    public constructor(canvas: Canvas) {
        super(LayerTextView.layerName, canvas);
    }

    public load(map: Map, data: Data, folder: string): void {
        this.layerEdit = this.canvas.findLayer(LayerTextEdit.layerName) as LayerTextEdit;

        this.map = map;

        if (data.texts) {
            for (let pack of data.texts) {
                this.texts.push(new DrawableText(pack))
            }
        }

        //listen to mouse click to select text
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private moved = false;
            onmousedown(event: MouseEvent): boolean {
                this.moved = false;
                return false;
            }
            onmouseup(event: MouseEvent): boolean {
                if (event.button == 0 && !this.moved) {
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;
                    for (let text of self.texts) {
                        let pick = text.pick(x, y, self.camera.screenSizeToCanvas(5));
                        if (pick) {
                            Selection.deselectAll();
                            self.layerEdit.startEditingText(text);
                            return true;
                        }
                    }
                    self.layerEdit.finishEditing();
                    return false;
                } else {
                    return false;
                }
            }
            onmousemove(event: MouseEvent): boolean {
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

    public save(data: Data): void {
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
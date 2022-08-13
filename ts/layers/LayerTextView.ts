import {Layer} from "./Layer";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {DrawableText} from "../editable/DrawableText";
import {AnnotationData} from "../data/Annotation";
import {LayerName} from "./Layers";
import {Env} from "../Env";

export class LayerTextView extends Layer {

    private texts: DrawableText[] = [];

    public constructor(canvas: Canvas) {
        super(LayerName.TEXT_VIEW, canvas);
    }

    loadChip(env : Env): void {
    }

    loadData(env : Env): void {
        this.texts = env.texts;
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

    public saveData(data: AnnotationData): void {
        data.texts = [];
        for (const text of this.texts) {
            data.texts.push(text.pack());
        }
    }

    public render(renderer: Renderer): void {
        for (const text of this.texts) {
            text.render(this.canvas, renderer, this.camera);
        }
    }

    public unload(): void {
    }

}

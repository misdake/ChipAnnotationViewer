import {Canvas} from "./Canvas";
import {Camera} from "./Camera";
import {ChipContent} from "./data/Chip";
import {AnnotationData} from "./data/Annotation";
import {DrawablePolyline} from "./editable/DrawablePolyline";
import {DrawableText} from "./editable/DrawableText";
import {Renderer} from "./Renderer";

export class Env {

    //after load

    canvas: Canvas;
    camera: Camera;
    renderer: Renderer;

    loadCanvas(canvas: Canvas, renderer: Renderer) {
        this.canvas = canvas;
        this.camera = canvas.getCamera();
        this.renderer = renderer;
    }

    //after selected map

    chip: ChipContent;
    data: AnnotationData;
    polylines: DrawablePolyline[];
    texts: DrawableText[];

    loadChip(chipContent: ChipContent) {
        this.chip = chipContent;
    }

    loadData(data: AnnotationData) {
        this.data = data;

        this.polylines = [];
        this.texts = [];

        if (data.polylines) {
            for (let pack of data.polylines) {
                this.polylines.push(new DrawablePolyline(pack))
            }
        }
        if (data.texts) {
            for (let pack of data.texts) {
                this.texts.push(new DrawableText(pack))
            }
        }

    }

    addPolyline(polyline: DrawablePolyline, index: number = this.polylines.length): void {
        const bounded = Math.max(0, Math.min(index, this.polylines.length));
        this.polylines.splice(bounded, 0, polyline);
    }

    removePolyline(polyline: DrawablePolyline): boolean {
        const index = this.polylines.indexOf(polyline);
        if (index < 0) return false;
        this.polylines.splice(index, 1);
        return true;
    }

    addText(text: DrawableText, index: number = this.texts.length): void {
        const bounded = Math.max(0, Math.min(index, this.texts.length));
        this.texts.splice(bounded, 0, text);
    }

    removeText(text: DrawableText): boolean {
        const index = this.texts.indexOf(text);
        if (index < 0) return false;
        this.texts.splice(index, 1);
        return true;
    }

}

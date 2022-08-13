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

}

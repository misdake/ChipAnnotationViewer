import {Canvas} from "../Canvas";
import {Camera} from "../Camera";
import {Renderer} from "../Renderer";
import {LayerName} from "./Layers";
import {Env} from "../Env";
import {AnnotationData} from "../data/Annotation";

export abstract class Layer {

    public readonly name: LayerName;

    protected readonly canvas: Canvas;
    protected readonly camera: Camera;

    public constructor(name: LayerName, canvas: Canvas) {
        this.name = name;
        this.canvas = canvas;
        this.camera = canvas.getCamera();
    }

    public abstract loadChip(env: Env): void;

    public abstract loadData(env: Env): void;

    public abstract render(renderer: Renderer): void;

    public abstract unload(): void;

    public saveData(data: AnnotationData): void {

    }
}

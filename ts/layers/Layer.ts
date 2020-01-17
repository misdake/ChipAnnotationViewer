import {Map} from "../data/Map";
import {Canvas} from "../Canvas";
import {Camera} from "../Camera";
import {Renderer} from "../Renderer";
import {Data} from "../data/Data";
import {LayerName} from "./Layers";

export abstract class Layer {

    public readonly name: LayerName;

    protected readonly canvas: Canvas;
    protected readonly camera: Camera;

    public constructor(name: LayerName, canvas: Canvas) {
        this.name = name;
        this.canvas = canvas;
        this.camera = canvas.getCamera();
    }

    public abstract loadMap(map: Map): void;

    public abstract loadData(data: Data): void;

    public abstract render(renderer: Renderer): void;

    public abstract unload(): void;

}

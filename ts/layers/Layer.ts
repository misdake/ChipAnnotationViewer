import {Map} from "../data/Map";
import {Canvas} from "../Canvas";
import {Camera} from "../Camera";
import {Renderer} from "../Renderer";
import {MouseListener} from "../MouseListener";
import {KeyboardListener} from "../KeyboardListener";
import {Data} from "../data/Data";
import {LayerName} from "./Layers";

export class Layer {

    public readonly name: LayerName;

    protected readonly canvas: Canvas;
    protected readonly camera: Camera;

    protected _mouseListener?: MouseListener = null;
    protected _keyboardListener?: KeyboardListener = null;
    get mouseListener(): MouseListener {
        return this._mouseListener;
    }
    get keyboardListener(): KeyboardListener {
        return this._keyboardListener;
    }

    public constructor(name: LayerName, canvas: Canvas) {
        this.name = name;
        this.canvas = canvas;
        this.camera = canvas.getCamera();
    }

    public loadMap(map: Map): void {

    }

    public loadData(data: Data): void {

    }

    public saveData(data: Data): void {

    }

    public render(renderer: Renderer): void {

    }

    public unload(): void {

    }
}

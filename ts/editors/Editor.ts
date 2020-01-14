import {Map} from "../data/Map";
import {Canvas} from "../Canvas";
import {Camera} from "../Camera";
import {Renderer} from "../Renderer";
import {MouseListener} from "../MouseListener";
import {KeyboardListener} from "../KeyboardListener";
import {Data} from "../data/Data";
import {EditorName} from "./Editors";

export class Editor {

    public readonly name: EditorName;

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

    public constructor(name: EditorName, canvas: Canvas) {
        this.name = name;
        this.canvas = canvas;
        this.camera = canvas.getCamera();
    }

    public enter(map: Map, data: Data): void {

    }

    public exit(): void {

    }

    public render(renderer: Renderer): void {

    }

}

import {Content} from "./Content";
import {Canvas} from "./Canvas";
import {Camera} from "./Camera";
import {Renderer} from "./Renderer";
import {MouseListener} from "./MouseListener";
import {KeyboardListener} from "./KeyboardListener";

export class Layer {

    private name: string;
    public renderer?: Renderer;

    protected _mouseListener?: MouseListener;
    protected _keyboardListener?: KeyboardListener;
    get mouseListener(): MouseListener {
        return this._mouseListener;
    }
    get keyboardListener(): KeyboardListener {
        return this._keyboardListener;
    }

    public constructor(name: string) {
        this.name = name;
    }

    public load(canvas: Canvas, content: Content, folder: string): void {

    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {

    }

    public unload(): void {

    }
}
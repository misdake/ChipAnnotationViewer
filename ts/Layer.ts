import {Content} from "./Content";
import {Canvas} from "./Canvas";
import {Camera} from "./Camera";
import {Renderer} from "./Renderer";

export class Layer {
    private name: string;

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
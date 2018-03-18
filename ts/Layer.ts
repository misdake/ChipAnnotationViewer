import {Content} from "./Content";
import {Canvas} from "./Canvas";
import {Camera} from "./Camera";
import {Renderer} from "./Renderer";

export class Layer {
    private name: string;
    private renderOrder: number;

    public constructor(name: string, renderOrder: number) {
        this.name = name;
        this.renderOrder = renderOrder;
    }

    public load(canvas: Canvas, content: Content, folder: string): void {

    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {

    }

    public unload(): void {

    }
}
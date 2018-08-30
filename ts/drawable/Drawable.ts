import {Canvas} from "../Canvas";
import {Camera} from "../Camera";
import {Renderer} from "../Renderer";
import {Transform} from "../util/Transform";

export class Drawable {

    public constructor() {
    }

    public readonly transformation: Transform = new Transform();

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
    }

}
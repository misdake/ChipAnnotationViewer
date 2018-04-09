import {Canvas} from "../Canvas";
import {Camera} from "../Camera";
import {Renderer} from "../Renderer";

export class Drawable {

    public constructor() {
    }

    //TODO
    // x, y, scaleX, scaleY, rotate

    private color: string = null;
    public setColor(color: string): void {
        this.color = color;
    }
    public getColor(): string {
        return this.color;
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        if (this.color) renderer.setColor(this.color)
    }

}
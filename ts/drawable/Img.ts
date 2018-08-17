import {Drawable} from "./Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";

export class Img extends Drawable {

    private readonly img: HTMLImageElement;

    private w: number;
    private h: number;

    public constructor(src: string, x: number, y: number, w: number, h: number, onload: (image: Img) => void) {
        super();
        this.transformation.position.x = x;
        this.transformation.position.y = y;
        this.w = w;
        this.h = h;
        this.img = new Image();
        this.img.src = src;

        let self = this;
        this.img.onload = ev => {
            if (onload) onload(self);
        }
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        renderer.image(camera, this.img, this.transformation, this.w, this.h);
    }

}
import {Drawable} from "./Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";

export class Img extends Drawable {

    private readonly img: HTMLImageElement;
    private x: number;
    private y: number;
    private w: number;
    private h: number;

    public constructor(src: string, x: number, y: number, w: number, h :number, onload: (image: Img) => void) {
        super();
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.img = new Image();
        this.img.src = src;

        var self = this;
        this.img.onload = ev => {
            if (onload) onload(self);
        }
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        renderer.image(camera, this.img, this.x, this.y, this.w, this.h);
    }

}
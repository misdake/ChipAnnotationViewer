import {Drawable} from "./Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";

export class Img extends Drawable {

    private readonly img: HTMLImageElement;

    private readonly w: number;
    private readonly h: number;

    private readonly src: string;
    private loading: boolean;
    private loaded: boolean;

    public constructor(src: string, x: number, y: number, w: number, h: number, onload: (image: Img) => void) {
        super();
        this.transformation.position.x = x;
        this.transformation.position.y = y;
        this.w = w;
        this.h = h;
        this.img = new Image();
        // img.src is not set, will be set and image will start loading once it is visible to camera.

        this.src = src;
        this.loaded = false;

        let self = this;
        this.img.onload = ev => {
            this.loaded = true;
            if (onload) onload(self);
        }
    }

    private loadIfNotLoaded() {
        if (!this.loading) {
            this.loading = true;
            this.img.src = this.src;
        }
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera) {
        let rect = renderer.testImageVisibility(camera, this.img, this.transformation, this.w, this.h, 100);
        if (rect) {
            this.loadIfNotLoaded();
            if (this.loaded) {
                renderer.drawImage(this.img, rect);
            }
        }
    }

}
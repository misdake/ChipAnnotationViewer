import { Drawable } from './Drawable';
import { Canvas } from '../Canvas';
import { Renderer } from '../Renderer';
import { Camera } from '../Camera';
import { Transform } from '../util/Transform';
import { LRU } from '../util/LRU';

class ImageCacheItem {
    private _img: HTMLImageElement = undefined;
    private _loaded: boolean = false;

    public static onloaded: () => void;

    static load(src: string): ImageCacheItem {
        let r = new ImageCacheItem();
        r._img = new Image();
        r._img.src = src;
        r._loaded = false;
        r._img.onload = () => {
            r._loaded = true;
            if (ImageCacheItem.onloaded) {
                ImageCacheItem.onloaded();
            }
        };
        return r;
    }

    get img(): HTMLImageElement {
        return this._img;
    }

    get loaded(): boolean {
        return this._loaded;
    }

    unloadIfNotLoaded() {
        if (!this._loaded) {
            imageCache.remove(this._img.src);
            this._img.src = '';
        }
    }
}

const imageCache = new LRU<string, ImageCacheItem>(100);
const createImage = (src: string) => {
    return ImageCacheItem.load(src);
};

export class DrawableImage implements Drawable {

    private img: ImageCacheItem;

    private readonly w: number;
    private readonly h: number;
    private readonly transformation: Transform = new Transform();

    private readonly src: string;

    public constructor(src: string, x: number, y: number, w: number, h: number, onload: (image: DrawableImage) => void) {
        this.transformation.position.x = x;
        this.transformation.position.y = y;
        this.w = w;
        this.h = h;

        ImageCacheItem.onloaded = () => onload(this);
        this.src = src;
    }

    private loadIfNotLoaded() {
        if (!this.img) {
            this.img = imageCache.getOrInsert(this.src, createImage);
        }
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        let rect = renderer.testImageVisibility(camera, this.transformation, this.w, this.h, 100);
        if (rect) {
            this.loadIfNotLoaded();
            if (this.img && this.img.loaded) {
                renderer.drawImage(this.img.img, rect);
            }
        }
    }

    public unloadIfNotCached() {
        if (this.img) {
            this.img.unloadIfNotLoaded();
        }
    }

}

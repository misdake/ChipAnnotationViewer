import { Renderer } from '../Renderer';
import { LRU } from '../util/LRU';
import { ScreenRect } from '../util/ScreenRect';

export class ImageCacheItem {
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

export const imageCache = new LRU<string, ImageCacheItem>(100);
const createImage = (src: string) => {
    return ImageCacheItem.load(src);
};

export class DrawableImage {

    private img: ImageCacheItem;
    private readonly src: string;

    public constructor(src: string, onload: (image: DrawableImage) => void) {
        ImageCacheItem.onloaded = () => onload(this);
        this.src = src;
    }

    private loadIfNotLoaded() {
        if (!this.img) {
            this.img = imageCache.getOrInsert(this.src, createImage);
        }
    }

    public isLoaded(): boolean {
        return this.img !== undefined && this.img.loaded;
    }

    public render(renderer: Renderer, rect: ScreenRect): void {
        this.loadIfNotLoaded();
        if (this.img && this.img.loaded) {
            renderer.drawImage(this.img.img, rect);
        }
    }

    public unloadIfNotCached() {
        if (this.img) {
            this.img.unloadIfNotLoaded();
        }
    }

}

import { Layer } from './Layer';
import { Camera } from '../Camera';
import { Canvas } from '../Canvas';
import { ChipContent } from '../data/Chip';
import { Renderer } from '../Renderer';
import { DrawableImage, ImageCacheItem, imageCache } from '../drawable/DrawableImage';
import { LayerName } from './Layers';
import { Env } from '../Env';
import { ScreenRect } from '../util/ScreenRect';

export class LayerImage extends Layer {

    private chip: ChipContent;
    private maxLevel: number;
    private baseFolder: string; // without final '/'

    public constructor(canvas: Canvas) {
        super(LayerName.IMAGE, canvas);
    }

    public loadChip(env: Env): void {
        let chip = env.chip;
        this.chip = chip;
        this.maxLevel = chip.maxLevel;

        const stripTrailingSlash = (input: string) => input ? input.replace(/\/+$/, '') : '';
        this.baseFolder = stripTrailingSlash(chip.baseUrl);
        this.currentZoom = -1;

        let topLevel = chip.levels[this.maxLevel];
        for (let i = 0; i < topLevel.xMax; i++) {
            for (let j = 0; j < topLevel.yMax; j++) {
                let src = `${this.baseFolder}/${this.maxLevel}/${i}_${j}.jpg`;
                imageCache.getOrInsert(src, () => ImageCacheItem.load(src));
            }
        }
    }

    loadData(env: Env): void {
    }

    private currentZoom: number;
    private xCount: number;
    private yCount: number;
    private imageMatrix: DrawableImage[][];
    private xVertices: number[] = [];
    private yVertices: number[] = [];

    private prepare(camera: Camera, canvas: Canvas) {
        if (!this.chip) return;

        let zoom = camera.getTileLevel();

        if (this.currentZoom === zoom) return;
        this.currentZoom = zoom;

        if (this.imageMatrix) {
            for (let line of this.imageMatrix) {
                for (let image of line) {
                    image.unloadIfNotCached();
                }
            }
        }

        let levelData = this.chip.levels[zoom];
        this.xCount = levelData.xMax;
        this.yCount = levelData.yMax;
        this.xVertices.length = this.xCount + 1;
        this.yVertices.length = this.yCount + 1;
        this.imageMatrix = [];
        for (let i = 0; i < this.xCount; i++) {
            this.imageMatrix[i] = [];
            for (let j = 0; j < this.yCount; j++) {
                this.imageMatrix[i][j] = new DrawableImage(
                    `${this.baseFolder}/${zoom}/${i}_${j}.jpg`,
                    _ => canvas.requestRender(),
                );
            }
        }
    }

    private updateScreenVertices(vertices: number[], count: number, targetSize: number, horizontal: boolean): void {
        for (let i = 0; i <= count; i++) {
            let point = horizontal
                ? this.camera.canvasToScreen(i * targetSize, 0)
                : this.camera.canvasToScreen(0, i * targetSize);
            vertices[i] = horizontal ? Math.round(point.x) : Math.round(point.y);
        }
    }

    private isVisible(rect: ScreenRect, range: number): boolean {
        if (rect.left - range > this.canvas.getWidth() || rect.top - range > this.canvas.getHeight()) return false;
        if (rect.left + rect.width + range < 0 || rect.top + rect.height + range < 0) return false;
        return true;
    }

    public render(renderer: Renderer): void {
        this.prepare(this.camera, this.canvas);
        if (!this.imageMatrix) return;

        let targetSize = this.chip.tileSize * Math.pow(2, this.currentZoom);
        this.updateScreenVertices(this.xVertices, this.xCount, targetSize, true);
        this.updateScreenVertices(this.yVertices, this.yCount, targetSize, false);

        for (let i = 0; i < this.xCount; i++) {
            for (let j = 0; j < this.yCount; j++) {
                let destRect = new ScreenRect(
                    this.xVertices[i],
                    this.yVertices[j],
                    this.xVertices[i + 1] - this.xVertices[i],
                    this.yVertices[j + 1] - this.yVertices[j],
                );
                if (!this.isVisible(destRect, 100)) continue;

                let tile = this.imageMatrix[i][j];
                tile.render(renderer, destRect);
                if (!tile.isLoaded() && this.isVisible(destRect, 0)) {
                    this.renderFallbackTile(renderer, i, j, destRect);
                }
            }
        }
    }

    private renderFallbackTile(renderer: Renderer, tileX: number, tileY: number, destRect: ScreenRect) {
        let zoom = this.currentZoom;

        for (let k = 1; zoom + k <= this.maxLevel; k++) {
            let fallbackZoom = zoom + k;
            let scale = Math.pow(2, k);
            let parentX = Math.floor(tileX / scale);
            let parentY = Math.floor(tileY / scale);

            let src = `${this.baseFolder}/${fallbackZoom}/${parentX}_${parentY}.jpg`;
            let cached = imageCache.getOrInsert(src, () => ImageCacheItem.load(src));
            if (cached && cached.loaded) {
                let srcTileX = tileX - parentX * scale;
                let srcTileY = tileY - parentY * scale;
                let srcPixelSize = this.chip.tileSize / scale;

                let sx = srcTileX * srcPixelSize;
                let sy = srcTileY * srcPixelSize;
                let sw = srcPixelSize;
                let sh = srcPixelSize;

                renderer.drawCroppedImage(cached.img, sx, sy, sw, sh, destRect.left, destRect.top, destRect.width, destRect.height);
                return;
            }
        }
    }

    public unload(): void {

    }

}

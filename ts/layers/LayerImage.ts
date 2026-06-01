import { Layer } from './Layer';
import { Camera } from '../Camera';
import { Canvas } from '../Canvas';
import { ChipContent } from '../data/Chip';
import { Renderer } from '../Renderer';
import { DrawableImage, ImageCacheItem, imageCache } from '../drawable/DrawableImage';
import { LayerName } from './Layers';
import { Env } from '../Env';
import { Transform } from '../util/Transform';

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

        let targetSize = this.chip.tileSize * Math.pow(2, zoom);

        let levelData = this.chip.levels[zoom];
        this.xCount = levelData.xMax;
        this.yCount = levelData.yMax;
        this.imageMatrix = [];
        for (let i = 0; i < this.xCount; i++) {
            this.imageMatrix[i] = [];
            for (let j = 0; j < this.yCount; j++) {
                this.imageMatrix[i][j] = new DrawableImage(
                    `${this.baseFolder}/${zoom}/${i}_${j}.jpg`,
                    i * targetSize, j * targetSize,
                    targetSize, targetSize,
                    _ => {
                        canvas.requestRender();
                    },
                );
            }
        }
    }

    public render(renderer: Renderer): void {
        this.prepare(this.camera, this.canvas);

        if (this.imageMatrix) {
            for (let i = 0; i < this.xCount; i++) {
                for (let j = 0; j < this.yCount; j++) {
                    let tile = this.imageMatrix[i][j];
                    tile.render(this.canvas, renderer, this.camera);
                    if (!tile.isLoaded()) {
                        this.renderFallbackTile(renderer, i, j);
                    }
                }
            }
        }
    }

    private renderFallbackTile(renderer: Renderer, tileX: number, tileY: number) {
        let zoom = this.currentZoom;
        let targetSize = this.chip.tileSize * Math.pow(2, zoom);
        let canvasX = tileX * targetSize;
        let canvasY = tileY * targetSize;

        let transform = new Transform();
        transform.position.x = canvasX;
        transform.position.y = canvasY;
        let destRect = renderer.testImageVisibility(this.camera, transform, targetSize, targetSize, 0);
        if (!destRect) return;

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

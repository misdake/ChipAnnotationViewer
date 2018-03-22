import {Layer} from "../Layer";
import {Camera} from "../Camera";
import {Canvas} from "../Canvas";
import {Content} from "../Content";
import {Renderer} from "../Renderer";

export class LayerImage extends Layer {
    private content: Content;
    private maxLevel: number;
    private baseFolder: string;

    public constructor() {
        super("image", 0);
    }

    public load(canvas: Canvas, content: Content, folder: string): void {
        super.load(canvas, content, folder);
        this.content = content;
        this.maxLevel = content.maxLevel;
        this.baseFolder = folder;
        this.currentZoom = -1;
    }

    private currentZoom: number;
    private xCount: number;
    private yCount: number;
    private imageMatrix: HTMLImageElement[][];

    private prepare(camera: Camera, canvas: Canvas) {
        let zoom = camera.getZoom();

        if (this.currentZoom === zoom) return;
        this.currentZoom = zoom;

        let levelData = this.content.levels[zoom];
        this.xCount = levelData.xMax;
        this.yCount = levelData.yMax;
        this.imageMatrix = [];
        for (let i = 0; i < this.xCount; i++) {
            this.imageMatrix[i] = [];
            for (let j = 0; j < this.yCount; j++) {
                const image = new Image();
                image.src = this.baseFolder + "/" + zoom + "/" + i + "_" + j + ".jpg";
                this.imageMatrix[i][j] = image;
                image.onload = (event) => canvas.requestRender();
            }
        }
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        super.render(canvas, renderer, camera);

        let zoom = camera.getZoom();
        let targetSize = this.content.tileSize << zoom;

        this.prepare(camera, canvas);

        let dx = canvas.getWidth() / 2 - camera.getX();
        let dy = canvas.getHeight() / 2 - camera.getY();

        if (this.imageMatrix) {
            for (let i = 0; i < this.xCount; i++) {
                for (let j = 0; j < this.yCount; j++) {
                    if (this.imageMatrix[i][j] && this.imageMatrix[i][j].complete) {
                        renderer.image(this.imageMatrix[i][j], i * targetSize + dx, j * targetSize + dy, targetSize, targetSize);
                    }
                }
            }
        }
    }

    public unload(): void {
        super.unload();
    }
}
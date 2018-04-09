import {Layer} from "../Layer";
import {Camera} from "../Camera";
import {Canvas} from "../Canvas";
import {Content} from "../Content";
import {Renderer} from "../Renderer";
import {Img} from "../drawable/Img";

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
    private imageMatrix: Img[][];

    private prepare(camera: Camera, canvas: Canvas) {
        let zoom = camera.getZoom();

        if (this.currentZoom === zoom) return;
        this.currentZoom = zoom;

        let targetSize = this.content.tileSize << zoom;

        let levelData = this.content.levels[zoom];
        this.xCount = levelData.xMax;
        this.yCount = levelData.yMax;
        this.imageMatrix = [];
        for (let i = 0; i < this.xCount; i++) {
            this.imageMatrix[i] = [];
            for (let j = 0; j < this.yCount; j++) {
                this.imageMatrix[i][j] = new Img(
                    this.baseFolder + "/" + zoom + "/" + i + "_" + j + ".jpg",
                    i * targetSize, j * targetSize,
                    targetSize, targetSize,
                    image => {
                        canvas.requestRender();
                    }
                );
            }
        }
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        super.render(canvas, renderer, camera);

        this.prepare(camera, canvas);

        if (this.imageMatrix) {
            for (let i = 0; i < this.xCount; i++) {
                for (let j = 0; j < this.yCount; j++) {
                    this.imageMatrix[i][j].render(canvas, renderer, camera);
                }
            }
        }
    }

    public unload(): void {
        super.unload();
    }
}
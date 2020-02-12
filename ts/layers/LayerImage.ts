import {Layer} from "./Layer";
import {Camera} from "../Camera";
import {Canvas} from "../Canvas";
import {Map} from "../data/Map";
import {Renderer} from "../Renderer";
import {DrawableImage} from "../drawable/DrawableImage";
import {LayerName} from "./Layers";
import {Env} from "../Env";

export class LayerImage extends Layer {

    private map: Map;
    private maxLevel: number;
    private baseFolder: string;

    public constructor(canvas: Canvas) {
        super(LayerName.IMAGE, canvas);
    }

    public loadMap(env: Env): void {
        let map = env.map;
        this.map = map;
        this.maxLevel = map.maxLevel;

        let split = map.githubRepo.indexOf('/');
        let username = map.githubRepo.substring(0, split);
        let repo = map.githubRepo.substring(split + 1);
        this.baseFolder = `https://${username}.github.io/${repo}/` + this.map.name;
        this.currentZoom = -1;
    }

    loadData(env: Env): void {
    }

    private currentZoom: number;
    private xCount: number;
    private yCount: number;
    private imageMatrix: DrawableImage[][];

    private prepare(camera: Camera, canvas: Canvas) {
        let zoom = camera.getZoom();

        if (this.currentZoom === zoom) return;
        this.currentZoom = zoom;

        let targetSize = this.map.tileSize << zoom;

        let levelData = this.map.levels[zoom];
        this.xCount = levelData.xMax;
        this.yCount = levelData.yMax;
        this.imageMatrix = [];
        for (let i = 0; i < this.xCount; i++) {
            this.imageMatrix[i] = [];
            for (let j = 0; j < this.yCount; j++) {
                this.imageMatrix[i][j] = new DrawableImage(
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

    public render(renderer: Renderer): void {
        this.prepare(this.camera, this.canvas);

        if (this.imageMatrix) {
            for (let i = 0; i < this.xCount; i++) {
                for (let j = 0; j < this.yCount; j++) {
                    this.imageMatrix[i][j].render(this.canvas, renderer, this.camera);
                }
            }
        }
    }

    public unload(): void {

    }

}

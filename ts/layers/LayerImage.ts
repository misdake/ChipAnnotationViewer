import {Layer} from "../Layer";
import {Camera} from "../Camera";
import {Canvas} from "../Canvas";
import {Content} from "../Content";
import {Renderer} from "../Renderer";
import {DrawableImage} from "../drawable/DrawableImage";
import {MouseListener} from "../MouseListener";

export class LayerImage extends Layer {
    private content: Content;
    private maxLevel: number;
    private baseFolder: string;

    public constructor(canvas: Canvas) {
        super("image", canvas);
    }

    public load(canvas: Canvas, content: Content, folder: string): void {
        super.load(canvas, content, folder);
        this.content = content;
        this.maxLevel = content.maxLevel;
        this.baseFolder = folder;
        this.currentZoom = -1;

        this._mouseListener = new class extends MouseListener {
            private lastX = -1;
            private lastY = -1;
            onwheel(event: MouseWheelEvent): boolean {
                let camera = canvas.getCamera();
                camera.action();
                let point1 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                camera.changeZoomBy(event.wheelDelta > 0 ? -1 : 1);
                camera.action();
                let point2 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                let dx = point1.x - point2.x;
                let dy = point1.y - point2.y;
                camera.moveXy(dx, dy);
                canvas.requestRender();
                return true;
            }
            onmousedown(event: MouseEvent): boolean {
                this.lastX = event.offsetX;
                this.lastY = event.offsetY;
                return true;
            }
            onmousemove(event: MouseEvent): boolean {
                if (event.buttons > 0) {
                    let camera = canvas.getCamera();
                    camera.action();
                    let point1 = camera.screenXyToCanvas(this.lastX, this.lastY);
                    let point2 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let dx = point1.x - point2.x;
                    let dy = point1.y - point2.y;
                    camera.moveXy(dx, dy);
                    this.lastX = event.offsetX;
                    this.lastY = event.offsetY;
                    canvas.requestRender();
                    return true;
                } else {
                    return false;
                }
            }
        };
    }

    private currentZoom: number;
    private xCount: number;
    private yCount: number;
    private imageMatrix: DrawableImage[][];

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
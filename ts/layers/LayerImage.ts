import {Layer} from "./Layer";
import {Camera} from "../Camera";
import {Canvas} from "../Canvas";
import {Map} from "../data/Map";
import {Renderer} from "../Renderer";
import {DrawableImage} from "../drawable/DrawableImage";
import {MouseIn, MouseListener, WheelIn} from "../MouseListener";
import {Ui} from "../util/Ui";
import {Selection} from "./Selection";
import {LayerName} from "./Layers";

export class LayerImage extends Layer {

    private static readonly HINT_ELEMENT_ID = "hint";
    private static readonly HINT_VIEW =
        "1. hold mouse button to drag<br>" +
        "2. left click polygon/text to select<br>" +
        "3. mouse wheel to zoom<br>";

    private map: Map;
    private maxLevel: number;
    private baseFolder: string;

    public constructor(canvas: Canvas) {
        super(LayerName.IMAGE, canvas);
        Selection.register(null, null, () => {
            Ui.setContent(LayerImage.HINT_ELEMENT_ID, LayerImage.HINT_VIEW);
        });
        Ui.setContent(LayerImage.HINT_ELEMENT_ID, LayerImage.HINT_VIEW);
    }

    public loadMap(map: Map): void {
        this.map = map;
        this.maxLevel = map.maxLevel;

        let split = map.githubRepo.indexOf('/');
        let username = map.githubRepo.substring(0, split);
        let repo = map.githubRepo.substring(split + 1);
        this.baseFolder = `https://${username}.github.io/${repo}/` + this.map.name;
        this.currentZoom = -1;

        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down = false;
            private lastX = -1;
            private lastY = -1;
            private lastPanX = -1;
            private lastPanY = -1;
            onwheel(event: WheelIn): boolean {
                let camera = self.canvas.getCamera();
                camera.action();
                let offsetX = event.offsetX;
                let offsetY = event.offsetY;
                let point1 = camera.screenXyToCanvas(offsetX, offsetY);
                camera.changeZoomBy(event.deltaY > 0 ? 1 : -1);
                camera.action();
                let point2 = camera.screenXyToCanvas(offsetX, offsetY);
                let dx = point1.x - point2.x;
                let dy = point1.y - point2.y;
                camera.moveXy(dx, dy);
                self.canvas.requestRender();
                return true;
            }
            onmousedown(event: MouseIn): boolean {
                this.down = true;
                this.lastX = event.offsetX;
                this.lastY = event.offsetY;
                return true;
            }
            onmouseup(event: MouseIn): boolean {
                this.down = false;
                return true;
            }
            onmousemove(event: MouseIn): boolean {
                if (this.down && event.buttons > 0) {
                    let camera = self.canvas.getCamera();
                    camera.action();
                    let offsetX = event.offsetX;
                    let offsetY = event.offsetY;
                    let point1 = camera.screenXyToCanvas(this.lastX, this.lastY);
                    let point2 = camera.screenXyToCanvas(offsetX, offsetY);
                    let dx = point1.x - point2.x;
                    let dy = point1.y - point2.y;
                    camera.moveXy(dx, dy);
                    this.lastX = offsetX;
                    this.lastY = offsetY;
                    self.canvas.requestRender();
                    return true;
                } else {
                    return false;
                }
            }
            onpan(event: HammerInput): boolean {
                let dx = event.deltaX - this.lastPanX;
                let dy = event.deltaY - this.lastPanY;
                let camera = self.canvas.getCamera();
                let scale = camera.screenSizeToCanvas(1);
                camera.moveXy(-dx * scale, -dy * scale);
                self.canvas.requestRender();
                this.lastPanX = event.deltaX;
                this.lastPanY = event.deltaY;
                if (event.isFinal) {
                    this.lastPanX = 0;
                    this.lastPanY = 0;
                }
                return true;
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
        super.unload();
    }
}

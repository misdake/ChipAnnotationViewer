import {Layer} from "../Layer";
import {Camera} from "../Camera";
import {Canvas} from "../Canvas";
import {Map} from "../data/Map";
import {Renderer} from "../Renderer";
import {DrawableImage} from "../drawable/DrawableImage";
import {MouseListener} from "../MouseListener";
import {Ui} from "../util/Ui";
import {Selection} from "./Selection";
import {Names} from "./Names";

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
        super(Names.IMAGE, canvas);
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

        let imageSource = document.getElementById("imageSource") as HTMLLinkElement;
        Ui.setVisibility("imageSource", !!map.source, "inline");
        if (map.source) {
            imageSource.href = map.source;
            imageSource.innerHTML = map.source;
        }

        Ui.bindButtonOnClick("buttonZoomIn", () => {
            this.camera.changeZoomBy(-1);
            this.camera.action();
            this.canvas.requestRender();
        });
        Ui.bindButtonOnClick("buttonZoomOut", () => {
            this.camera.changeZoomBy(1);
            this.camera.action();
            this.canvas.requestRender();
        });

        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down = false;
            private lastX = -1;
            private lastY = -1;
            onwheel(event: WheelEvent): boolean {
                let camera = self.canvas.getCamera();
                camera.action();
                let point1 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                camera.changeZoomBy(event.deltaY > 0 ? 1 : -1);
                camera.action();
                let point2 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                let dx = point1.x - point2.x;
                let dy = point1.y - point2.y;
                camera.moveXy(dx, dy);
                self.canvas.requestRender();
                return true;
            }
            onmousedown(event: MouseEvent): boolean {
                this.down = true;
                this.lastX = event.offsetX;
                this.lastY = event.offsetY;
                return true;
            }
            onmouseup(event: MouseEvent): boolean {
                this.down = false;
                return true;
            }
            onmousemove(event: MouseEvent): boolean {
                if (this.down && event.buttons > 0) {
                    let camera = self.canvas.getCamera();
                    camera.action();
                    let point1 = camera.screenXyToCanvas(this.lastX, this.lastY);
                    let point2 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let dx = point1.x - point2.x;
                    let dy = point1.y - point2.y;
                    camera.moveXy(dx, dy);
                    this.lastX = event.offsetX;
                    this.lastY = event.offsetY;
                    self.canvas.requestRender();
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

        let density = this.camera.screenSizeToCanvas(1);
        Ui.setContent("textZoomInfo", (density > 1 ? "1/" : "") + density + "x");

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

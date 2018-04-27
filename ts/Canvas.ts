import {Layer} from "./Layer";
import {Content} from "./Content";
import {Renderer} from "./Renderer";
import {Camera} from "./Camera";

export class Canvas {
    private readonly domElement: HTMLElement;
    private readonly canvasElement: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly renderer: Renderer;
    private readonly camera: Camera;

    private width: number;
    private height: number;

    public constructor(domElement: HTMLElement, id: string) {
        this.domElement = domElement;
        this.domElement.innerHTML = "<canvas id=\"" + id + "\" style='width:100%;height:100%;overflow:hidden;position:absolute'></canvas>";
        this.canvasElement = document.getElementById(id) as HTMLCanvasElement;
        this.context = this.canvasElement.getContext("2d");
        this.camera = new Camera();
        this.renderer = new Renderer(this, this.canvasElement, this.context);

        this.width = this.canvasElement.clientWidth;
        this.height = this.canvasElement.clientHeight;

        let self = this;
        window.addEventListener('resize', function () {
            self.requestRender();
        })
    }

    public init() {
        this.layers = [];
        let self = this;

        this.canvasElement.onmousewheel = event => {
            self.camera.action();
            let point1 = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
            self.camera.changeZoomBy(event.wheelDelta > 0 ? -1 : 1);
            self.camera.action();
            let point2 = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
            let dx = point1.x - point2.x;
            let dy = point1.y - point2.y;
            self.camera.moveXy(dx, dy);
            self.requestRender();
        };

        let lastX = -1;
        let lastY = -1;
        this.canvasElement.onmousedown = event => {
            lastX = event.offsetX;
            lastY = event.offsetY;
        };
        this.canvasElement.onmousemove = event => {
            if (event.buttons > 0) {
                self.camera.action();
                let point1 = self.camera.screenXyToCanvas(lastX, lastY);
                let point2 = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                let dx = point1.x - point2.x;
                let dy = point1.y - point2.y;
                self.camera.moveXy(dx, dy);
                lastX = event.offsetX;
                lastY = event.offsetY;
                self.requestRender();
            }
        };
    }

    private layers: Layer[];

    public addLayer(layer: Layer) {
        this.layers.push(layer);
    }

    public getLayer() {
        //TODO
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    private renderNext = false;
    public requestRender() {
        if (this.renderNext) return;
        this.renderNext = true;
        let self = this;
        requestAnimationFrame(function () {
            self.renderNext = false;
            self.render();
        })
    }

    public load(content: Content, folder: string) {
        this.camera.load(this, content);
        for (let layer of this.layers) {
            layer.load(this, content, folder);
        }
    }

    public render() {
        this.width = this.canvasElement.clientWidth;
        this.height = this.canvasElement.clientHeight;
        if (this.canvasElement.width !== this.width) this.canvasElement.width = this.width;
        if (this.canvasElement.height !== this.height) this.canvasElement.height = this.height;

        this.camera.action();

        this.renderer.clear();
        for (let layer of this.layers) {
            layer.render(this, this.renderer, this.camera);
        }
    }
}

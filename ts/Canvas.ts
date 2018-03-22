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
        this.renderer = new Renderer(this, this.canvasElement, this.context);
        this.camera = new Camera();

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
            self.camera.changeZoomBy(event.wheelDelta > 0 ? -1 : 1);
            self.requestRender();
        };

        let lastX = -1;
        let lastY = -1;
        this.canvasElement.onmousedown = event => {
            lastX = event.clientX;
            lastY = event.clientY;
        };
        this.canvasElement.onmousemove = event => {
            if (event.which > 0) {
                let dx = (lastX - event.clientX) << this.camera.getZoom();
                let dy = (lastY - event.clientY) << this.camera.getZoom();
                this.camera.move(dx, dy);
                lastX = event.clientX;
                lastY = event.clientY;
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

    public requestRender() {
        let self = this;
        requestAnimationFrame(function () {
            self.render();
        })
    }

    public load(content: Content, folder: string) {
        this.camera.load(content);
        for (let layer of this.layers) {
            layer.load(this, content, folder);
        }
    }

    public render() {
        this.width = this.canvasElement.clientWidth;
        this.height = this.canvasElement.clientHeight;
        if (this.canvasElement.width !== this.width) this.canvasElement.width = this.width;
        if (this.canvasElement.height !== this.height) this.canvasElement.height = this.height;

        this.renderer.begin(this.camera);
        for (let layer of this.layers) {
            layer.render(this, this.renderer, this.camera);
        }
    }
}

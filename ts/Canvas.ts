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
        this.domElement.innerHTML = "<canvas id=\"" + id + "\" style='width:100%;height:100%;overflow:hidden'></canvas>";
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

    public getCamera(): Camera {
        return this.camera;
    }

    public init(): void {
        this.layers = [];

        this.canvasElement.onclick = event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onclick(event)) break;
            }
        };
        this.canvasElement.ondblclick = event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.ondblclick(event)) break;
            }
        };
        this.canvasElement.onwheel = event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onwheel(event)) break;
            }
        };
        this.canvasElement.onmousedown = event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onmousedown(event)) break;
            }
        };
        this.canvasElement.onmouseup = event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onmouseup(event)) break;
            }
        };
        this.canvasElement.onmousemove = event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onmousemove(event)) break;
            }
        };
        this.canvasElement.onmouseout = event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onmouseout(event)) break;
            }
        };

        this.canvasElement.onkeydown = event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.keyboardListener && layer.keyboardListener.onkeydown(event)) break;
            }
        };
        this.canvasElement.onkeyup = event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.keyboardListener && layer.keyboardListener.onkeyup(event)) break;
            }
        };
        this.canvasElement.onkeypress = event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.keyboardListener && layer.keyboardListener.onkeypress(event)) break;
            }
        };
    }

    private layers: Layer[];

    public addLayer(layer: Layer): void {
        this.layers.push(layer);
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    private renderNext = false;
    public requestRender(): void {
        if (this.renderNext) return;
        this.renderNext = true;
        let self = this;
        requestAnimationFrame(function () {
            self.renderNext = false;
            self.render();
        })
    }

    public load(content: Content, folder: string): void {
        this.camera.load(this, content);
        for (let layer of this.layers) {
            layer.load(content, folder);
        }
    }

    public render(): void {
        this.width = this.canvasElement.clientWidth;
        this.height = this.canvasElement.clientHeight;
        if (this.canvasElement.width !== this.width) this.canvasElement.width = this.width;
        if (this.canvasElement.height !== this.height) this.canvasElement.height = this.height;

        this.camera.action();

        this.renderer.clear();
        for (let layer of this.layers) {
            layer.render(this.renderer);
        }
    }
}

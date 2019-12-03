import {Layer} from "./Layer";
import {Map} from "./data/Map";
import {Renderer} from "./Renderer";
import {Camera} from "./Camera";
import {Data} from "./data/Data";
import {Ui} from "./util/Ui";
import "hammerjs";
import {html, render} from "lit-html";
import "elements/ZoomElement"

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
        this.domElement.innerHTML += "<canvas id=\"" + id + "\" tabindex='0' style='width:100%;height:100%;overflow:hidden;display:inline-block;'></canvas>";

        this.domElement.oncontextmenu = function (ev) {
            return false; //disable context menu
        };

        this.canvasElement = document.getElementById(id) as HTMLCanvasElement;
        this.context = this.canvasElement.getContext("2d");
        this.camera = new Camera();
        this.renderer = new Renderer(this, this.canvasElement, this.context);

        this.width = this.canvasElement.clientWidth;
        this.height = this.canvasElement.clientHeight;

        let self = this;
        window.addEventListener('resize', function () {
            self.requestRender();
        });
    }

    public getCamera(): Camera {
        return this.camera;
    }

    public init(): void {
        this.layers = [];

        let convertMouseEvent = (event: MouseEvent) => {
            return {
                button: event.button,
                buttons: event.buttons,
                offsetX: event.offsetX * window.devicePixelRatio,
                offsetY: event.offsetY * window.devicePixelRatio,
                movementX: event.movementX * window.devicePixelRatio,
                movementY: event.movementY * window.devicePixelRatio,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
            }
        };
        let convertWheelEvent = (event: WheelEvent) => {
            return {
                button: event.button,
                buttons: event.buttons,
                offsetX: event.offsetX * window.devicePixelRatio,
                offsetY: event.offsetY * window.devicePixelRatio,
                movementX: event.movementX * window.devicePixelRatio,
                movementY: event.movementY * window.devicePixelRatio,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                deltaX: event.deltaX,
                deltaY: event.deltaY,
            }
        };

        this.canvasElement.onclick = event => {
            let e = convertMouseEvent(event);
            this.canvasElement.focus();
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onclick(e)) break;
            }
        };
        this.canvasElement.ondblclick = event => {
            let e = convertMouseEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.ondblclick(e)) break;
            }
        };
        this.canvasElement.onwheel = event => {
            let e = convertWheelEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onwheel(e)) break;
            }
        };
        this.canvasElement.onmousedown = event => {
            let e = convertMouseEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onmousedown(e)) break;
            }
        };
        this.canvasElement.onmouseup = event => {
            let e = convertMouseEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onmouseup(e)) break;
            }
        };
        this.canvasElement.onmousemove = event => {
            let e = convertMouseEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onmousemove(e)) break;
            }
        };
        this.canvasElement.onmouseout = event => {
            let e = convertMouseEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.mouseListener && layer.mouseListener.onmouseout(e)) break;
            }
        };

        this.canvasElement.onkeydown = event => {
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.keyboardListener && layer.keyboardListener.onkeydown(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    break;
                }
            }
        };
        this.canvasElement.onkeyup = event => {
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.keyboardListener && layer.keyboardListener.onkeyup(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    break;
                }
            }
        };
        this.canvasElement.onkeypress = event => {
            let length = this.layers.length;
            for (let i = length - 1; i >= 0; i--) {
                let layer = this.layers[i];
                if (layer.keyboardListener && layer.keyboardListener.onkeypress(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    break;
                }
            }
        };

        if (Ui.isMobile()) {
            let hammer = new Hammer(this.canvasElement);
            hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
            hammer.on("pan", (event: HammerInput) => {
                event.deltaX *= window.devicePixelRatio;
                event.deltaY *= window.devicePixelRatio;
                event.preventDefault();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onpan(event)) break;
                }
            });
        }

        render(html`<zoom-element .canvas="${this}" .camera="${this.camera}"></zoom-element>`, document.getElementById("cameraPanel"));
    }

    private layers: Layer[];

    public addLayer(layer: Layer): void {
        this.layers.push(layer);
    }

    public findLayer(name: string): Layer {
        for (const layer of this.layers) {
            if (layer.name == name) {
                return layer;
            }
        }
        return null;
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

    private map: Map = null;
    private data: Data = null;
    public loadMap(map: Map): void {
        if (!this.map || this.map.name != map.name) {
            this.camera.load(this, map);
            for (let layer of this.layers) {
                layer.loadMap(map);
            }
        }
        this.map = map;
    }
    public loadData(data: Data): void {
        if (this.data != data) {
            for (let layer of this.layers) {
                layer.loadData(data);
            }
        }
        this.data = data;
    }

    public save(): Data {
        let data = new Data();
        for (let layer of this.layers) {
            layer.saveData(data);
        }
        return data;
    }

    public render(): void {
        this.width = this.canvasElement.clientWidth * window.devicePixelRatio;
        this.height = this.canvasElement.clientHeight * window.devicePixelRatio;
        if (this.canvasElement.width !== this.width) this.canvasElement.width = this.width;
        if (this.canvasElement.height !== this.height) this.canvasElement.height = this.height;

        this.camera.action();

        this.renderer.clear();
        for (let layer of this.layers) {
            layer.render(this.renderer);
        }
        for (let callback of this.afterRenderList) {
            callback();
        }
    }

    private afterRenderList: (() => void)[] = [];
    public registerAfterRender(callback: () => void) {
        if (callback) this.afterRenderList.push(callback);
    }
}

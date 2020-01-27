import {Layer} from "./layers/Layer";
import {Map} from "./data/Map";
import {Renderer} from "./Renderer";
import {Camera} from "./Camera";
import {Data} from "./data/Data";
import {Ui} from "./util/Ui";
import "hammerjs";
import {html, render} from "lit-html";
import "elements/ZoomElement"
import {LayerName} from "./layers/Layers";
import {Editor} from "./editors/Editor";
import {EditorName} from "./editors/Editors";
import {Env} from "./Env";

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

        this.env.loadCanvas(this);

        window.addEventListener('resize', () => {
            this.requestRender();
        });
    }

    public getCamera(): Camera {
        return this.camera;
    }

    public init(): void {
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
            let length = this.currentEditors.length;
            for (let i = length - 1; i >= 0; i--) {
                let editor = this.currentEditors[i];
                if (editor.mouseListener && editor.mouseListener.onclick(e)) break;
            }
        };
        this.canvasElement.ondblclick = event => {
            let e = convertMouseEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.currentEditors.length;
            for (let i = length - 1; i >= 0; i--) {
                let editor = this.currentEditors[i];
                if (editor.mouseListener && editor.mouseListener.ondblclick(e)) break;
            }
        };
        this.canvasElement.onwheel = event => {
            let e = convertWheelEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.currentEditors.length;
            for (let i = length - 1; i >= 0; i--) {
                let editor = this.currentEditors[i];
                if (editor.mouseListener && editor.mouseListener.onwheel(e)) break;
            }
        };
        this.canvasElement.onmousedown = event => {
            let e = convertMouseEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.currentEditors.length;
            for (let i = length - 1; i >= 0; i--) {
                let editor = this.currentEditors[i];
                if (editor.mouseListener && editor.mouseListener.onmousedown(e)) break;
            }
        };
        this.canvasElement.onmouseup = event => {
            let e = convertMouseEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.currentEditors.length;
            for (let i = length - 1; i >= 0; i--) {
                let editor = this.currentEditors[i];
                if (editor.mouseListener && editor.mouseListener.onmouseup(e)) break;
            }
        };
        this.canvasElement.onmousemove = event => {
            let e = convertMouseEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.currentEditors.length;
            for (let i = length - 1; i >= 0; i--) {
                let editor = this.currentEditors[i];
                if (editor.mouseListener && editor.mouseListener.onmousemove(e)) break;
            }
        };
        this.canvasElement.onmouseout = event => {
            let e = convertMouseEvent(event);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            let length = this.currentEditors.length;
            for (let i = length - 1; i >= 0; i--) {
                let editor = this.currentEditors[i];
                if (editor.mouseListener && editor.mouseListener.onmouseout(e)) break;
            }
        };

        this.canvasElement.onkeydown = event => {
            let length = this.currentEditors.length;
            for (let i = length - 1; i >= 0; i--) {
                let editor = this.currentEditors[i];
                if (editor.keyboardListener && editor.keyboardListener.onkeydown(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    break;
                }
            }
        };
        this.canvasElement.onkeyup = event => {
            let length = this.currentEditors.length;
            for (let i = length - 1; i >= 0; i--) {
                let editor = this.currentEditors[i];
                if (editor.keyboardListener && editor.keyboardListener.onkeyup(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    break;
                }
            }
        };
        this.canvasElement.onkeypress = event => {
            let length = this.currentEditors.length;
            for (let i = length - 1; i >= 0; i--) {
                let editor = this.currentEditors[i];
                if (editor.keyboardListener && editor.keyboardListener.onkeypress(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    break;
                }
            }
        };

        if (Ui.isMobile()) {
            let hammer = new Hammer(this.canvasElement);
            hammer.get('pan').set({direction: Hammer.DIRECTION_ALL});
            hammer.on("pan", (event: HammerInput) => {
                event.deltaX *= window.devicePixelRatio;
                event.deltaY *= window.devicePixelRatio;
                event.preventDefault();
                let length = this.currentEditors.length;
                for (let i = length - 1; i >= 0; i--) {
                    let editor = this.currentEditors[i];
                    if (editor.mouseListener && editor.mouseListener.onpan(event)) break;
                }
            });
        }

        render(html`<zoom-element .canvas="${this}" .camera="${this.camera}"></zoom-element>`, document.getElementById("cameraPanel"));
    }

    //layers

    private layers: Layer[] = [];

    public addLayer(layer: Layer): void {
        this.layers.push(layer);
    }
    public addLayers(...layers: Layer[]): void {
        this.layers.push(...layers);
    }

    public findLayer(name: LayerName): Layer {
        for (const layer of this.layers) {
            if (layer.name == name) {
                return layer;
            }
        }
        return null;
    }

    //editors

    private editors: Editor[] = [];

    public addEditor(editor: Editor): void {
        this.editors.push(editor);
    }
    public addEditors(...editors: Editor[]): void {
        this.editors.push(...editors);
    }

    public findEditor(name: EditorName): Editor {
        for (const editor of this.editors) {
            if (editor.name == name) {
                return editor;
            }
        }
        return null;
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

    private env: Env = new Env();

    public loadMap(map: Map): void {
        if (!this.map || this.map.name != map.name) {
            this.map = map;
            this.camera.load(this, map);

            this.env.loadMap(map);

            for (let layer of this.layers) {
                layer.loadMap(this.env);
            }

            //TODO load data?
        }
    }
    public loadData(data: Data): void {
        if (this.data != data) {
            this.data = data;

            this.env.loadData(data);

            for (let layer of this.layers) {
                layer.loadData(this.env);
            }

            //TODO clear editors? clear selection?
        }
    }

    public save(): Data {
        let data = new Data();
        for (let layer of this.layers) {
            // layer.saveData(data); //TODO save from Env
        }
        return data;
    }

    private currentEditors: Editor[] = [];
    public enterEditors(...editors: EditorName[]) {
        if (this.currentEditors.length) this.exitEditors();

        let map: { [key: number]: Editor } = {};
        for (let e of this.editors) {
            map[e.name] = e;
        }

        for (let editor of editors) {
            let e = map[editor];
            if (e) {
                this.currentEditors.push(e);
                e.enter(this.env);
            }
        }
    }
    public exitEditors() {
        for (let e of this.currentEditors) {
            e.exit();
        }
        this.currentEditors = [];
    }


    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
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
        for (let editor of this.currentEditors) {
            editor.render(this.renderer);
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

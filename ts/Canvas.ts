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
        this.canvasElement.onmousewheel = function (event: WheelEvent) {
            self.camera.changeZoomBy(event.wheelDelta > 0 ? -1 : 1);
            self.requestRender();
        };
    }

    private layers: Layer[];

    public addLayer(layer: Layer) {
        this.layers.push(layer);
    }

    public getLayer() {
        //TODO
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
        this.canvasElement.width = this.width = this.canvasElement.clientWidth;
        this.canvasElement.height = this.height = this.canvasElement.clientHeight;

        this.renderer.clear();
        for (let layer of this.layers) {
            layer.render(this, this.renderer, this.camera);
        }
    }
}

// function Canvas(domElement, name) {
//     this.domElement = domElement;
//     this.name = name;
//
//     this.layers = [];
//     this.layerByName = {};
//
//     this.camera = new Camera();
// }
//
// Canvas.prototype.init = function () {
//     this.domElement.innerHTML = "<canvas id=\"" + this.name + "\" style='width:100%;height:100%;overflow:hidden;position:absolute'></canvas>";
//     this.canvasElement = document.getElementById(this.name);
//     this.canvasElement.width = this.canvasElement.clientWidth;
//     this.canvasElement.height = this.canvasElement.clientHeight;
//     this.context = this.canvasElement.getContext("2d");
//     this.renderer = new Renderer(this.canvasElement, this.context);
//
//     var self = this;
//
//     this.canvasElement.onmousewheel = function (event) {
//         event = event || window.event;
//         var layerImage = self.getLayer('image');
//         if (layerImage.zoomLevel !== undefined && layerImage.maxLevel) {
//             var diff = event.wheelDelta > 0 ? -1 : 1;
//             layerImage.loadImageZoom(layerImage.zoomLevel + diff);
//         }
//     };
// };
//
// Canvas.prototype.addLayer = function (layer) {
//     var name = layer.name;
//     var renderOrder = layer.renderOrder;
//
//     //TODO deny duplicate names?
//     this.layers[renderOrder] = this.layers[renderOrder] || [];
//     this.layers[renderOrder].push(layer);
//     this.layerByName[name] = layer;
// };
//
// Canvas.prototype.getLayer = function (name) {
//     return this.layerByName[name];
// };
//
// Canvas.prototype.requestRender = function () {
//     var self = this;
//     requestAnimationFrame(function () {
//         self.render();
//     })
// };
//
// Canvas.prototype.load = function (content, folder) {
//     var canvas = this;
//     Object.keys(this.layers).sort().forEach(function (renderOrder) {
//         canvas.layers[renderOrder].forEach(function (layer) {
//             layer.load(content, folder);
//         })
//     });
// };
//
// Canvas.prototype.render = function () {
//     this.renderer.clear();
//
//     var requestNextFrame = false;
//     var canvas = this;
//     var renderer = this.renderer;
//     var camera = this.camera;
//     Object.keys(this.layers).sort().forEach(function (renderOrder) {
//         canvas.layers[renderOrder].forEach(function (layer) {
//             requestNextFrame |= layer.render(0, canvas, renderer, camera);
//         })
//     });
//     if (requestNextFrame) {
//         this.requestRender();
//     } else {
//         console.log('stopped');
//     }
// };
//
// return Canvas;
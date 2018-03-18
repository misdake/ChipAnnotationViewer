define(["require", "exports", "./Renderer", "./Camera"], function (require, exports, Renderer_1, Camera_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Canvas = /** @class */ (function () {
        function Canvas(domElement, id) {
            this.domElement = domElement;
            this.domElement.innerHTML = "<canvas id=\"" + id + "\" style='width:100%;height:100%;overflow:hidden;position:absolute'></canvas>";
            this.canvasElement = document.getElementById(id);
            this.context = this.canvasElement.getContext("2d");
            this.renderer = new Renderer_1.Renderer(this, this.canvasElement, this.context);
            this.camera = new Camera_1.Camera();
            this.width = this.canvasElement.clientWidth;
            this.height = this.canvasElement.clientHeight;
            var self = this;
            window.addEventListener('resize', function () {
                self.requestRender();
            });
        }
        Canvas.prototype.init = function () {
            this.layers = [];
            var self = this;
            this.canvasElement.onmousewheel = function (event) {
                self.camera.changeZoomBy(event.wheelDelta > 0 ? -1 : 1);
                self.requestRender();
            };
        };
        Canvas.prototype.addLayer = function (layer) {
            this.layers.push(layer);
        };
        Canvas.prototype.getLayer = function () {
            //TODO
        };
        Canvas.prototype.requestRender = function () {
            var self = this;
            requestAnimationFrame(function () {
                self.render();
            });
        };
        Canvas.prototype.load = function (content, folder) {
            this.camera.load(content);
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.load(this, content, folder);
            }
        };
        Canvas.prototype.render = function () {
            this.canvasElement.width = this.width = this.canvasElement.clientWidth;
            this.canvasElement.height = this.height = this.canvasElement.clientHeight;
            this.renderer.clear();
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.render(this, this.renderer, this.camera);
            }
        };
        return Canvas;
    }());
    exports.Canvas = Canvas;
});
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
//# sourceMappingURL=Canvas.js.map
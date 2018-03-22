define(["require", "exports", "./Renderer", "./Camera"], function (require, exports, Renderer_1, Camera_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Canvas = /** @class */ (function () {
        function Canvas(domElement, id) {
            this.domElement = domElement;
            this.domElement.innerHTML = "<canvas id=\"" + id + "\" style='width:100%;height:100%;overflow:hidden;position:absolute'></canvas>";
            this.canvasElement = document.getElementById(id);
            this.context = this.canvasElement.getContext("2d");
            this.camera = new Camera_1.Camera();
            this.renderer = new Renderer_1.Renderer(this, this.canvasElement, this.context);
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
                self.camera.action();
                var point1 = self.camera.screenXyToCanvas(event.clientX, event.clientY);
                self.camera.changeZoomBy(event.wheelDelta > 0 ? -1 : 1);
                self.camera.action();
                var point2 = self.camera.screenXyToCanvas(event.clientX, event.clientY);
                var dx = point1.x - point2.x;
                var dy = point1.y - point2.y;
                self.camera.moveXy(dx, dy);
                self.requestRender();
            };
            var lastX = -1;
            var lastY = -1;
            this.canvasElement.onmousedown = function (event) {
                lastX = event.clientX;
                lastY = event.clientY;
            };
            this.canvasElement.onmousemove = function (event) {
                if (event.which > 0) {
                    self.camera.action();
                    var point1 = self.camera.screenXyToCanvas(lastX, lastY);
                    var point2 = self.camera.screenXyToCanvas(event.clientX, event.clientY);
                    var dx = point1.x - point2.x;
                    var dy = point1.y - point2.y;
                    self.camera.moveXy(dx, dy);
                    lastX = event.clientX;
                    lastY = event.clientY;
                    self.requestRender();
                }
            };
        };
        Canvas.prototype.addLayer = function (layer) {
            this.layers.push(layer);
        };
        Canvas.prototype.getLayer = function () {
            //TODO
        };
        Canvas.prototype.getWidth = function () {
            return this.width;
        };
        Canvas.prototype.getHeight = function () {
            return this.height;
        };
        Canvas.prototype.requestRender = function () {
            var self = this;
            requestAnimationFrame(function () {
                self.render();
            });
        };
        Canvas.prototype.load = function (content, folder) {
            this.camera.load(this, content);
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.load(this, content, folder);
            }
        };
        Canvas.prototype.render = function () {
            this.width = this.canvasElement.clientWidth;
            this.height = this.canvasElement.clientHeight;
            if (this.canvasElement.width !== this.width)
                this.canvasElement.width = this.width;
            if (this.canvasElement.height !== this.height)
                this.canvasElement.height = this.height;
            this.camera.action();
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
//# sourceMappingURL=Canvas.js.map
define(["require", "exports", "./Point"], function (require, exports, Point_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Renderer = /** @class */ (function () {
        function Renderer(canvas, canvasElement, context) {
            this.canvas = canvas;
            this.canvasElement = canvasElement;
            this.context = context;
        }
        Renderer.prototype.begin = function (camera) {
            this.context.fillStyle = "#000000";
            this.context.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
            var zoom = 1.0 / (1 << camera.getZoom());
            this.sx = zoom;
            this.tx = this.canvas.getWidth() / 2 - camera.getX() * zoom;
            this.sy = zoom;
            this.ty = this.canvas.getHeight() / 2 - camera.getY() * zoom;
        };
        Renderer.prototype.image = function (image, x, y, width, height) {
            var point = this.canvasXyToScreen(x, y);
            var targetW = width * this.sx;
            var targetH = height * this.sy;
            if (point.x > this.canvas.getWidth() || point.y > this.canvas.getHeight())
                return;
            if (point.x + targetW < 0 || point.y + targetH < 0)
                return;
            this.context.drawImage(image, point.x, point.y, targetW, targetH);
        };
        Renderer.prototype.screenPointToCanvas = function (point) {
            return this.screenXyToCanvas(point.x, point.y);
        };
        Renderer.prototype.screenXyToCanvas = function (x, y) {
            var targetX = (x - this.tx) / this.sx;
            var targetY = (y - this.ty) / this.sy;
            return new Point_1.Point(targetX, targetY);
        };
        Renderer.prototype.canvasPointToScreen = function (point) {
            return this.canvasXyToScreen(point.x, point.y);
        };
        Renderer.prototype.canvasXyToScreen = function (x, y) {
            var targetX = x * this.sx + this.tx;
            var targetY = y * this.sy + this.ty;
            return new Point_1.Point(targetX, targetY);
        };
        return Renderer;
    }());
    exports.Renderer = Renderer;
});
//# sourceMappingURL=Renderer.js.map
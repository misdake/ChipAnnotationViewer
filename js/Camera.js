define(["require", "exports", "./Point"], function (require, exports, Point_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Camera = /** @class */ (function () {
        function Camera() {
        }
        Camera.prototype.load = function (canvas, content) {
            this.canvas = canvas;
            this.zoomMin = 0;
            this.zoomMax = content.maxLevel;
            this.zoom = content.maxLevel;
            this.checkZoom();
            this.x = content.width / 2;
            this.y = content.height / 2;
            this.xMin = 0;
            this.xMax = content.width;
            this.yMin = 0;
            this.yMax = content.height;
        };
        Camera.prototype.setXy = function (x, y) {
            this.x = x;
            this.y = y;
            this.checkXy();
        };
        Camera.prototype.moveXy = function (dx, dy) {
            this.x += dx;
            this.y += dy;
            this.checkXy();
        };
        Camera.prototype.getX = function () {
            return this.x;
        };
        Camera.prototype.getY = function () {
            return this.y;
        };
        Camera.prototype.checkXy = function () {
            this.x = Math.min(Math.max(this.x, this.xMin), this.xMax);
            this.y = Math.min(Math.max(this.y, this.yMin), this.yMax);
        };
        Camera.prototype.getZoom = function () {
            return this.zoom;
        };
        Camera.prototype.changeZoomBy = function (amount) {
            this.zoom += amount;
            this.checkZoom();
        };
        Camera.prototype.setZoomTo = function (zoom) {
            this.zoom = zoom;
            this.checkZoom();
        };
        Camera.prototype.checkZoom = function () {
            this.zoom = Math.min(Math.max(this.zoom, this.zoomMin), this.zoomMax);
        };
        Camera.prototype.action = function () {
            this.checkXy();
            this.checkZoom();
            var scale = 1.0 / (1 << this.zoom);
            this.scale = scale;
            this.tx = this.canvas.getWidth() / 2 - this.x * scale;
            this.ty = this.canvas.getHeight() / 2 - this.y * scale;
        };
        Camera.prototype.screenPointToCanvas = function (point) {
            return this.screenXyToCanvas(point.x, point.y);
        };
        Camera.prototype.screenXyToCanvas = function (x, y) {
            var targetX = (x - this.tx) / this.scale;
            var targetY = (y - this.ty) / this.scale;
            return new Point_1.Point(targetX, targetY);
        };
        Camera.prototype.canvasPointToScreen = function (point) {
            return this.canvasXyToScreen(point.x, point.y);
        };
        Camera.prototype.canvasXyToScreen = function (x, y) {
            var targetX = x * this.scale + this.tx;
            var targetY = y * this.scale + this.ty;
            return new Point_1.Point(targetX, targetY);
        };
        Camera.prototype.screenSizeToCanvas = function (s) {
            return s / this.scale;
        };
        Camera.prototype.canvasSizeToScreen = function (s) {
            return s * this.scale;
        };
        return Camera;
    }());
    exports.Camera = Camera;
});
//# sourceMappingURL=Camera.js.map
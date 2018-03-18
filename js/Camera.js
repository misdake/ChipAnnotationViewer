define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Camera = /** @class */ (function () {
        function Camera() {
        }
        Camera.prototype.load = function (content) {
            this.zoomMin = 0;
            this.zoomMax = content.maxLevel;
            this.zoom = content.maxLevel;
            this.checkZoom();
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
            if (this.zoom < this.zoomMin)
                this.zoom = this.zoomMin;
            if (this.zoom > this.zoomMax)
                this.zoom = this.zoomMax;
        };
        return Camera;
    }());
    exports.Camera = Camera;
});
//# sourceMappingURL=Camera.js.map
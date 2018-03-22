var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "../Layer"], function (require, exports, Layer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LayerImage = /** @class */ (function (_super) {
        __extends(LayerImage, _super);
        function LayerImage() {
            return _super.call(this, "image", 0) || this;
        }
        LayerImage.prototype.load = function (canvas, content, folder) {
            _super.prototype.load.call(this, canvas, content, folder);
            this.content = content;
            this.maxLevel = content.maxLevel;
            this.baseFolder = folder;
            this.currentZoom = -1;
        };
        LayerImage.prototype.prepare = function (camera, canvas) {
            var zoom = camera.getZoom();
            if (this.currentZoom === zoom)
                return;
            this.currentZoom = zoom;
            var levelData = this.content.levels[zoom];
            this.xCount = levelData.xMax;
            this.yCount = levelData.yMax;
            this.imageMatrix = [];
            for (var i = 0; i < this.xCount; i++) {
                this.imageMatrix[i] = [];
                for (var j = 0; j < this.yCount; j++) {
                    var image = new Image();
                    image.src = this.baseFolder + "/" + zoom + "/" + i + "_" + j + ".jpg";
                    this.imageMatrix[i][j] = image;
                    image.onload = function (event) { return canvas.requestRender(); };
                }
            }
        };
        LayerImage.prototype.render = function (canvas, renderer, camera) {
            _super.prototype.render.call(this, canvas, renderer, camera);
            var zoom = camera.getZoom();
            var targetSize = this.content.tileSize << zoom;
            this.prepare(camera, canvas);
            if (this.imageMatrix) {
                for (var i = 0; i < this.xCount; i++) {
                    for (var j = 0; j < this.yCount; j++) {
                        if (this.imageMatrix[i][j] && this.imageMatrix[i][j].complete) {
                            renderer.image(this.imageMatrix[i][j], i * targetSize, j * targetSize, targetSize, targetSize);
                        }
                    }
                }
            }
        };
        LayerImage.prototype.unload = function () {
            _super.prototype.unload.call(this);
        };
        return LayerImage;
    }(Layer_1.Layer));
    exports.LayerImage = LayerImage;
});
//# sourceMappingURL=LayerImage.js.map
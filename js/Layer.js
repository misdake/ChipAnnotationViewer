define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Layer = /** @class */ (function () {
        function Layer(name, renderOrder) {
            this.name = name;
            this.renderOrder = renderOrder;
        }
        Layer.prototype.load = function (canvas, content, folder) {
        };
        Layer.prototype.render = function (canvas, renderer, camera) {
        };
        Layer.prototype.unload = function () {
        };
        return Layer;
    }());
    exports.Layer = Layer;
});
//# sourceMappingURL=Layer.js.map
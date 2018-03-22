define(["require", "exports", "./Canvas", "./util/NetUtil", "./layers/LayerImage"], function (require, exports, Canvas_1, NetUtil_1, LayerImage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var canvas = new Canvas_1.Canvas(document.getElementById("container"), 'canvas2d');
    canvas.init();
    var layerImage = new LayerImage_1.LayerImage();
    canvas.addLayer(layerImage);
    NetUtil_1.NetUtil.get("data/fiji/content.json", function (text) {
        var content = JSON.parse(text);
        canvas.load(content, "data/fiji");
        canvas.requestRender();
    });
});
//# sourceMappingURL=Main.js.map
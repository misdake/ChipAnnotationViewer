import {Canvas} from "./Canvas";
import {NetUtil} from "./util/NetUtil";
import {Content} from "./Content";
import {LayerImage} from "./layers/LayerImage";
import {LayerPolylineView} from "./layers/LayerPolylineView";

document.oncontextmenu = function (ev) {
    return false; //disable context menu
};

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

canvas.addLayer(new LayerImage(canvas));
canvas.addLayer(new LayerPolylineView(canvas));

NetUtil.get("data/fiji/content.json", text => {
    let content: Content = JSON.parse(text) as Content;
    canvas.load(content, "data/fiji");
    canvas.requestRender();
});
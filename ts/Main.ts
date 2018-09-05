import {Canvas} from "./Canvas";
import {NetUtil} from "./util/NetUtil";
import {Content} from "./Content";
import {LayerImage} from "./layers/LayerImage";
import {LayerPolylineView} from "./layers/LayerPolylineView";
import {LayerPolylineEdit} from "./layers/LayerPolylineEdit";

document.oncontextmenu = function (ev) {
    return false; //disable context menu
};

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

let layerImage = new LayerImage(canvas);
let layerPolylineView = new LayerPolylineView(canvas);
let layerPolylineEdit = new LayerPolylineEdit(canvas);

layerPolylineView.setLayer(layerPolylineEdit);
layerPolylineEdit.setLayer(layerPolylineView);

canvas.addLayer(layerImage);
canvas.addLayer(layerPolylineView);
canvas.addLayer(layerPolylineEdit);

NetUtil.get("data/fiji/content.json", text => {
    let content: Content = JSON.parse(text) as Content;
    canvas.load(content, "data/fiji");
    canvas.requestRender();
});
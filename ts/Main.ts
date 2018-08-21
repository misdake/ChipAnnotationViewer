import {Canvas} from "./Canvas";
import {NetUtil} from "./util/NetUtil";
import {Content} from "./Content";
import {LayerImage} from "./layers/LayerImage";
import {LayerPolyline} from "./layers/LayerPolyline";

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

canvas.addLayer(new LayerImage());
canvas.addLayer(new LayerPolyline());

NetUtil.get("data/fiji/content.json", text => {
    let content: Content = JSON.parse(text) as Content;
    canvas.load(content, "data/fiji");
    canvas.requestRender();
});
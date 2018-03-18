import {Canvas} from "./Canvas";
import {NetUtil} from "./util/NetUtil";
import {Content} from "./Content";
import {LayerImage} from "./layers/LayerImage";

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

let layerImage = new LayerImage();
canvas.addLayer(layerImage);

NetUtil.get("data/fiji/content.json", text => {
    let content: Content = JSON.parse(text) as Content;
    console.log(text);
    canvas.load(content, "data/fiji");
    canvas.requestRender();
});
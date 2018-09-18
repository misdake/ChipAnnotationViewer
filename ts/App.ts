import {Canvas} from "./Canvas";
import {NetUtil} from "./util/NetUtil";
import {Content} from "./Content";
import {LayerImage} from "./layers/LayerImage";
import {LayerPolylineView} from "./layers/LayerPolylineView";
import {LayerPolylineEdit} from "./layers/LayerPolylineEdit";
import {LZString} from "./util/LZString";

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

function load(map: string, config: string) {
    NetUtil.get("data/" + map + "/content.json", text => {
        let content: Content = JSON.parse(text) as Content;
        canvas.load(content, "data/" + map);
        canvas.requestRender();
        // console.log(LZString.compressToEncodedURIComponent(text));
    });
}

let url_string = window.location.href;
let url = new URL(url_string);
let map = url.searchParams.get("map");
// let config = url.searchParams.get("config");

if (!map) {
    map = "fiji";
}
// if (config) {
//     console.log("decompressed: " + LZString.decompressFromEncodedURIComponent(config));
// }
load(map, "");
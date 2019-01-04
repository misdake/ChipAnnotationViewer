import {Canvas} from "./Canvas";
import {NetUtil} from "./util/NetUtil";
import {Map} from "./data/Map";
import {LayerImage} from "./layers/LayerImage";
import {LayerPolylineView} from "./layers/LayerPolylineView";
import {LayerPolylineEdit} from "./layers/LayerPolylineEdit";
import {Data} from "./data/Data";
import {Ui} from "./util/Ui";
import {LZString} from "./util/LZString";
import {LayerTextEdit} from "./layers/LayerTextEdit";
import {LayerTextView} from "./layers/LayerTextView";

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

let layerImage = new LayerImage(canvas);
let layerPolylineView = new LayerPolylineView(canvas);
let layerPolylineEdit = new LayerPolylineEdit(canvas);
let layerTextView = new LayerTextView(canvas);
let layerTextEdit = new LayerTextEdit(canvas);

canvas.addLayer(layerImage);
canvas.addLayer(layerPolylineView);
canvas.addLayer(layerPolylineEdit);
canvas.addLayer(layerTextView);
canvas.addLayer(layerTextEdit);

Ui.bindButtonOnClick("buttonNewPolyline", () => {
    layerTextEdit.finishEditing();
    layerPolylineEdit.startCreatingPolyline();
});
Ui.bindButtonOnClick("polylineButtonDelete", () => {
    layerPolylineEdit.deleteEditing();
    layerPolylineEdit.deleteCreating();
    layerTextEdit.finishEditing();
    layerPolylineEdit.finishEditing();
});
Ui.bindButtonOnClick("buttonNewText", () => {
    layerPolylineEdit.finishEditing();
    layerTextEdit.startCreatingText()
});
Ui.bindButtonOnClick("textButtonDelete", () => {
    layerPolylineEdit.finishEditing();
    layerTextEdit.deleteEditing();
    layerTextEdit.finishEditing();
});

function load(mapString: string, dataString: string) {

    Ui.bindButtonOnClick("buttonSave", () => {
        let data = canvas.save();
        let dataString = JSON.stringify(data);
        console.log(dataString);
        let compressed = LZString.compressToEncodedURIComponent(dataString);
        let url = location.pathname + '?map=' + mapString + '&data=' + compressed;
        history.replaceState(data, "", url);
    });

    NetUtil.get("data/" + map + "/content.json", mapDesc => {
        let map: Map = JSON.parse(mapDesc) as Map;
        let decompressed = dataString ? LZString.decompressFromEncodedURIComponent(dataString) : null;
        let data: Data = decompressed ? JSON.parse(decompressed) as Data : new Data;
        canvas.load(map, data, "data/" + mapString);
        canvas.requestRender();
    });

}

let url_string = window.location.href;
let url = new URL(url_string);
let map = url.searchParams.get("map") || "fiji";
let data = url.searchParams.get("data");

load(map, data);
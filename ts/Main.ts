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

let buttonStartEditing: HTMLButtonElement = document.createElement("button");
buttonStartEditing.id = "buttonStartEditing";
document.getElementById("panel").appendChild(buttonStartEditing);
buttonStartEditing.classList.add("configButton");
buttonStartEditing.innerText = "new polyline";
buttonStartEditing.onclick = () => {
    layerPolylineEdit.startCreatingPolyline();
};
let buttonFinishEditing: HTMLButtonElement = document.createElement("button");
document.getElementById("panel").appendChild(buttonFinishEditing);
buttonFinishEditing.id = "buttonFinishEditing";
buttonFinishEditing.classList.add("configButton");
buttonFinishEditing.innerText = "finish polyline";
buttonFinishEditing.onclick = () => {
    layerPolylineEdit.finishEditing();
};
let buttonDeleteSelected: HTMLButtonElement = document.createElement("button");
document.getElementById("panel").appendChild(buttonDeleteSelected);
buttonDeleteSelected.id = "buttonDeleteSelected";
buttonDeleteSelected.classList.add("configButton");
buttonDeleteSelected.innerText = "delete selected";
buttonDeleteSelected.onclick = () => {
    layerPolylineEdit.deleteEditing();
};

NetUtil.get("data/fiji/content.json", text => {
    let content: Content = JSON.parse(text) as Content;
    canvas.load(content, "data/fiji");
    canvas.requestRender();
});
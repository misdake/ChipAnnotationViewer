import {Canvas} from "./Canvas";
import {Chip, Map} from "./data/Map";
import {LayerImage} from "./layers/LayerImage";
import {LayerPolylineView} from "./layers/LayerPolylineView";
import {LayerPolylineEdit} from "./layers/LayerPolylineEdit";
import {Annotation} from "./data/Data";
import {Ui} from "./util/Ui";
import {LayerTextEdit} from "./layers/LayerTextEdit";
import {LayerTextView} from "./layers/LayerTextView";
import {LayerPolylineCreate} from "./layers/LayerPolylineCreate";
import {LayerTextCreate} from "./layers/LayerTextCreate";
import {html, render} from "lit-html";
import "elements/SelectElement"
import "elements/TitleElement"

if (Ui.isMobile()) {
    document.getElementById("panel").style.display = "none";
} else {
    document.getElementById("panel").style.display = "flex";
}

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

let layerImage = new LayerImage(canvas);
let layerPolylineView = new LayerPolylineView(canvas);
let layerPolylineCreate = new LayerPolylineCreate(canvas);
let layerPolylineEdit = new LayerPolylineEdit(canvas);
let layerTextView = new LayerTextView(canvas);
let layerTextCreate = new LayerTextCreate(canvas);
let layerTextEdit = new LayerTextEdit(canvas);

canvas.addLayer(layerImage);
canvas.addLayer(layerPolylineView);
canvas.addLayer(layerPolylineEdit);
canvas.addLayer(layerPolylineCreate);
canvas.addLayer(layerTextView);
canvas.addLayer(layerTextEdit);
canvas.addLayer(layerTextCreate);

Ui.bindButtonOnClick("buttonNewPolyline", () => {
    layerTextEdit.finishEditing();
    layerPolylineCreate.createPolylineAndEdit();
});
Ui.bindButtonOnClick("polylineButtonDelete", () => {
    layerPolylineEdit.deleteEditing();
    layerPolylineCreate.deleteCreating();
    layerTextEdit.finishEditing();
    layerPolylineEdit.finishEditing();
});
Ui.bindButtonOnClick("buttonNewText", () => {
    layerPolylineEdit.finishEditing();
    layerTextCreate.createTextAndEdit()
});
Ui.bindButtonOnClick("textButtonDelete", () => {
    layerPolylineEdit.finishEditing();
    layerTextCreate.deleteCreating();
    layerTextCreate.finishCreating();
    layerTextEdit.deleteEditing();
    layerTextEdit.finishEditing();
});

class App {
    private chip: Chip;
    private map: Map;
    private annotation: Annotation;

    public start() {
        render(html`
            <select-element 
                .onSelectChip=${(chip: Chip) => this.onSelectChip(chip)}
                .onSelectMap=${(map: Map) => this.onSelectMap(map)}
                .onSelectAnnotation=${(annotation: Annotation) => this.onSelectAnnotation(annotation)}
            ></select-element>
        `, document.getElementById("selectPanel"));
        this.refresh();
    }

    private refresh() {
        render(html`
            <title-element 
                .canvas="${canvas}"
                .map="${this.map}"
                .annotation="${this.annotation}"
            ></title-element>
        `, document.getElementById("annotationTitle"));
    }

    onSelectChip(chip: Chip) {
        this.chip = chip;
        this.refresh();
    }

    onSelectMap(map: Map) {
        this.map = map;
        this.refresh();
        canvas.loadMap(map);
        canvas.requestRender();
    }

    onSelectAnnotation(annotation: Annotation) {
        this.annotation = annotation;
        this.refresh();

        canvas.loadData(annotation.content);
        canvas.requestRender();
    }
}

new App().start();

import {Canvas} from "./Canvas";
import {Chip, Map} from "./data/Map";
import {Annotation} from "./data/Data";
import {Ui} from "./util/Ui";
import {html, render} from "lit-html";
import "elements/SelectElement"
import "elements/TitleElement"
import "editable/DrawablePolylineEditElement"
import "editable/DrawableTextEditElement"
import {Selection} from "./layers/Selection";
import {DrawablePolyline} from "./editable/DrawablePolyline";
import {DrawableText} from "./editable/DrawableText";
import {LayerName, Layers} from "./layers/Layers";

if (Ui.isMobile()) {
    document.getElementById("panel").style.display = "none";
} else {
    document.getElementById("panel").style.display = "flex";
}

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

canvas.addLayers(...Layers.create(canvas));

// Ui.bindButtonOnClick("buttonNewPolyline", () => {
//     layerTextEdit.finishEditing();
//     layerPolylineCreate.createPolylineAndEdit();
// });
// Ui.bindButtonOnClick("polylineButtonDelete", () => {
//     layerPolylineEdit.deleteEditing();
//     layerPolylineCreate.deleteCreating();
//     layerTextEdit.finishEditing();
//     layerPolylineEdit.finishEditing();
// });
// Ui.bindButtonOnClick("buttonNewText", () => {
//     layerPolylineEdit.finishEditing();
//     layerTextCreate.createTextAndEdit()
// });
// Ui.bindButtonOnClick("textButtonDelete", () => {
//     layerPolylineEdit.finishEditing();
//     layerTextCreate.deleteCreating();
//     layerTextCreate.finishCreating();
//     layerTextEdit.deleteEditing();
//     layerTextEdit.finishEditing();
// });

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

        Selection.register(LayerName.POLYLINE_EDIT, (item: DrawablePolyline) => {
            render(item.ui.render(canvas, this.map), document.getElementById("panelPolylineSelected"));
        }, () => {
            render(html``, document.getElementById("panelPolylineSelected"));
        });

        Selection.register(LayerName.TEXT_EDIT, (item: DrawableText) => {
            render(item.renderUi(canvas), document.getElementById("panelTextSelected"));
        }, () => {
            render(html``, document.getElementById("panelTextSelected"));
        });
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

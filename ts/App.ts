import {Canvas} from "./Canvas";
import {Chip, Map} from "./data/Map";
import {Annotation} from "./data/Data";
import {Ui} from "./util/Ui";
import {html, render} from "lit-html";
import "elements/SelectElement"
import "elements/TitleElement"
import "editable/DrawablePolylineEditElement"
import "editable/DrawableTextEditElement"
import "editable/DrawableMultipleEditElement"
import {Selection, SelectType} from "./layers/Selection";
import {DrawablePolyline, DrawablePolylinePack} from "./editable/DrawablePolyline";
import {DrawableText, DrawableTextPack} from "./editable/DrawableText";
import {Layers} from "./layers/Layers";
import {EditorName, Editors} from "./editors/Editors";
import {Size} from "./util/Size";
import {Drawable} from "./drawable/Drawable";
import {MultipleEdit} from "./editable/DrawableMultipleEditElement";

if (Ui.isMobile()) {
    document.getElementById("panel").style.display = "none";
} else {
    document.getElementById("panel").style.display = "flex";
}

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

canvas.addLayers(...Layers.create(canvas));
canvas.addEditors(...Editors.create(canvas));

canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);

Selection.register(null, () => {
    canvas.requestRender();
}, () => {
    canvas.requestRender();
});

document.getElementById("buttonCreatePolyline").onclick = () => {
    let polyline = new DrawablePolyline(new DrawablePolylinePack(
        [], true, new Size(2),
        true, "white", "25",
        true, "white", "75",
    ));
    canvas.env.polylines.push(polyline);
    Selection.select(SelectType.POLYLINE_CREATE, polyline);
};

document.getElementById("buttonCreateText").onclick = () => {
    let text = new DrawableText(new DrawableTextPack(
        "text",
        "white", "100", new Size(5, 50),
        0, 0
    ));
    canvas.env.texts.push(text);
    Selection.select(SelectType.TEXT_CREATE, text);
};

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

        Selection.register(SelectType.POLYLINE, (item: DrawablePolyline) => {
            render(item.ui.render(canvas, this.map), document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.POLYLINE_EDIT);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        });

        Selection.register(SelectType.POLYLINE_CREATE, (item: DrawablePolyline) => {
            render(item.ui.render(canvas, this.map), document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.POLYLINE_CREATE);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        });

        Selection.register(SelectType.TEXT, (item: DrawableText) => {
            render(item.renderUi(canvas), document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.TEXT_EDIT);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        });

        Selection.register(SelectType.TEXT_CREATE, (item: DrawableText) => {
            render(item.renderUi(canvas), document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.TEXT_CREATE);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        });

        Selection.register(SelectType.MULTIPLE, (item: Drawable[]) => {
            render(MultipleEdit.renderUi(canvas), document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.MULTIPLE_EDIT);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
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
        Selection.deselectAny();
        canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
    }

    onSelectMap(map: Map) {
        this.map = map;
        this.refresh();
        canvas.loadMap(map);
        Selection.deselectAny();
        canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        canvas.requestRender();
    }

    onSelectAnnotation(annotation: Annotation) {
        this.annotation = annotation;
        this.refresh();

        canvas.loadData(annotation.content);
        Selection.deselectAny();
        canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        canvas.requestRender();
    }
}

new App().start();

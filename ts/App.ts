import {Canvas} from "./Canvas";
import {Chip, Map} from "./data/Map";
import {Annotation} from "./data/Data";
import {Ui} from "./util/Ui";
import {html, render} from "lit-html";
import "elements/SelectElement"
import "elements/TitleElement"
import "editable/DrawablePolylineEditElement"
import "editable/DrawableTextEditElement"
import {Selection, SelectType} from "./layers/Selection";
import {DrawablePolyline, DrawablePolylinePack} from "./editable/DrawablePolyline";
import {DrawableText} from "./editable/DrawableText";
import {Layers} from "./layers/Layers";
import {EditorName, Editors} from "./editors/Editors";
import {Size} from "./util/Size";

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
            render(item.ui.render(canvas, this.map), document.getElementById("panelPolylineSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.POLYLINE_EDIT);
        }, () => {
            render(html``, document.getElementById("panelPolylineSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        });

        Selection.register(SelectType.POLYLINE_CREATE, (item: DrawablePolyline) => {
            render(item.ui.render(canvas, this.map), document.getElementById("panelPolylineSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.POLYLINE_CREATE);
        }, () => {
            render(html``, document.getElementById("panelPolylineSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        });

        Selection.register(SelectType.TEXT, (item: DrawableText) => {
            render(item.renderUi(canvas), document.getElementById("panelTextSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.TEXT_EDIT);
        }, () => {
            render(html``, document.getElementById("panelTextSelected"));
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

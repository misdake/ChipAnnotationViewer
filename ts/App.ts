import {Canvas} from "./Canvas";
import {Chip, Map} from "./data/Map";
import {Annotation} from "./data/Data";
import {Ui} from "./util/Ui";
import {html, render} from "lit-html";
import "elements/SelectElement";
import "elements/TitleElement";
import "editable/DrawablePolylineEditElement";
import "editable/DrawableTextEditElement";
import "editable/DrawableMultipleEditElement";
import {Selection, SelectType} from "./layers/Selection";
import {DrawablePolyline, DrawablePolylinePack} from "./editable/DrawablePolyline";
import {DrawableText, DrawableTextPack} from "./editable/DrawableText";
import {Layers} from "./layers/Layers";
import {EditorName, Editors} from "./editors/Editors";
import {Size} from "./util/Size";
import {Drawable} from "./drawable/Drawable";
import {MultipleEdit} from "./editable/DrawableMultipleEditElement";
import {EditablePick} from "./editable/Editable";

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
            render(MultipleEdit.renderUi(canvas, item), document.getElementById("panelSelected"));
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

let toastTimeout: number = undefined;
function showToast(content: string) {
    if (toastTimeout) clearTimeout(toastTimeout);

    let element = document.getElementById("toast");
    if (element) {
        element.style.display = "block";
        element.innerText = content;
        toastTimeout = setTimeout(() => {
            element.style.display = "none";
            element.innerText = "";
        }, 2000);
    }
}

function interceptKeys(evt: KeyboardEvent) {
    if (evt.target !== document.body && evt.target !== document.getElementById("canvas2d")) {
        return true;
    }

    // @ts-ignore
    evt = evt || window.event; // IE support
    var c = evt.keyCode;
    var ctrlDown = evt.ctrlKey || evt.metaKey; // Mac support

    // Check for Alt+Gr (http://en.wikipedia.org/wiki/AltGr_key)
    if (ctrlDown && evt.altKey) return true;

    // Check for ctrl+c, v and x
    else if (ctrlDown && c == 67) return ctrlC(); // c
    else if (ctrlDown && c == 86) return ctrlV(); // v
    else if (ctrlDown && c == 88) return ctrlX(); // x

    // Otherwise allow
    return true;
}

interface CopyFormat {
    content: "ChipAnnotationViewr Copy",
    version1: 2,
    version2: 0,
    polylines: DrawablePolylinePack[],
    texts: DrawableTextPack[],
}

const defaultCopy: CopyFormat = {
    content: "ChipAnnotationViewr Copy",
    version1: 2,
    version2: 0,
    polylines: [],
    texts: [],
};

function generateCopyData(selected: { item: Drawable | Drawable[]; type: SelectType }, deleteOrigin: boolean) {
    let polylines: DrawablePolyline[] = [];
    let texts: DrawableText[] = [];
    switch (selected.type) {
        case SelectType.POLYLINE:
            polylines.push(selected.item as DrawablePolyline);
            break;
        case SelectType.TEXT:
            texts.push(selected.item as DrawableText);
            break;
        case SelectType.MULTIPLE:
            let array = selected.item as (Drawable & EditablePick)[];
            for (let drawable of array) {
                if (drawable.pickType === SelectType.TEXT) {
                    texts.push(drawable as DrawableText);
                }
                if (drawable.pickType === SelectType.POLYLINE) {
                    polylines.push(drawable as DrawablePolyline);
                }
            }
            break;
    }

    let obj = Object.assign({}, defaultCopy);
    obj.polylines = polylines.map(polyline => polyline.pack());
    obj.texts = texts.map(text => text.pack());

    if (deleteOrigin) {
        let newPolylines = polylines.filter(polyline => polylines.indexOf(polyline) < 0);
        canvas.env.polylines.length = 0;
        canvas.env.polylines.push(...newPolylines);
        let newTexts = canvas.env.texts.filter(text => texts.indexOf(text) < 0);
        canvas.env.texts.length = 0;
        canvas.env.texts.push(...newTexts);
    }

    return obj;
}
function ctrlX() {
    console.log("ctrlX");
    let selected = Selection.getSelected();
    if (!selected.type) return false;
    let obj = generateCopyData(selected, true);
    navigator.clipboard.writeText(JSON.stringify(obj)).then(() => {
        showToast("Cut");
    });

    Selection.deselectAny();

    canvas.requestRender();
    return false;
}
function ctrlC() {
    console.log("ctrlC");
    let selected = Selection.getSelected();
    if (!selected.type) return false;
    let obj = generateCopyData(selected, false);
    navigator.clipboard.writeText(JSON.stringify(obj)).then(() => {
        showToast("Copied");
    });

    return false;
}
function ctrlV() {
    console.log("ctrlV");

    navigator.clipboard.readText().then(str => {
        let c: CopyFormat = undefined;
        try {
            c = JSON.parse(str) as CopyFormat;
        } catch (e) {
        }
        if (c && c.content === defaultCopy.content && c.version1 === defaultCopy.version1 && c.version2 === defaultCopy.version2) {
            let newDrawables: Drawable[] = [];

            for (let polyline of c.polylines) {
                let created = new DrawablePolyline(polyline);
                canvas.env.polylines.push(created);
                newDrawables.push(created);
            }
            for (let text of c.texts) {
                let created = new DrawableText(text);
                canvas.env.texts.push(created);
                newDrawables.push(created);
            }

            let selectType = undefined;
            let selected: Drawable | Drawable[] = undefined;
            if (c.polylines.length === 0 && c.texts.length === 1) {
                selectType = SelectType.TEXT;
                selected = newDrawables[0];
            }
            if (c.polylines.length === 1 && c.texts.length === 0) {
                selectType = SelectType.POLYLINE;
                selected = newDrawables[0];
            }
            if (c.polylines.length + c.texts.length > 1) {
                selectType = SelectType.MULTIPLE;
                selected = newDrawables;
            }
            if (selectType) {
                Selection.select(selectType, selected);
            }
            canvas.requestRender();
            showToast("Pasted");
        }
    });

    return false;
}
document.body.addEventListener("keydown", interceptKeys);
import {Canvas} from "./Canvas";
import {Chip, ChipContent} from "./data/Chip";
import { ANNOTATION_DATA_VERSION, Annotation, AnnotationContent, AnnotationData } from './data/Annotation';
import {html, render} from "lit-html";
import "./elements/SelectElement";
import "./elements/TitleElement";
import "./editable/DrawablePolylineEditElement";
import "./editable/DrawableTextEditElement";
import {Selection, SelectType} from "./layers/Selection";
import {DrawablePolyline, DrawablePolylinePack} from "./editable/DrawablePolyline";
import {DrawableText, DrawableTextPack} from "./editable/DrawableText";
import {Layers} from "./layers/Layers";
import {EditorName, Editors} from "./editors/Editors";
import {Size} from "./util/Size";
import {Drawable} from "./drawable/Drawable";
import {EditablePick} from "./editable/Editable";
import {EditorCameraControl} from "./editors/EditorCameraControl";
import packageJson from "../package.json";
import {packRgba} from "./util/Color";
import {upgradeAnnotationData} from "./data/AnnotationDataUpgrade";

let url_string = window.location.href;
let url = new URL(url_string);
let isReadOnly = !!url.searchParams.get("readonly");

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

canvas.addLayers(...Layers.create(canvas));
canvas.addEditors(...(isReadOnly ? [new EditorCameraControl(canvas)] : Editors.create(canvas)));

canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);

Selection.register(null, () => {
    canvas.requestRender();
}, () => {
    canvas.requestRender();
});

type PolylineCreateMode = "polyline" | "rect";
let polylineCreateMode: PolylineCreateMode = "polyline";

document.getElementById("buttonCreatePolyline").onclick = () => {
    polylineCreateMode = "polyline";
    let polyline = new DrawablePolyline(new DrawablePolylinePack(
        [], true, new Size(2),
        true, packRgba(255, 255, 255, 64),
        true, packRgba(255, 255, 255, 191),
    ));
    canvas.env.polylines.push(polyline);
    Selection.select(SelectType.POLYLINE_CREATE, polyline);
};
document.getElementById("buttonCreateRect").onclick = () => {
    polylineCreateMode = "rect";
    let polyline = new DrawablePolyline(new DrawablePolylinePack(
        [], true, new Size(2),
        true, packRgba(255, 255, 255, 64),
        true, packRgba(255, 255, 255, 191),
    ));
    canvas.env.polylines.push(polyline);
    Selection.select(SelectType.POLYLINE_CREATE, polyline);
};

document.getElementById("buttonCreateText").onclick = () => {
    let text = new DrawableText(new DrawableTextPack(
        "text",
        packRgba(255, 255, 255, 255), new Size(5, 50),
        0, 0, false
    ));
    canvas.env.texts.push(text);
    Selection.select(SelectType.TEXT_CREATE, text);
};

class App {
    private chip: Chip;
    private chipContent: ChipContent;
    private annotation: Annotation;

    public start() {
        render(html`
            <select-element 
                .onSelectChip=${(chip: Chip) => this.onSelectChip(chip)}
                .onSelectChipContent=${(chipContent: ChipContent) => this.onSelectChipContent(chipContent)}
                .onSelectAnnotation=${(annotation: Annotation, data: AnnotationData) => this.onSelectAnnotation(annotation, data)}
            ></select-element>
        `, document.getElementById("selectPanel"));
        this.refresh();

        let hintElement = document.getElementById("hint");
        let hintToggle = document.getElementById("hintToggle") as HTMLButtonElement;
        let hintIconEye = document.getElementById("hintIconEye") as HTMLElement;
        let hintIconEyeOff = document.getElementById("hintIconEyeOff") as HTMLElement;
        if (hintToggle) {
            hintElement.classList.add("hidden");
            hintToggle.classList.add("hintHidden");
            if (hintIconEye) hintIconEye.style.display = "none";
            if (hintIconEyeOff) hintIconEyeOff.style.display = "block";
            hintToggle.onclick = () => {
                hintElement.classList.toggle("hidden");
                hintToggle.classList.toggle("hintHidden");
                if (hintIconEye && hintIconEyeOff) {
                    if (hintElement.classList.contains("hidden")) {
                        hintIconEye.style.display = "none";
                        hintIconEyeOff.style.display = "block";
                    } else {
                        hintIconEye.style.display = "block";
                        hintIconEyeOff.style.display = "none";
                    }
                }
            };
        }

        const panelDivider = html`<div class="panel-divider"></div>`;

        Selection.register(SelectType.POLYLINE, (item: DrawablePolyline) => {
            render(html`${panelDivider}${item.ui.render(canvas, this.chipContent)}`, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.POLYLINE_EDIT);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        });

        Selection.register(SelectType.POLYLINE_CREATE, (item: DrawablePolyline) => {
            render(html`${panelDivider}${item.ui.render(canvas, this.chipContent)}`, document.getElementById("panelSelected"));
            const createEditor = polylineCreateMode === "rect" ? EditorName.RECT_CREATE : EditorName.POLYLINE_CREATE;
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, createEditor);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            polylineCreateMode = "polyline";
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        });

        Selection.register(SelectType.TEXT, (item: DrawableText) => {
            render(html`${panelDivider}${item.renderUi(canvas)}`, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.TEXT_EDIT);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        });

        Selection.register(SelectType.TEXT_CREATE, (item: DrawableText) => {
            render(html`${panelDivider}${item.renderUi(canvas)}`, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT, EditorName.TEXT_CREATE);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        });

        Selection.register(SelectType.MULTIPLE, (item: Drawable[]) => {
            const polylines: DrawablePolyline[] = [];
            const texts: DrawableText[] = [];
            for (const d of item) {
                if (d instanceof DrawablePolyline) {
                    polylines.push(d);
                } else if (d instanceof DrawableText) {
                    texts.push(d);
                }
            }
            const polylinePanel = polylines.length > 0
                ? html`<polylineedit-element .polylines=${polylines} .linkedDrawables=${item as (DrawablePolyline | DrawableText)[]} .canvas=${canvas} .chipContent=${this.chipContent}></polylineedit-element>`
                : html``;
            const textPanel = texts.length > 0
                ? html`<textedit-element .texts=${texts} .canvas=${canvas}></textedit-element>`
                : html``;
            const innerDivider = polylines.length > 0 && texts.length > 0
                ? html`<div class="panel-divider"></div>`
                : html``;
            render(html`${panelDivider}${polylinePanel}${innerDivider}${textPanel}`, document.getElementById("panelSelected"));
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
                .chipContent="${this.chipContent}"
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

    onSelectChipContent(chipContent: ChipContent) {
        this.chipContent = chipContent;
        this.refresh();
        canvas.loadChip(chipContent);
        Selection.deselectAny();
        canvas.enterEditors(EditorName.CAMERA_CONTROL, EditorName.SELECT);
        canvas.requestRender();
    }

    onSelectAnnotation(annotation: Annotation, data: AnnotationData) {
        this.annotation = annotation;
        this.refresh();

        canvas.loadData(data);

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
        element.classList.remove("hiding");
        element.classList.add("visible");
        element.innerText = content;
        element.style.display = "block";
        toastTimeout = setTimeout(() => {
            element.classList.remove("visible");
            element.classList.add("hiding");
            setTimeout(() => {
                element.classList.remove("hiding");
                element.innerText = "";
                element.style.display = "none";
            }, 300);
        }, 2000);
    }
}

window.addEventListener("chipannotation-toast", (ev: Event) => {
    const custom = ev as CustomEvent<string>;
    if (custom.detail) {
        showToast(custom.detail);
    }
});

function interceptKeys(evt: KeyboardEvent) {
    if (evt.target !== document.body && evt.target !== document.getElementById("canvas2d")) {
        return true;
    }

    // @ts-ignore
    evt = evt || window.event; // IE support
    let ctrlDown = evt.ctrlKey || evt.metaKey; // Mac support

    // Check for Alt+Gr (http://en.wikipedia.org/wiki/AltGr_key)
    if (ctrlDown && evt.altKey) return true;

    // Check for ctrl+c, v and x
    else if (ctrlDown && evt.key === 'c') return ctrlC();
    else if (ctrlDown && evt.key === 'v') return ctrlV();
    else if (ctrlDown && evt.key === 'x') return ctrlX();

    // Otherwise allow
    return true;
}

interface CopyFormat {
    ty: string;
    version: string;
    dataVersion?: number;
    polylines: DrawablePolylinePack[],
    texts: DrawableTextPack[],
}

const COPY_TY = "ChipAnnotationViewer Copy";
const COPY_VERSION = packageJson.version;

function isValidCopy(c: unknown): c is CopyFormat {
    return c !== null && c !== undefined
        && typeof (c as CopyFormat).ty === 'string'
        && typeof (c as CopyFormat).version === 'string'
        && (c as CopyFormat).ty === COPY_TY
        && Array.isArray((c as CopyFormat).polylines)
        && Array.isArray((c as CopyFormat).texts);
}

const defaultCopy: CopyFormat = {
    ty: COPY_TY,
    version: COPY_VERSION,
    dataVersion: ANNOTATION_DATA_VERSION,
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
        let newPolylines = canvas.env.polylines.filter(polyline => polylines.indexOf(polyline) < 0);
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
        let c: unknown = undefined;
        try {
            c = JSON.parse(str);
        } catch (e) {
        }
        if (c && isValidCopy(c)) {
            const data = upgradeAnnotationData({
                version: c.dataVersion,
                polylines: c.polylines,
                texts: c.texts,
            });
            let newDrawables: Drawable[] = [];

            for (let polyline of data.polylines) {
                let created = new DrawablePolyline(polyline);
                canvas.env.polylines.push(created);
                newDrawables.push(created);
            }
            for (let text of data.texts) {
                let created = new DrawableText(text);
                canvas.env.texts.push(created);
                newDrawables.push(created);
            }

            let selectType = undefined;
            let selected: Drawable | Drawable[] = undefined;
            if (data.polylines.length === 0 && data.texts.length === 1) {
                selectType = SelectType.TEXT;
                selected = newDrawables[0];
            }
            if (data.polylines.length === 1 && data.texts.length === 0) {
                selectType = SelectType.POLYLINE;
                selected = newDrawables[0];
            }
            if (data.polylines.length + data.texts.length > 1) {
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

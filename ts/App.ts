import {Canvas} from "./Canvas";
import {Chip, ChipContent} from "./data/Chip";
import { ANNOTATION_DATA_VERSION, Annotation, AnnotationContent, AnnotationData } from './data/Annotation';
import {html, render} from "lit-html";
import "./elements/SelectElement";
import "./elements/TitleElement";
import "./editable/DrawablePolylineEditElement";
import "./editable/DrawableTextEditElement";
import "./editable/DrawableMultipleEditElement";
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
import {annotationHistory} from "./history/AnnotationHistory";

let url_string = window.location.href;
let url = new URL(url_string);
let isReadOnly = !!url.searchParams.get("readonly");
let isEditingEnabled = false;

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

canvas.addLayers(...Layers.create(canvas));
canvas.addEditors(...(isReadOnly ? [new EditorCameraControl(canvas)] : Editors.create(canvas)));

function enterBaseEditors() {
    canvas.enterEditors(
        EditorName.CAMERA_CONTROL,
        ...(isEditingEnabled ? [EditorName.SELECT] : []),
    );
}

function enterEditingEditors(...editors: EditorName[]) {
    canvas.enterEditors(
        EditorName.CAMERA_CONTROL,
        ...(isEditingEnabled ? [EditorName.SELECT, ...editors] : []),
    );
}

enterBaseEditors();

Selection.register(() => {
    canvas.requestRender();
}, () => {
    canvas.requestRender();
});

type PolylineCreateMode = "polyline" | "rect";
let polylineCreateMode: PolylineCreateMode = "polyline";

document.getElementById("buttonCreatePolyline").onclick = () => {
    if (!isEditingEnabled) return;
    polylineCreateMode = "polyline";
    let polyline = new DrawablePolyline(new DrawablePolylinePack(
        [], true, new Size(2),
        true, packRgba(255, 255, 255, 64),
        true, packRgba(255, 255, 255, 191),
    ));
    canvas.env.addPolyline(polyline);
    Selection.select(SelectType.POLYLINE_CREATE, polyline);
};
document.getElementById("buttonCreateRect").onclick = () => {
    if (!isEditingEnabled) return;
    polylineCreateMode = "rect";
    let polyline = new DrawablePolyline(new DrawablePolylinePack(
        [], true, new Size(2),
        true, packRgba(255, 255, 255, 64),
        true, packRgba(255, 255, 255, 191),
    ));
    canvas.env.addPolyline(polyline);
    Selection.select(SelectType.POLYLINE_CREATE, polyline);
};

document.getElementById("buttonCreateText").onclick = () => {
    if (!isEditingEnabled) return;
    let text = new DrawableText(new DrawableTextPack(
        "text",
        packRgba(255, 255, 255, 255), new Size(20),
        0, 0, false
    ));
    canvas.env.addText(text);
    Selection.select(SelectType.TEXT_CREATE, text);
};

function updateHistoryButtons() {
    const undoButton = document.getElementById("buttonUndo") as HTMLButtonElement;
    const redoButton = document.getElementById("buttonRedo") as HTMLButtonElement;
    if (undoButton) undoButton.disabled = !isEditingEnabled || !annotationHistory.canUndo();
    if (redoButton) redoButton.disabled = !isEditingEnabled || !annotationHistory.canRedo();
}
annotationHistory.subscribe(updateHistoryButtons);

class App {
    private chip: Chip;
    private chipContent: ChipContent;
    private annotation: Annotation;
    private userId: number = 0;
    private userName: string = '';

    private getEditMode(): 'none' | 'create' | 'update' {
        if (isReadOnly || !this.annotation || this.userId <= 0) {
            return 'none';
        }
        if (this.annotation.aid === 0) {
            return 'create';
        }
        if (this.annotation.aid > 0 && this.annotation.userId === this.userId) {
            return 'update';
        }
        return 'none';
    }

    private applyEditMode() {
        const editMode = this.getEditMode();
        const editable = editMode !== 'none';
        if (isEditingEnabled === editable) return;
        isEditingEnabled = editable;
        document.getElementById("editControls").hidden = !editable;
        Selection.deselectAny();
        enterBaseEditors();
    }

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

        Selection.register(SelectType.POLYLINE, (polyline) => {
            render(html`${panelDivider}${polyline.ui.render(canvas, this.chipContent)}`, document.getElementById("panelSelected"));
            enterEditingEditors(EditorName.POLYLINE_EDIT);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            enterBaseEditors();
        });

        Selection.register(SelectType.POLYLINE_CREATE, (polyline) => {
            render(html`${panelDivider}${polyline.ui.render(canvas, this.chipContent)}`, document.getElementById("panelSelected"));
            const createEditor = polylineCreateMode === "rect" ? EditorName.RECT_CREATE : EditorName.POLYLINE_CREATE;
            enterEditingEditors(createEditor);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            polylineCreateMode = "polyline";
            enterBaseEditors();
        });

        Selection.register(SelectType.TEXT, (text) => {
            render(html`${panelDivider}${text.renderUi(canvas)}`, document.getElementById("panelSelected"));
            enterEditingEditors(EditorName.TEXT_EDIT);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            enterBaseEditors();
        });

        Selection.register(SelectType.TEXT_CREATE, (text) => {
            render(html`${panelDivider}${text.renderUi(canvas)}`, document.getElementById("panelSelected"));
            enterEditingEditors(EditorName.TEXT_CREATE);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            enterBaseEditors();
        });

        Selection.register(SelectType.MULTIPLE, (items) => {
            const polylines: DrawablePolyline[] = [];
            const texts: DrawableText[] = [];
            for (const d of items) {
                if (d instanceof DrawablePolyline) {
                    polylines.push(d);
                } else if (d instanceof DrawableText) {
                    texts.push(d);
                }
            }
            const polylinePanel = polylines.length > 0
                ? html`<polylineedit-element .polylines=${polylines} .linkedDrawables=${items as (DrawablePolyline | DrawableText)[]} .showActions=${false} .canvas=${canvas} .chipContent=${this.chipContent}></polylineedit-element>`
                : html``;
            const textPanel = texts.length > 0
                ? html`<textedit-element .texts=${texts} .showActions=${false} .canvas=${canvas}></textedit-element>`
                : html``;
            const innerDivider = polylines.length > 0 && texts.length > 0
                ? html`<div class="panel-divider"></div>`
                : html``;
            const selectionActions = html`<multipleedit-element .drawables=${items as (DrawablePolyline | DrawableText)[]} .canvas=${canvas}></multipleedit-element>`;
            render(html`${panelDivider}${selectionActions}${polylinePanel}${innerDivider}${textPanel}`, document.getElementById("panelSelected"));
            enterEditingEditors(EditorName.MULTIPLE_EDIT);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            enterBaseEditors();
        });
    }

    private refresh() {
        const editMode = this.getEditMode();
        render(html`
            <title-element 
                .canvas="${canvas}"
                .chipContent="${this.chipContent}"
                .annotation="${this.annotation}"
                .editMode="${editMode}"
                .canUndo=${isEditingEnabled && annotationHistory.canUndo()}
                .canRedo=${isEditingEnabled && annotationHistory.canRedo()}
                .onUserChange=${(userId: number, userName: string) => this.onUserChange(userId, userName)}
                .onUndo=${() => {
                    if (isEditingEnabled) annotationHistory.undo(canvas);
                }}
                .onRedo=${() => {
                    if (isEditingEnabled) annotationHistory.redo(canvas);
                }}
            ></title-element>
        `, document.getElementById("annotationTitle"));
        const titleElement = document.querySelector("title-element") as HTMLElement & { updateComplete?: Promise<unknown> };
        if (titleElement && titleElement.updateComplete) titleElement.updateComplete.then(updateHistoryButtons);
        this.applyEditMode();
    }

    private onUserChange(userId: number, userName: string) {
        if (this.userId === userId && this.userName === userName) return;
        this.userId = userId;
        this.userName = userName;
        this.refresh();
    }

    onSelectChip(chip: Chip) {
        this.chip = chip;
        annotationHistory.reset();
        this.refresh();
        Selection.deselectAny();
        enterBaseEditors();
    }

    onSelectChipContent(chipContent: ChipContent) {
        this.chipContent = chipContent;
        this.refresh();
        canvas.loadChip(chipContent);
        annotationHistory.reset();
        Selection.deselectAny();
        enterBaseEditors();
        canvas.requestRender();
    }

    onSelectAnnotation(annotation: Annotation, data: AnnotationData) {
        this.annotation = annotation;
        this.refresh();

        canvas.loadData(data);
        annotationHistory.reset();

        Selection.deselectAny();
        enterBaseEditors();
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
    // @ts-ignore
    evt = evt || window.event; // IE support
    let ctrlDown = evt.ctrlKey || evt.metaKey; // Mac support

    // Check for Alt+Gr (http://en.wikipedia.org/wiki/AltGr_key)
    if (ctrlDown && evt.altKey) return true;

    if (evt.target !== document.body && evt.target !== document.getElementById("canvas2d")) {
        return true;
    }

    // Check for undo/redo
    if (ctrlDown && evt.key.toLowerCase() === 'z' && !evt.shiftKey) {
        if (!isEditingEnabled) return true;
        annotationHistory.undo(canvas);
        return false;
    }
    else if ((ctrlDown && evt.key.toLowerCase() === 'z' && evt.shiftKey) || (ctrlDown && evt.key.toLowerCase() === 'y')) {
        if (!isEditingEnabled) return true;
        annotationHistory.redo(canvas);
        return false;
    }

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

function generateCopyData(selected: { item: Drawable | Drawable[]; type: SelectType }) {
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

    return obj;
}
function ctrlX() {
    console.log("ctrlX");
    if (!isEditingEnabled) return true;
    let selected = Selection.getSelected();
    if (!selected.type) return false;
    let obj = generateCopyData(selected);
    const items = Array.isArray(selected.item) ? selected.item as Drawable[] : [selected.item as Drawable];
    annotationHistory.removeDrawables(canvas, items, "selection.cut");
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
    let obj = generateCopyData(selected);
    navigator.clipboard.writeText(JSON.stringify(obj)).then(() => {
        showToast("Copied");
    });

    return false;
}
function ctrlV() {
    console.log("ctrlV");
    if (!isEditingEnabled) return true;

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
                newDrawables.push(created);
            }
            for (let text of data.texts) {
                let created = new DrawableText(text);
                newDrawables.push(created);
            }
            annotationHistory.addDrawables(canvas, newDrawables, "selection.paste");
            showToast("Pasted");
        }
    });

    return false;
}
document.body.addEventListener("keydown", interceptKeys);

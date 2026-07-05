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
import {notifyToast, ToastDetail} from "./util/Toast";

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

function setActiveTool(buttonId: string, help: string) {
    document.querySelectorAll<HTMLButtonElement>("#toolRail .tool-button").forEach(button => {
        button.classList.toggle("active", button.id === buttonId);
    });
    const helpElement = document.getElementById("toolHelpText");
    if (helpElement) helpElement.textContent = help;
    const statusElement = document.getElementById("statusText");
    if (statusElement) statusElement.textContent = help.split(" · ")[0];
}

document.getElementById("buttonSelect").onclick = () => {
    Selection.deselectAny();
    enterBaseEditors();
    setActiveTool("buttonSelect", "Select objects · Drag to move · Ctrl adds to selection");
};
document.getElementById("buttonPan").onclick = () => {
    Selection.deselectAny();
    enterBaseEditors();
    setActiveTool("buttonPan", "Pan canvas · Drag empty space · Wheel to zoom");
};

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
    setActiveTool("buttonCreatePolyline", "Polyline · Click to add points · Enter to finish · Escape to cancel");
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
    setActiveTool("buttonCreateRect", "Rectangle · Drag on canvas to create · Escape to cancel");
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
    setActiveTool("buttonCreateText", "Text · Click canvas to place · Edit content in Properties");
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
    private annotationBaselineSnapshot: string = '';
    private annotationDirty: boolean = false;
    private annotationTitleDraft: string = '';
    private allowNextAnnotationSelectionDiscard: boolean = false;

    private getEditMode(): 'none' | 'create' | 'update' {
        if (isReadOnly || !this.annotation || this.userId <= 0) {
            return 'none';
        }
        if (this.annotation.aid > 0 && this.annotation.userId === this.userId) {
            return 'update';
        }
        return 'none';
    }

    private applyEditMode() {
        const editMode = this.getEditMode();
        const editable = editMode !== 'none';
        const stateLabel = editable ? "Editable" : "Read only";
        const stateBadge = document.getElementById("editStateBadge");
        const permissionState = document.getElementById("permissionState");
        if (stateBadge) stateBadge.textContent = stateLabel;
        if (permissionState) permissionState.textContent = stateLabel;
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
                .canDiscardCurrentAnnotation=${() => this.confirmDiscardCurrentAnnotation()}
            ></select-element>
        `, document.getElementById("selectPanel"));
        this.refresh();
        annotationHistory.subscribe(() => this.updateAnnotationDirtyState());
        window.addEventListener("beforeunload", (event) => {
            if (!this.annotationDirty) return;
            event.preventDefault();
            event.returnValue = "";
        });

        const hintToggle = document.getElementById("hintToggle");
        const hintElement = document.getElementById("hint");
        if (hintToggle && hintElement) {
            const showHint = () => {
                const rect = hintToggle.getBoundingClientRect();
                hintElement.classList.add("visible");
                const hintRect = hintElement.getBoundingClientRect();
                hintElement.style.top = `${Math.max(8, rect.top - hintRect.height - 8)}px`;
                hintElement.style.left = `${Math.min(window.innerWidth - hintRect.width - 8, Math.max(8, rect.left))}px`;
            };
            const hideHint = () => hintElement.classList.remove("visible");
            hintToggle.addEventListener("mouseenter", showHint);
            hintToggle.addEventListener("mouseleave", hideHint);
            hintToggle.addEventListener("focus", showHint);
            hintToggle.addEventListener("blur", hideHint);
        }

        const panelDivider = html`<div class="panel-divider"></div>`;

        Selection.register(SelectType.POLYLINE, (polyline) => {
            render(html`${panelDivider}${polyline.ui.render(canvas, this.chipContent)}`, document.getElementById("panelSelected"));
            enterEditingEditors(EditorName.POLYLINE_EDIT);
            setActiveTool("buttonSelect", "Polygon selected · Drag to move · Double-click an edge to add a point");
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
            setActiveTool("buttonSelect", "Text selected · Drag to move · Edit content in Properties");
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
            const selectionActions = html`<multipleedit-element .drawables=${items as (DrawablePolyline | DrawableText)[]} .canvas=${canvas}></multipleedit-element>`;
            render(html`${panelDivider}${selectionActions}${polylinePanel}${textPanel}`, document.getElementById("panelSelected"));
            enterEditingEditors(EditorName.MULTIPLE_EDIT);
            setActiveTool("buttonSelect", `${items.length} objects selected · Drag to move · Delete removes selection`);
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
                .titleValue=${this.annotationTitleDraft}
                .editMode="${editMode}"
                .canCreate=${!isReadOnly && this.userId > 0 && !!this.chipContent}
                .dirty=${this.annotationDirty}
                .canUndo=${isEditingEnabled && annotationHistory.canUndo()}
                .canRedo=${isEditingEnabled && annotationHistory.canRedo()}
                .onAnnotationChanged=${(title: string) => this.onAnnotationTitleChanged(title)}
                .onAnnotationSaved=${() => {
                    this.annotationTitleDraft = this.annotation ? (this.annotation.title || '') : '';
                    this.markAnnotationClean();
                }}
                .canDiscardCurrentAnnotation=${() => this.confirmDiscardCurrentAnnotation()}
                .onAnnotationCreated=${() => {
                    this.allowNextAnnotationSelectionDiscard = true;
                }}
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
        this.updateAnnotationDirtyState(false);
    }

    private onUserChange(userId: number, userName: string) {
        if (this.userId === userId && this.userName === userName) return;
        this.userId = userId;
        this.userName = userName;
        this.refresh();
    }

    onSelectChip(chip: Chip) {
        this.chip = chip;
        this.annotationTitleDraft = '';
        annotationHistory.reset();
        this.markAnnotationClean(false);
        this.refresh();
        Selection.deselectAny();
        enterBaseEditors();
    }

    onSelectChipContent(chipContent: ChipContent) {
        this.chipContent = chipContent;
        this.annotationTitleDraft = '';
        this.refresh();
        canvas.loadChip(chipContent);
        annotationHistory.reset();
        this.markAnnotationClean(false);
        Selection.deselectAny();
        enterBaseEditors();
        canvas.requestRender();
    }

    onSelectAnnotation(annotation: Annotation, data: AnnotationData) {
        this.annotation = annotation;
        this.annotationTitleDraft = annotation ? (annotation.title || '') : '';

        canvas.loadData(data);
        annotationHistory.reset();

        Selection.deselectAny();
        enterBaseEditors();
        canvas.requestRender();
        this.refresh();
        this.markAnnotationClean();
    }

    private confirmDiscardCurrentAnnotation(): boolean {
        if (this.allowNextAnnotationSelectionDiscard) {
            this.allowNextAnnotationSelectionDiscard = false;
            return true;
        }
        this.updateAnnotationDirtyState(false);
        if (!this.annotationDirty) return true;
        return window.confirm("Discard unsaved annotation changes?");
    }

    private markAnnotationClean(refresh: boolean = true) {
        this.annotationBaselineSnapshot = this.createAnnotationSnapshot();
        const changed = this.annotationDirty;
        this.annotationDirty = false;
        if (refresh && changed) this.refresh();
    }

    private updateAnnotationDirtyState(refresh: boolean = true) {
        const next = this.hasAnnotationChanges();
        if (this.annotationDirty === next) return;
        this.annotationDirty = next;
        if (refresh) this.refresh();
    }

    private hasAnnotationChanges(): boolean {
        if (this.getEditMode() === 'none' || !this.annotationBaselineSnapshot) return false;
        return this.createAnnotationSnapshot() !== this.annotationBaselineSnapshot;
    }

    private createAnnotationSnapshot(): string {
        if (!this.annotation || !canvas) return "";
        return JSON.stringify({
            title: this.getCurrentAnnotationTitle(),
            data: canvas.save(),
        });
    }

    private getCurrentAnnotationTitle(): string {
        const title = this.annotationTitleDraft !== undefined && this.annotationTitleDraft !== null
            ? this.annotationTitleDraft
            : (this.annotation ? this.annotation.title : "");
        return title || "untitled";
    }

    private onAnnotationTitleChanged(title: string) {
        this.annotationTitleDraft = title;
        this.updateAnnotationDirtyState();
    }
}

new App().start();

let toastTimeout: number = undefined;
let toastHideTimeout: number = undefined;
function showToast(detail: ToastDetail) {
    if (toastTimeout) clearTimeout(toastTimeout);
    if (toastHideTimeout) clearTimeout(toastHideTimeout);

    let element = document.getElementById("toast");
    if (element) {
        element.classList.remove("hiding");
        element.classList.remove("toast-saving", "toast-success", "toast-copied", "toast-pasted", "toast-warning", "toast-error");
        element.classList.add(`toast-${detail.kind}`);
        element.classList.add("visible");
        element.innerText = detail.message;
        element.style.display = "block";
        if (detail.kind === "saving") return;
        toastTimeout = setTimeout(() => {
            element.classList.remove("visible");
            element.classList.add("hiding");
            toastHideTimeout = setTimeout(() => {
                element.classList.remove("hiding");
                element.innerText = "";
                element.style.display = "none";
            }, 300);
        }, 2000);
    }
}

window.addEventListener("chipannotation-toast", (ev: Event) => {
    const custom = ev as CustomEvent<ToastDetail>;
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

    // Save remains available while editing the annotation title.
    if (ctrlDown && evt.key.toLowerCase() === 's') {
        if (!isEditingEnabled) return true;
        evt.preventDefault();
        (document.getElementById("buttonSaveAnnotation") as HTMLButtonElement)?.click();
        return false;
    }

    if (evt.target !== document.body && evt.target !== document.getElementById("canvas2d")) {
        return true;
    }

    if (!ctrlDown && !evt.altKey) {
        const key = evt.key.toLowerCase();
        const toolButtonByKey: Record<string, string> = {
            v: "buttonSelect",
            h: "buttonPan",
            p: "buttonCreatePolyline",
            r: "buttonCreateRect",
            t: "buttonCreateText",
        };
        const buttonId = toolButtonByKey[key];
        const button = buttonId ? document.getElementById(buttonId) as HTMLButtonElement : null;
        if (button && !button.disabled && (buttonId === "buttonSelect" || buttonId === "buttonPan" || isEditingEnabled)) {
            evt.preventDefault();
            button.click();
            return false;
        }
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
        notifyToast("Cut", "warning");
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
        notifyToast("Copied", "copied");
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
            notifyToast("Pasted", "pasted");
        }
    });

    return false;
}
document.body.addEventListener("keydown", interceptKeys);

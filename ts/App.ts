import {Canvas} from "./Canvas";
import {Chip, ChipContent} from "./data/Chip";
import { ANNOTATION_DATA_VERSION, Annotation, AnnotationContent, AnnotationData } from './data/Annotation';
import {html, render} from "lit-html";
import "./elements/SelectElement";
import type {SharedChipFocus} from "./elements/SelectElement";
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
import {EditorSelect} from "./editors/EditorSelect";
import packageJson from "../package.json";
import {packRgba} from "./util/Color";
import {upgradeAnnotationData} from "./data/AnnotationDataUpgrade";
import {annotationHistory} from "./history/AnnotationHistory";
import {notifyToast, ToastDetail} from "./util/Toast";
import {commentsPanel} from "./comments/CommentsPanel";

let url_string = window.location.href;
let url = new URL(url_string);
let isReadOnly = !!url.searchParams.get("readonly");
const editorLayoutMedia = window.matchMedia("(min-width: 900px)");
let isEditingEnabled = false;
let isSelectionEnabled = false;
type PrimaryMouseTool = "select" | "pan";
let primaryMouseTool: PrimaryMouseTool = "select";
let primaryMouseToolSelectedByUser = false;

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

canvas.addLayers(...Layers.create(canvas));
canvas.addEditors(...Editors.create(canvas));

function enterBaseEditors() {
    const selectEditor = canvas.findEditor(EditorName.SELECT) as EditorSelect;
    if (selectEditor) selectEditor.measurementOnly = !isEditingEnabled;
    EditorCameraControl.allowLeftMousePan = !isSelectionEnabled || primaryMouseTool === "pan";
    canvas.getElement().style.cursor = primaryMouseTool === "pan" ? "grab" : "";
    canvas.enterEditors(
        EditorName.CAMERA_CONTROL,
        ...(isSelectionEnabled && primaryMouseTool === "select" ? [EditorName.SELECT] : []),
    );
    restorePrimaryToolHighlight();
}

function enterEditingEditors(...editors: EditorName[]) {
    const selectEditor = canvas.findEditor(EditorName.SELECT) as EditorSelect;
    if (selectEditor) selectEditor.measurementOnly = false;
    primaryMouseTool = "select";
    EditorCameraControl.allowLeftMousePan = false;
    canvas.getElement().style.cursor = "";
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

function setActiveTool(buttonId: string) {
    document.querySelectorAll<HTMLButtonElement>("#toolRail .tool-button").forEach(button => {
        button.classList.toggle("active", button.id === buttonId);
    });
}

function activatePrimaryMouseTool(tool: PrimaryMouseTool) {
    primaryMouseTool = tool;
    primaryMouseToolSelectedByUser = true;
    Selection.deselectAny();
    enterBaseEditors();
}

function restorePrimaryToolHighlight() {
    setActiveTool(primaryMouseTool === "select" ? "buttonSelect" : "buttonPan");
}

function renderFocusSelectionButton(drawables: Drawable[]) {
    return html`
        <button class="iconButton selectionFocusButton" type="button" title="Focus selection" aria-label="Focus selection"
            @click=${() => {
                canvas.focusDrawables(drawables);
                canvas.getElement().focus({preventScroll: true});
            }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4"/>
                <rect x="8" y="8" width="8" height="8" rx="1"/>
            </svg>
        </button>`;
}

function prepareCreateTool(buttonId: string, selectionType: SelectType): boolean {
    const selected = Selection.getSelected();
    if (selected.type !== selectionType) return true;
    const button = document.getElementById(buttonId);
    const togglingOff = !!button && button.classList.contains("active");
    Selection.deselect(selectionType);
    return !togglingOff;
}

document.getElementById("buttonSelect").onclick = () => {
    if (!isSelectionEnabled) return;
    activatePrimaryMouseTool("select");
};
document.getElementById("buttonPan").onclick = () => {
    activatePrimaryMouseTool("pan");
};

document.getElementById("buttonCreatePolyline").onclick = () => {
    if (!isEditingEnabled) return;
    if (!prepareCreateTool("buttonCreatePolyline", SelectType.POLYLINE_CREATE)) return;
    polylineCreateMode = "polyline";
    let polyline = new DrawablePolyline(new DrawablePolylinePack(
        [], true, new Size(2),
        true, packRgba(255, 255, 255, 64),
        true, packRgba(255, 255, 255, 191),
    ));
    canvas.env.addPolyline(polyline);
    Selection.select(SelectType.POLYLINE_CREATE, polyline);
    setActiveTool("buttonCreatePolyline");
};
document.getElementById("buttonCreateRect").onclick = () => {
    if (!isEditingEnabled) return;
    if (!prepareCreateTool("buttonCreateRect", SelectType.POLYLINE_CREATE)) return;
    polylineCreateMode = "rect";
    let polyline = new DrawablePolyline(new DrawablePolylinePack(
        [], true, new Size(2),
        true, packRgba(255, 255, 255, 64),
        true, packRgba(255, 255, 255, 191),
    ));
    canvas.env.addPolyline(polyline);
    Selection.select(SelectType.POLYLINE_CREATE, polyline);
    setActiveTool("buttonCreateRect");
};

document.getElementById("buttonCreateText").onclick = () => {
    if (!isEditingEnabled) return;
    if (!prepareCreateTool("buttonCreateText", SelectType.TEXT_CREATE)) return;
    let text = new DrawableText(new DrawableTextPack(
        "text",
        packRgba(255, 255, 255, 255), new Size(20),
        0, 0, false
    ));
    canvas.env.addText(text);
    Selection.select(SelectType.TEXT_CREATE, text);
    setActiveTool("buttonCreateText");
};
document.getElementById("buttonUndo").onclick = () => {
    if (isEditingEnabled) annotationHistory.undo(canvas);
};
document.getElementById("buttonRedo").onclick = () => {
    if (isEditingEnabled) annotationHistory.redo(canvas);
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

    private ownsCurrentAnnotation(): boolean {
        return !isReadOnly && !!this.annotation && this.userId > 0
            && this.annotation.aid > 0 && this.annotation.userId === this.userId;
    }

    private getEditMode(): 'none' | 'create' | 'update' {
        return editorLayoutMedia.matches && this.ownsCurrentAnnotation() ? 'update' : 'none';
    }

    private applyEditMode() {
        const editMode = this.getEditMode();
        const editable = editMode !== 'none';
        const selectable = editorLayoutMedia.matches && !!this.annotation && this.annotation.aid > 0;
        if (editable && !isEditingEnabled && !primaryMouseToolSelectedByUser) primaryMouseTool = "select";
        const toolRail = document.getElementById("toolRail");
        if (toolRail) toolRail.hidden = !selectable;
        const capabilityChanged = isEditingEnabled !== editable || isSelectionEnabled !== selectable;
        document.getElementById("editControls").hidden = !editable;
        if (!capabilityChanged) {
            restorePrimaryToolHighlight();
            return;
        }
        isEditingEnabled = editable;
        isSelectionEnabled = selectable;
        if (capabilityChanged) Selection.deselectAny();
        enterBaseEditors();
    }

    public start() {
        render(html`
            <select-element 
                .onSelectChip=${(chip: Chip) => this.onSelectChip(chip)}
                .onSelectChipContent=${(chipContent: ChipContent, sharedFocus?: SharedChipFocus) => this.onSelectChipContent(chipContent, sharedFocus)}
                .onSelectAnnotation=${(annotation: Annotation, data: AnnotationData, focus: boolean) => this.onSelectAnnotation(annotation, data, focus)}
                .canDiscardCurrentAnnotation=${() => this.confirmDiscardCurrentAnnotation()}
                .isCurrentAnnotationDirty=${() => this.hasAnnotationChanges()}
            ></select-element>
        `, document.getElementById("selectPanel"));
        this.refresh();
        editorLayoutMedia.addEventListener("change", () => this.refresh());
        annotationHistory.subscribe(() => this.updateAnnotationDirtyState());
        window.addEventListener("beforeunload", (event) => {
            if (!this.annotationDirty) return;
            event.preventDefault();
            event.returnValue = "";
        });

        const panelDivider = html`<div class="panel-divider"></div>`;

        Selection.register(SelectType.POLYLINE, (polyline) => {
            const focusAction = renderFocusSelectionButton([polyline]);
            const panel = html`<polylineedit-element .polylines=${[polyline]} .canvas=${canvas} .chipContent=${this.chipContent}
                .measurementOnly=${!isEditingEnabled} .extraActions=${focusAction}></polylineedit-element>`;
            render(html`${panelDivider}${panel}`, document.getElementById("panelSelected"));
            if (isEditingEnabled) enterEditingEditors(EditorName.POLYLINE_EDIT);
            else enterBaseEditors();
            setActiveTool("buttonSelect");
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            enterBaseEditors();
            restorePrimaryToolHighlight();
        });

        Selection.register(SelectType.POLYLINE_CREATE, (polyline) => {
            render(html`${panelDivider}<polylineedit-element .polylines=${[polyline]} .canvas=${canvas} .chipContent=${this.chipContent} .showMeasurement=${false}></polylineedit-element>`, document.getElementById("panelSelected"));
            const createEditor = polylineCreateMode === "rect" ? EditorName.RECT_CREATE : EditorName.POLYLINE_CREATE;
            enterEditingEditors(createEditor);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            polylineCreateMode = "polyline";
            enterBaseEditors();
            restorePrimaryToolHighlight();
        });

        Selection.register(SelectType.TEXT, (text) => {
            const focusAction = renderFocusSelectionButton([text]);
            const panel = isEditingEnabled
                ? html`<textedit-element .texts=${[text]} .canvas=${canvas} .extraActions=${focusAction}></textedit-element>`
                : html`<div class="toolButtonRow">${focusAction}</div>`;
            render(html`${panelDivider}${panel}`, document.getElementById("panelSelected"));
            if (isEditingEnabled) enterEditingEditors(EditorName.TEXT_EDIT);
            else enterBaseEditors();
            setActiveTool("buttonSelect");
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            enterBaseEditors();
            restorePrimaryToolHighlight();
        });

        Selection.register(SelectType.TEXT_CREATE, (text) => {
            render(html`${panelDivider}${text.renderUi(canvas)}`, document.getElementById("panelSelected"));
            enterEditingEditors(EditorName.TEXT_CREATE);
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            enterBaseEditors();
            restorePrimaryToolHighlight();
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
                ? html`<polylineedit-element .polylines=${polylines} .linkedDrawables=${items as (DrawablePolyline | DrawableText)[]} .showActions=${false} .showTransformActions=${false} .measurementOnly=${!isEditingEnabled} .canvas=${canvas} .chipContent=${this.chipContent}></polylineedit-element>`
                : html``;
            const textPanel = isEditingEnabled && texts.length > 0
                ? html`<textedit-element .texts=${texts} .showActions=${false} .canvas=${canvas}></textedit-element>`
                : html``;
            const focusAction = renderFocusSelectionButton(items as Drawable[]);
            const selectionActions = isEditingEnabled
                ? html`<multipleedit-element .drawables=${items as (DrawablePolyline | DrawableText)[]} .canvas=${canvas} .extraActions=${focusAction}></multipleedit-element>`
                : html`<div class="toolButtonRow">${focusAction}</div>`;
            render(html`${panelDivider}${selectionActions}${polylinePanel}${textPanel}`, document.getElementById("panelSelected"));
            if (isEditingEnabled) enterEditingEditors(EditorName.MULTIPLE_EDIT);
            else enterBaseEditors();
            setActiveTool("buttonSelect");
        }, () => {
            render(html``, document.getElementById("panelSelected"));
            enterBaseEditors();
            restorePrimaryToolHighlight();
        });
    }

    private refresh() {
        const editMode = this.getEditMode();
        const canCreate = editorLayoutMedia.matches && !isReadOnly && this.userId > 0 && !!this.chipContent;
        const selectElement = document.querySelector('select-element') as HTMLElement & { canCreateAnnotation?: boolean };
        if (selectElement) {
            selectElement.canCreateAnnotation = canCreate;
        }
        render(html`
            <title-element 
                .canvas="${canvas}"
                .chipContent="${this.chipContent}"
                .annotation="${this.annotation}"
                .titleValue=${this.annotationTitleDraft}
                .editMode="${editMode}"
                .canCreate=${canCreate}
                .dirty=${this.annotationDirty}
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
            ></title-element>
        `, document.getElementById("annotationTitle"));
        const titleElement = document.querySelector("title-element") as HTMLElement & { updateComplete?: Promise<unknown> };
        if (titleElement && titleElement.updateComplete) titleElement.updateComplete.then(updateHistoryButtons);
        this.applyEditMode();
        this.updateAnnotationDirtyState(false);
    }

    private onUserChange(userId: number, userName: string) {
        commentsPanel.setUser(userId, userName);
        if (this.userId === userId && this.userName === userName) return;
        this.userId = userId;
        this.userName = userName;
        this.refresh();
    }

    onSelectChip(chip: Chip) {
        this.chip = chip;
        this.annotation = null;
        this.annotationTitleDraft = '';
        canvas.getElement().focus({preventScroll: true});
        annotationHistory.reset();
        this.markAnnotationClean(false);
        this.refresh();
        Selection.deselectAny();
        enterBaseEditors();
    }

    onSelectChipContent(chipContent: ChipContent, sharedFocus?: SharedChipFocus) {
        this.chipContent = chipContent;
        this.annotationTitleDraft = '';
        this.refresh();
        canvas.loadChip(chipContent);
        if (sharedFocus) canvas.focusAABB(sharedFocus.bounds, sharedFocus.padding);
        annotationHistory.reset();
        this.markAnnotationClean(false);
        Selection.deselectAny();
        enterBaseEditors();
        canvas.requestRender();
    }

    onSelectAnnotation(annotation: Annotation, data: AnnotationData, focus: boolean = false) {
        const previousAnnotationId = this.annotation ? this.annotation.aid : 0;
        this.annotation = annotation;
        this.annotationTitleDraft = annotation ? (annotation.title || '') : '';
        if (annotation && annotation.aid > 0 && annotation.aid !== previousAnnotationId && !this.ownsCurrentAnnotation()) {
            primaryMouseTool = "pan";
            primaryMouseToolSelectedByUser = false;
        }

        canvas.loadData(data);
        if (focus) canvas.focusData();
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
        if (!this.ownsCurrentAnnotation() || !this.annotationBaselineSnapshot) return false;
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
            "1": "buttonSelect",
            "2": "buttonPan",
            "3": "buttonCreatePolyline",
            "4": "buttonCreateRect",
            "5": "buttonCreateText",
        };
        const buttonId = toolButtonByKey[key];
        const button = buttonId ? document.getElementById(buttonId) as HTMLButtonElement : null;
        const primaryToolAvailable = buttonId === "buttonPan" || (buttonId === "buttonSelect" && isSelectionEnabled);
        if (button && !button.disabled && (primaryToolAvailable || isEditingEnabled)) {
            evt.preventDefault();
            button.click();
            return false;
        }
    }

    // Check for undo/redo
    if (ctrlDown && evt.key.toLowerCase() === 'z' && !evt.shiftKey) {
        if (!isEditingEnabled) return true;
        evt.preventDefault();
        annotationHistory.undo(canvas);
        return false;
    }
    else if ((ctrlDown && evt.key.toLowerCase() === 'z' && evt.shiftKey) || (ctrlDown && evt.key.toLowerCase() === 'y')) {
        if (!isEditingEnabled) return true;
        evt.preventDefault();
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

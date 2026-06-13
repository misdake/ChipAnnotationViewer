import { Canvas } from "../Canvas";
import { Drawable } from "../drawable/Drawable";
import { DrawablePolyline, DrawablePolylinePack, Point } from "../editable/DrawablePolyline";
import { DrawableText, DrawableTextPack } from "../editable/DrawableText";
import { Selection, SelectType } from "../layers/Selection";
import { Size } from "../util/Size";
import { HistoryTimeline } from "./HistoryTimeline";
import { reconcileEntities } from "./EntityReconciler";

type EntityKind = "polyline" | "text";
export type HistoryDrawable = DrawablePolyline | DrawableText;

export interface EntitySnapshot {
    kind: EntityKind;
    id: number;
    index: number;
    value: DrawablePolylinePack | DrawableTextPack;
}

export interface SelectionSnapshotItem {
    kind: EntityKind;
    id: number;
}

export interface SelectionSnapshot {
    type: SelectType;
    items: SelectionSnapshotItem[];
}

export interface EntityChangeSet {
    entities: EntitySnapshot[];
    selection: SelectionSnapshot;
}

export interface HistoryTransaction {
    readonly kind: string;
    readonly mergeKey?: string;
    readonly before: EntityChangeSet;
    readonly keys: Set<string>;
    active: boolean;
}

type HistoryListener = () => void;

const MERGE_WINDOW_MS = 600;

export class AnnotationHistory {
    private listeners: HistoryListener[] = [];
    private readonly timeline: HistoryTimeline<EntityChangeSet>;
    private activeTransaction: HistoryTransaction = null;

    public constructor(limit: number = 100) {
        this.timeline = new HistoryTimeline(limit, MERGE_WINDOW_MS);
    }

    public reset(): void {
        if (this.activeTransaction) this.activeTransaction.active = false;
        this.activeTransaction = null;
        this.timeline.reset();
        this.notify();
    }

    public canUndo(): boolean {
        return this.timeline.canUndo();
    }

    public canRedo(): boolean {
        return this.timeline.canRedo();
    }

    public subscribe(listener: HistoryListener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(item => item !== listener);
        };
    }

    public change(
        canvas: Canvas,
        drawables: Drawable[],
        kind: string,
        mutate: () => void,
        mergeKey?: string,
    ): boolean {
        this.commitActive(canvas);
        const targets = requireHistoryDrawables(drawables);
        const before = this.capture(canvas, targets);
        try {
            mutate();
        } catch (error) {
            this.restore(canvas, before, before.entities.map(entityKey));
            throw error;
        }
        const after = this.captureByKeys(canvas, before.entities.map(entityKey), this.captureSelection());
        canvas.requestRender();
        return this.record(kind, before, after, mergeKey);
    }

    public begin(canvas: Canvas, drawables: Drawable[], kind: string, mergeKey?: string): HistoryTransaction {
        if (this.activeTransaction) throw new Error("A history transaction is already active");
        const before = this.capture(canvas, requireHistoryDrawables(drawables));
        this.activeTransaction = {
            kind,
            mergeKey,
            before,
            keys: new Set(before.entities.map(entityKey)),
            active: true,
        };
        return this.activeTransaction;
    }

    public trackAdded(transaction: HistoryTransaction, drawables: Drawable[]): void {
        this.assertActive(transaction);
        for (const drawable of requireHistoryDrawables(drawables)) {
            transaction.keys.add(drawableKey(drawable));
        }
    }

    public commit(canvas: Canvas, transaction: HistoryTransaction): boolean {
        this.assertActive(transaction);
        const after = this.captureByKeys(canvas, Array.from(transaction.keys), this.captureSelection());
        transaction.active = false;
        this.activeTransaction = null;
        return this.record(transaction.kind, transaction.before, after, transaction.mergeKey);
    }

    public cancel(canvas: Canvas, transaction: HistoryTransaction): void {
        this.assertActive(transaction);
        transaction.active = false;
        this.activeTransaction = null;
        this.restore(canvas, transaction.before, Array.from(transaction.keys));
    }

    public commitActive(canvas: Canvas): boolean {
        return this.activeTransaction ? this.commit(canvas, this.activeTransaction) : false;
    }

    public isActive(transaction: HistoryTransaction): boolean {
        return !!transaction && transaction.active && this.activeTransaction === transaction;
    }

    public undo(canvas: Canvas): void {
        this.commitActive(canvas);
        const entry = this.timeline.peekUndo();
        if (!entry) return;
        this.restore(canvas, entry.before, changedKeys(entry.before, entry.after));
        this.timeline.completeUndo(entry);
        this.notify();
    }

    public redo(canvas: Canvas): void {
        this.commitActive(canvas);
        const entry = this.timeline.peekRedo();
        if (!entry) return;
        this.restore(canvas, entry.after, changedKeys(entry.before, entry.after));
        this.timeline.completeRedo(entry);
        this.notify();
    }

    public mutatePolyline(canvas: Canvas, polyline: DrawablePolyline, kind: string, mutate: (polyline: DrawablePolyline) => void, mergeKey?: string): void {
        this.change(canvas, [polyline], kind, () => mutate(polyline), mergeKey);
    }

    public mutateText(canvas: Canvas, text: DrawableText, kind: string, mutate: (text: DrawableText) => void, mergeKey?: string): void {
        this.change(canvas, [text], kind, () => mutate(text), mergeKey);
    }

    public mutateDrawables(canvas: Canvas, drawables: Drawable[], kind: string, mutate: (drawables: HistoryDrawable[]) => void, mergeKey?: string): void {
        const supported = requireHistoryDrawables(drawables);
        this.change(canvas, supported, kind, () => mutate(supported), mergeKey);
    }

    public addDrawables(canvas: Canvas, drawables: Drawable[], kind: string = "selection.add"): void {
        this.commitActive(canvas);
        const supported = requireHistoryDrawables(drawables);
        const before: EntityChangeSet = { entities: [], selection: this.captureSelection() };
        for (const drawable of supported) {
            if (drawable instanceof DrawablePolyline) canvas.env.addPolyline(drawable);
            else canvas.env.addText(drawable);
        }
        this.selectDrawables(supported);
        const after = this.capture(canvas, supported);
        canvas.requestRender();
        this.record(kind, before, after);
    }

    public removeDrawables(canvas: Canvas, drawables: Drawable[], kind: string = "selection.remove"): void {
        this.commitActive(canvas);
        const supported = requireHistoryDrawables(drawables);
        const before = this.capture(canvas, supported);
        Selection.deselectAny();
        for (const drawable of supported) {
            if (drawable instanceof DrawablePolyline) canvas.env.removePolyline(drawable);
            else canvas.env.removeText(drawable);
        }
        const after: EntityChangeSet = { entities: [], selection: this.captureSelection() };
        canvas.requestRender();
        this.record(kind, before, after);
    }

    public cloneDrawables(canvas: Canvas, drawables: Drawable[], offsetX: number, offsetY: number, kind: string = "selection.clone"): void {
        const originals = requireHistoryDrawables(drawables);
        const transaction = this.begin(canvas, [], kind);
        try {
            const clones: HistoryDrawable[] = [];
            for (const drawable of originals) {
                const clone = drawable.cloneOnCanvas(canvas, offsetX, offsetY);
                if (clone instanceof DrawablePolyline || clone instanceof DrawableText) clones.push(clone);
            }
            if (clones.length === 0) {
                this.cancel(canvas, transaction);
                return;
            }
            this.trackAdded(transaction, clones);
            this.selectDrawables(clones);
            // Selection callbacks can synchronously exit the current editor,
            // which commits the active transaction before selectDrawables returns.
            if (this.isActive(transaction)) this.commit(canvas, transaction);
        } catch (error) {
            if (this.isActive(transaction)) this.cancel(canvas, transaction);
            throw error;
        }
    }

    public recordCreated(canvas: Canvas, drawables: HistoryDrawable[], kind: string): void {
        this.commitActive(canvas);
        const before: EntityChangeSet = { entities: [], selection: emptySelection() };
        const after = this.capture(canvas, drawables);
        this.record(kind, before, after);
    }

    public mergeKey(kind: string, drawables: Drawable[]): string {
        const ids = requireHistoryDrawables(drawables).map(drawableKey).sort().join(",");
        return `${kind}:${ids}`;
    }

    private capture(canvas: Canvas, drawables: HistoryDrawable[]): EntityChangeSet {
        return {
            entities: drawables.map(drawable => captureEntity(canvas, drawable)),
            selection: this.captureSelection(),
        };
    }

    private captureByKeys(canvas: Canvas, keys: string[], selection: SelectionSnapshot): EntityChangeSet {
        const entities: EntitySnapshot[] = [];
        for (const key of keys) {
            const drawable = findDrawable(canvas, key);
            if (drawable) entities.push(captureEntity(canvas, drawable));
        }
        return { entities, selection };
    }

    private restore(canvas: Canvas, target: EntityChangeSet, keys: string[]): void {
        restoreKind(canvas.env.polylines, target.entities, "polyline", keys, snapshot =>
            new DrawablePolyline(clonePolylinePack(snapshot.value as DrawablePolylinePack), snapshot.id));
        restoreKind(canvas.env.texts, target.entities, "text", keys, snapshot =>
            new DrawableText(cloneTextPack(snapshot.value as DrawableTextPack), snapshot.id));
        this.restoreSelection(canvas, target.selection);
        canvas.requestRender();
    }

    private captureSelection(): SelectionSnapshot {
        const selected = Selection.getSelected();
        if (!selected.type || !selected.item) return emptySelection();
        if (selected.type === SelectType.POLYLINE || selected.type === SelectType.POLYLINE_CREATE) {
            return selectionForSingle("polyline", (selected.item as DrawablePolyline).historyId);
        }
        if (selected.type === SelectType.TEXT || selected.type === SelectType.TEXT_CREATE) {
            return selectionForSingle("text", (selected.item as DrawableText).historyId);
        }
        return {
            type: SelectType.MULTIPLE,
            items: (selected.item as Drawable[]).map(selectionItem).filter(item => !!item),
        };
    }

    private restoreSelection(canvas: Canvas, snapshot: SelectionSnapshot): void {
        const items = snapshot.items.map(item => findDrawable(canvas, `${item.kind}:${item.id}`)).filter(item => !!item);
        if (snapshot.type === SelectType.MULTIPLE && items.length > 1) Selection.select(SelectType.MULTIPLE, items);
        else if (items.length === 1 && items[0] instanceof DrawablePolyline) Selection.select(SelectType.POLYLINE, items[0]);
        else if (items.length === 1 && items[0] instanceof DrawableText) Selection.select(SelectType.TEXT, items[0]);
        else Selection.deselectAny();
    }

    private selectDrawables(drawables: HistoryDrawable[]): void {
        if (drawables.length === 1 && drawables[0] instanceof DrawablePolyline) Selection.select(SelectType.POLYLINE, drawables[0]);
        else if (drawables.length === 1 && drawables[0] instanceof DrawableText) Selection.select(SelectType.TEXT, drawables[0]);
        else if (drawables.length > 1) Selection.select(SelectType.MULTIPLE, drawables);
    }

    private assertActive(transaction: HistoryTransaction): void {
        if (!transaction.active || this.activeTransaction !== transaction) throw new Error("History transaction is already closed");
    }

    private record(kind: string, before: EntityChangeSet, after: EntityChangeSet, mergeKey?: string): boolean {
        if (sameChangeSet(before, after)) return false;
        this.timeline.record({ kind, before, after, mergeKey, timestamp: Date.now() });
        this.notify();
        return true;
    }

    private notify(): void {
        for (const listener of this.listeners.slice()) listener();
    }
}

export const annotationHistory = new AnnotationHistory();

export function clonePolylinePack(pack: DrawablePolylinePack): DrawablePolylinePack {
    return new DrawablePolylinePack(
        (pack.points || []).map(point => new Point(point.x, point.y)),
        pack.closed,
        new Size(pack.lineWidth.onScreen, pack.lineWidth.onCanvas),
        pack.fill,
        pack.fillColor,
        pack.stroke,
        pack.strokeColor,
    );
}

export function cloneTextPack(pack: DrawableTextPack): DrawableTextPack {
    return new DrawableTextPack(pack.text, pack.color, new Size(pack.fontSize.onScreen, pack.fontSize.onCanvas), pack.x, pack.y, !!pack.multiline);
}

function captureEntity(canvas: Canvas, drawable: HistoryDrawable): EntitySnapshot {
    if (drawable instanceof DrawablePolyline) {
        const index = canvas.env.polylines.indexOf(drawable);
        if (index < 0) throw new Error("Cannot capture a polyline outside the canvas");
        return { kind: "polyline", id: drawable.historyId, index, value: clonePolylinePack(drawable.pack()) };
    }
    const index = canvas.env.texts.indexOf(drawable);
    if (index < 0) throw new Error("Cannot capture text outside the canvas");
    return { kind: "text", id: drawable.historyId, index, value: cloneTextPack(drawable.pack()) };
}

function restoreKind<T extends HistoryDrawable>(
    target: T[], snapshots: EntitySnapshot[], kind: EntityKind, keys: string[], create: (snapshot: EntitySnapshot) => T,
): void {
    const affectedIds = new Set(keys.filter(key => key.startsWith(`${kind}:`)).map(key => Number(key.slice(kind.length + 1))));
    const relevant = snapshots.filter(snapshot => snapshot.kind === kind).sort((a, b) => a.index - b.index);
    reconcileEntities(
        target,
        relevant,
        affectedIds,
        item => item.historyId,
        create,
        (item, snapshot) => {
            if (item instanceof DrawablePolyline) item.applyPack(clonePolylinePack(snapshot.value as DrawablePolylinePack));
            else item.applyPack(cloneTextPack(snapshot.value as DrawableTextPack));
        },
    );
}

function changedKeys(before: EntityChangeSet, after: EntityChangeSet): string[] {
    return Array.from(new Set([...before.entities.map(entityKey), ...after.entities.map(entityKey)]));
}

function emptySelection(): SelectionSnapshot {
    return { type: null, items: [] };
}

function selectionForSingle(kind: EntityKind, id: number): SelectionSnapshot {
    return { type: kind === "polyline" ? SelectType.POLYLINE : SelectType.TEXT, items: [{ kind, id }] };
}

function selectionItem(drawable: Drawable): SelectionSnapshotItem {
    if (drawable instanceof DrawablePolyline) return { kind: "polyline", id: drawable.historyId };
    if (drawable instanceof DrawableText) return { kind: "text", id: drawable.historyId };
    return null;
}

function requireHistoryDrawables(drawables: Drawable[]): HistoryDrawable[] {
    return drawables.map(drawable => {
        if (drawable instanceof DrawablePolyline || drawable instanceof DrawableText) return drawable;
        throw new Error("Unsupported drawable in annotation history");
    });
}

function drawableKey(drawable: HistoryDrawable): string {
    return `${drawable instanceof DrawablePolyline ? "polyline" : "text"}:${drawable.historyId}`;
}

function entityKey(snapshot: EntitySnapshot): string {
    return `${snapshot.kind}:${snapshot.id}`;
}

function findDrawable(canvas: Canvas, key: string): HistoryDrawable {
    const separator = key.indexOf(":");
    const kind = key.slice(0, separator);
    const id = Number(key.slice(separator + 1));
    return kind === "polyline"
        ? canvas.env.polylines.find(item => item.historyId === id)
        : canvas.env.texts.find(item => item.historyId === id);
}

function sameChangeSet(a: EntityChangeSet, b: EntityChangeSet): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

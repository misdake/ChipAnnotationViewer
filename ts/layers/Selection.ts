import {Drawable} from "../drawable/Drawable";
import {DrawablePolyline} from "../editable/DrawablePolyline";
import {DrawableText} from "../editable/DrawableText";

export enum SelectType {
    POLYLINE = 1, // => Drawable
    POLYLINE_CREATE, // => Drawable
    TEXT, // => Drawable
    TEXT_CREATE, // => Drawable
    MULTIPLE, // => Drawable[]. modify array content to change selected instead of Select(MULTIPLE, new_array)
}

export type SingleSelectType =
    | SelectType.POLYLINE
    | SelectType.POLYLINE_CREATE
    | SelectType.TEXT
    | SelectType.TEXT_CREATE;

export type SelectionItemMap = {
    [SelectType.POLYLINE]: DrawablePolyline;
    [SelectType.POLYLINE_CREATE]: DrawablePolyline;
    [SelectType.TEXT]: DrawableText;
    [SelectType.TEXT_CREATE]: DrawableText;
    [SelectType.MULTIPLE]: Drawable[];
};

type SelectionItem = SelectionItemMap[SelectType];
type SelectionAnyItem = Drawable | Drawable[];
type SelectedState =
    | { type: null; item: null }
    | { [K in SelectType]: { type: K; item: SelectionItemMap[K] } }[SelectType];

interface SelectionCallbackEntry<T> {
    id: number;
    callback: T;
}

export class Selection {

    private static nextRegistrationId = 1;

    private static listSelect: SelectionCallbackEntry<(item: SelectionAnyItem) => void>[] = [];
    private static listDeselect: SelectionCallbackEntry<() => void>[] = [];
    private static mapSelect: { [key: number]: SelectionCallbackEntry<(item: SelectionAnyItem) => void>[] } = {};
    private static mapDeselect: { [key: number]: SelectionCallbackEntry<() => void>[] } = {};

    private static selected: SelectionAnyItem = null;
    private static selectedType: SelectType = null;

    public static register(onselect: (item: SelectionAnyItem) => void, ondeselect: () => void): () => void;
    public static register<T extends SelectType>(typeName: T, onselect: (item: SelectionItemMap[T]) => void, ondeselect: () => void): () => void;
    public static register<T extends SelectType>(
        typeNameOrOnselect: T | ((item: SelectionAnyItem) => void),
        onselectOrOndeselect: ((item: SelectionItemMap[T]) => void) | (() => void),
        ondeselectMaybe?: () => void,
    ): () => void {
        const registrationId = this.nextRegistrationId++;
        const hasType = typeof typeNameOrOnselect === 'number';
        const typeName = hasType ? typeNameOrOnselect as T : null;
        const onselect = hasType
            ? onselectOrOndeselect as (item: SelectionAnyItem) => void
            : typeNameOrOnselect as (item: SelectionAnyItem) => void;
        const ondeselect = hasType
            ? ondeselectMaybe
            : onselectOrOndeselect as () => void;

        if (typeName) {
            if (onselect) {
                this.mapSelect[typeName] = this.mapSelect[typeName] || [];
                this.mapSelect[typeName].push({ id: registrationId, callback: onselect });
            }
            if (ondeselect) {
                this.mapDeselect[typeName] = this.mapDeselect[typeName] || [];
                this.mapDeselect[typeName].push({ id: registrationId, callback: ondeselect });
            }
        } else {
            if (onselect) this.listSelect.push({ id: registrationId, callback: onselect });
            if (ondeselect) this.listDeselect.push({ id: registrationId, callback: ondeselect });
        }

        return () => this.unregister(registrationId);
    }

    public static unregister(registrationId: number): void {
        this.listSelect = this.listSelect.filter(item => item.id !== registrationId);
        this.listDeselect = this.listDeselect.filter(item => item.id !== registrationId);

        for (const key in this.mapSelect) {
            const type = parseInt(key, 10);
            this.mapSelect[type] = (this.mapSelect[type] || []).filter(item => item.id !== registrationId);
        }
        for (const key in this.mapDeselect) {
            const type = parseInt(key, 10);
            this.mapDeselect[type] = (this.mapDeselect[type] || []).filter(item => item.id !== registrationId);
        }
    }

    public static deselectAny() {
        if (this.selected) {
            this.deselect(this.selectedType);
        }
    }

    public static deselect(typeName: SelectType) {
        if (this.selectedType === typeName) {
            let ondeselect = this.mapDeselect[typeName];
            if (ondeselect) {
                for (let func of ondeselect) {
                    func.callback();
                }
            }
            for (let func of this.listDeselect) {
                func.callback();
            }

            // console.log("deselect", typeName);

            this.selectedType = null;
            this.selected = null;
        }
    }
    public static select<T extends SelectType>(typeName: T, item: SelectionItemMap[T]): void;
    public static select(typeName: SelectType, item: SelectionAnyItem): void;
    public static select(typeName: SelectType, item: SelectionAnyItem): void {
        if (this.selectedType !== typeName) this.deselectAny();

        // console.log("select", typeName, item);

        this.selected = item;
        this.selectedType = typeName;
        let onselect = this.mapSelect[typeName];
        if (onselect) {
            for (let func of onselect) {
                func.callback(item);
            }
        }
        for (let func of this.listSelect) {
            func.callback(item);
        }
    }

    public static getSelected(): SelectedState {
        if (!this.selectedType || !this.selected) {
            return { type: null, item: null };
        }
        return { item: this.selected, type: this.selectedType } as SelectedState;
    }

}

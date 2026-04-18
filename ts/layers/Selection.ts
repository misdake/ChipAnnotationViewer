import {Drawable} from "../drawable/Drawable";

export enum SelectType {
    POLYLINE = 1, // => Drawable
    POLYLINE_CREATE, // => Drawable
    TEXT, // => Drawable
    TEXT_CREATE, // => Drawable
    MULTIPLE, // => Drawable[]. modify array content to change selected instead of Select(MULTIPLE, new_array)
}

interface SelectionCallbackEntry<T> {
    id: number;
    callback: T;
}

export class Selection {

    private static nextRegistrationId = 1;

    private static listSelect: SelectionCallbackEntry<(item: Drawable | Drawable[]) => void>[] = [];
    private static listDeselect: SelectionCallbackEntry<() => void>[] = [];
    private static mapSelect: { [key: number]: SelectionCallbackEntry<(item: Drawable | Drawable[]) => void>[] } = {};
    private static mapDeselect: { [key: number]: SelectionCallbackEntry<() => void>[] } = {};

    private static selected: Drawable | Drawable[];
    private static selectedType: SelectType;

    public static register(typeName: SelectType, onselect: (item: Drawable | Drawable[]) => void, ondeselect: () => void): () => void {
        const registrationId = this.nextRegistrationId++;

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
    public static select(typeName: SelectType, item: Drawable | Drawable[]) {
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

    public static getSelected(): { item: Drawable | Drawable[], type: SelectType } {
        return {item: this.selected, type: this.selectedType};
    }

}

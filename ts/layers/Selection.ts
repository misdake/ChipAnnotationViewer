import {Drawable} from "../drawable/Drawable";

export enum SelectType {
    POLYLINE = 1, // => Drawable
    POLYLINE_CREATE, // => Drawable
    TEXT, // => Drawable
    TEXT_CREATE, // => Drawable
    MULTIPLE, // => Drawable[]. modify array content to change selected instead of Select(MULTIPLE, new_array)
}

export class Selection {

    private static listSelect: ((item: Drawable | Drawable[]) => void)[] = [];
    private static listDeselect: (() => void)[] = [];
    private static mapSelect: { [key: number]: ((item: Drawable | Drawable[]) => void)[] } = {};
    private static mapDeselect: { [key: number]: (() => void)[] } = {};

    private static selected: Drawable | Drawable[];
    private static selectedType: SelectType;

    public static register(typeName: SelectType, onselect: (item: Drawable | Drawable[]) => void, ondeselect: () => void) {
        if (typeName) {
            if (onselect) {
                this.mapSelect[typeName] = this.mapSelect[typeName] || [];
                this.mapSelect[typeName].push(onselect);
            }
            if (ondeselect) {
                this.mapDeselect[typeName] = this.mapDeselect[typeName] || [];
                this.mapDeselect[typeName].push(ondeselect);
            }
        } else {
            if (onselect) this.listSelect.push(onselect);
            if (ondeselect) this.listDeselect.push(ondeselect);
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
                    func();
                }
            }
            for (let func of this.listDeselect) {
                func();
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
                func(item);
            }
        }
        for (let func of this.listSelect) {
            func(item);
        }
    }

    public static getSelected(): { item: Drawable | Drawable[], type: SelectType } {
        return {item: this.selected, type: this.selectedType};
    }

}

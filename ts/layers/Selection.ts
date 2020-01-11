import {Drawable} from "../drawable/Drawable";
import {LayerName} from "./Layers";

export class Selection {

    private static listDeselect: (() => void)[] = [];
    private static mapSelect: { [key: number]: ((item: Drawable) => void)[] } = {};
    private static mapDeselect: { [key: number]: (() => void)[] } = {};

    private static selected: Drawable;
    private static selectedType: LayerName;

    public static register(typeName: LayerName, onselect: (item: Drawable) => void, ondeselect: () => void) {
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
            this.listDeselect.push(ondeselect);
        }
    }

    public static deselectAny() {
        if (this.selected) {
            this.deselect(this.selectedType);
        }
    }

    public static deselect(typeName: LayerName) {
        if (this.selectedType == typeName) {
            let ondeselect = this.mapDeselect[typeName];
            if (ondeselect) {
                for (let func of ondeselect) {
                    func();
                }
            }
            for (let func of this.listDeselect) {
                func();
            }

            this.selectedType = null;
            this.selected = null;
        }
    }
    public static select(typeName: LayerName, item: Drawable) {
        this.deselectAny();
        this.selected = item;
        this.selectedType = typeName;
        let onselect = this.mapSelect[typeName];
        if (onselect) {
            for (let func of onselect) {
                func(item);
            }
        }
    }

}

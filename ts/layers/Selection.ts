import {Drawable} from "../drawable/Drawable";

export class Selection {

    private static listDeselect: (() => void)[] = [];
    private static mapSelect: { [key: string]: (item: Drawable) => void } = {};
    private static mapDeselect: { [key: string]: () => void } = {};

    public static register(typeName: string, onselect: (item: Drawable) => void, ondeselect: () => void) {
        if (typeName) {
            if (onselect) this.mapSelect[typeName] = onselect;
            if (ondeselect) this.mapDeselect[typeName] = ondeselect;
        }
        this.listDeselect.push(ondeselect);
    }

    public static deselectAll() {
        for (const ondeselect of this.listDeselect) {
            ondeselect();
        }
    }

    public static deselect(typeName: string) {
        let ondeselect = this.mapDeselect[typeName];
        if (ondeselect) {
            ondeselect();
        }
    }
    public static select(typeName: string, item: Drawable) {
        this.deselectAll();
        let onselect = this.mapSelect[typeName];
        if (onselect) {
            onselect(item);
        }
    }

}
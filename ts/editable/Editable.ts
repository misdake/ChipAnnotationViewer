import {AlphaEntry, ColorEntry} from "../util/Color";
import {Canvas} from "../Canvas";
import {Selection, SelectType} from "../layers/Selection";
import {Drawable} from "../drawable/Drawable";

export interface EditablePick {
    isEditablePick: boolean;
    pickType : SelectType;
    pick(x:number, y:number, radius: number): boolean;
}

export interface EditableMove {
    isEditableMove: boolean;
    move(dx: number, dy: number): void;
    //TODO AABB & flip/rotate
}

export interface EditableColor {
    isEditableColor: boolean;
    setColorAlpha(color: ColorEntry, alpha: AlphaEntry): void;
}

export interface EditableDeleteClone {
    isEditableDeleteClone: boolean;
    deleteOnCanvas(canvas: Canvas): void;
    cloneOnCanvas(canvas: Canvas, offsetX: number, offsetY: number): Drawable | Drawable[];
}

export function editableMultiple(drawables: Drawable[]): EditableDeleteClone & EditableMove & EditableColor {
    return {
        isEditableMove: true,
        isEditableDeleteClone: true,
        isEditableColor: true,
        move: (dx: number, dy: number) => {
            for (let drawable of drawables) {
                if (drawable.hasOwnProperty("isEditableMove")) {
                    (<EditableMove><unknown>drawable).move(dx, dy);
                }
            }
        },
        deleteOnCanvas: (canvas: Canvas) => {
            for (let drawable of drawables) {
                if (drawable.hasOwnProperty("isEditableMove")) {
                    (<EditableDeleteClone><unknown>drawable).deleteOnCanvas(canvas);
                }
            }
            Selection.deselect(SelectType.MULTIPLE);
            canvas.requestRender();
        },
        cloneOnCanvas: (canvas: Canvas, offsetX: number, offsetY: number) => {
            let list: (Drawable & EditablePick)[] = [];
            for (let drawable of drawables) {
                if (drawable.hasOwnProperty("isEditableMove")) {
                    let d = (<EditableDeleteClone><unknown>drawable).cloneOnCanvas(canvas, offsetX, offsetY);
                    if (d) list.push(<Drawable & EditablePick>d);
                }
            }
            canvas.requestRender();
            return list;
        },
        setColorAlpha: (color: ColorEntry, alpha: AlphaEntry) => {
            for (let drawable of drawables) {
                (<EditableColor><unknown>drawable).setColorAlpha(color, alpha);
            }
        },
    };
}
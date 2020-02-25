import {AlphaEntry, ColorEntry} from "../util/Color";
import {Canvas} from "../Canvas";
import {Selection, SelectType} from "../layers/Selection";
import {Drawable} from "../drawable/Drawable";
import {AABB} from "../util/AABB";

export interface EditablePick {
    isEditablePick: boolean;
    pickType : SelectType;
    pick(x:number, y:number, radius: number): boolean;
}

export interface EditableMove {
    isEditableMove: boolean;
    move(dx: number, dy: number): void;

    aabb(): AABB;
    rotateCW(centerX: number, centerY: number): void;
    rotateCCW(centerX: number, centerY: number): void;
    flipX(centerX: number): void;
    flipY(centerY: number): void;
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

export function editableMultiple(input: Drawable[]): EditableDeleteClone & EditableMove & EditableColor {
    let drawables = <(EditableDeleteClone & EditableMove & EditableColor)[]><unknown>input;
    return {
        isEditableMove: true,
        isEditableDeleteClone: true,
        isEditableColor: true,
        move: (dx: number, dy: number) => {
            for (let drawable of drawables) {
                if (drawable.hasOwnProperty("isEditableMove")) {
                    drawable.move(dx, dy);
                }
            }
        },
        aabb(): AABB {
            return AABB.combineAll(drawables.map(i => i.aabb()));
        }, flipX(centerX: number): void {
            for (let drawable of drawables) drawable.flipX(centerX);
        }, flipY(centerY: number): void {
            for (let drawable of drawables) drawable.flipY(centerY);
        }, rotateCCW(centerX: number, centerY: number): void {
            for (let drawable of drawables) drawable.rotateCCW(centerX, centerY);
        }, rotateCW(centerX: number, centerY: number): void {
            for (let drawable of drawables) drawable.rotateCW(centerX, centerY);
        },
        deleteOnCanvas: (canvas: Canvas) => {
            for (let drawable of drawables) {
                if (drawable.hasOwnProperty("isEditableMove")) {
                    drawable.deleteOnCanvas(canvas);
                }
            }
            Selection.deselect(SelectType.MULTIPLE);
            canvas.requestRender();
        },
        cloneOnCanvas: (canvas: Canvas, offsetX: number, offsetY: number) => {
            let list: (Drawable & EditablePick)[] = [];
            for (let drawable of drawables) {
                if (drawable.hasOwnProperty("isEditableMove")) {
                    let d = drawable.cloneOnCanvas(canvas, offsetX, offsetY);
                    if (d) list.push(<Drawable & EditablePick>d);
                }
            }
            canvas.requestRender();
            return list;
        },
        setColorAlpha: (color: ColorEntry, alpha: AlphaEntry) => {
            for (let drawable of drawables) {
                drawable.setColorAlpha(color, alpha);
            }
        }
    };
}
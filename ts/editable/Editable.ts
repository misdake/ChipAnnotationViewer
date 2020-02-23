import {AlphaEntry, ColorEntry} from "../util/Color";
import {PrimitivePack} from "./Primitive";
import {Canvas} from "../Canvas";
import {SelectType} from "../layers/Selection";
import {Drawable} from "../drawable/Drawable";

export interface EditablePick {
    isEditablePick: boolean;
    pickType : SelectType;
    pick(x:number, y:number, radius: number): boolean;
}

export interface EditableMove {
    isEditableMove: boolean;
    move(dx: number, dy: number): void;
}

export interface EditableColor {
    isEditableColor: boolean;
    setColorAlpha(color: ColorEntry, alpha: AlphaEntry): void;
}

export interface EditableDeleteClone {
    isEditableDeleteClone: boolean;
    deleteOnCanvas(canvas: Canvas): void;
    clone(offsetX: number, offsetY: number): PrimitivePack;
    cloneOnCanvas(canvas: Canvas, offsetX: number, offsetY: number) : Drawable | Drawable[];
}
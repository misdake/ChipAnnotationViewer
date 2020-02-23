import {AlphaEntry, ColorEntry} from "../util/Color";
import {PrimitivePack} from "./Primitive";
import {Canvas} from "../Canvas";

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
    cloneOnCanvas(canvas: Canvas, offsetX: number, offsetY: number) : void;
}
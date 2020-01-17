import {Canvas} from "../Canvas";
import {LayerImage} from "./LayerImage";
import {LayerPolylineView} from "./LayerPolylineView";
import {LayerPolylineCreate} from "./LayerPolylineCreate";
import {LayerPolylineEdit} from "./LayerPolylineEdit";
import {LayerTextView} from "./LayerTextView";
import {LayerTextCreate} from "./LayerTextCreate";
import {LayerTextEdit} from "./LayerTextEdit";
import {Layer} from "./Layer";

export enum LayerName {
    IMAGE,
    POLYLINE_CREATE,
    POLYLINE_EDIT,
    POLYLINE_VIEW,
    TEXT_CREATE,
    TEXT_EDIT,
    TEXT_VIEW,
}

export class Layers {

    public static create(canvas: Canvas): Layer[] {
        return [
            new LayerImage(canvas),
            new LayerPolylineView(canvas),
            // new LayerPolylineCreate(canvas),
            // new LayerPolylineEdit(canvas),
            new LayerTextView(canvas),
            // new LayerTextCreate(canvas),
            // new LayerTextEdit(canvas),
        ];
    }

}
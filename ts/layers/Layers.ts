import {Canvas} from "../Canvas";
import {LayerImage} from "./LayerImage";
import {LayerPolylineView} from "./LayerPolylineView";
import {LayerPolylineCreate} from "./LayerPolylineCreate";
import {LayerPolylineEdit} from "./LayerPolylineEdit";
import {LayerTextView} from "./LayerTextView";
import {LayerTextCreate} from "./LayerTextCreate";
import {LayerTextEdit} from "./LayerTextEdit";
import {Layer} from "./Layer";

export class Layers {

    static readonly IMAGE = "image";
    static readonly POLYLINE_CREATE = "polyline_create";
    static readonly POLYLINE_EDIT = "polyline_edit";
    static readonly POLYLINE_VIEW = "polyline_view";
    static readonly TEXT_CREATE = "text_create";
    static readonly TEXT_EDIT = "text_edit";
    static readonly TEXT_VIEW = "text_view";

    public static create(canvas: Canvas): Layer[] {
        return [
            new LayerImage(canvas),
            new LayerPolylineView(canvas),
            new LayerPolylineCreate(canvas),
            new LayerPolylineEdit(canvas),
            new LayerTextView(canvas),
            new LayerTextCreate(canvas),
            new LayerTextEdit(canvas),
        ];
    }

}
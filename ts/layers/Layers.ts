import {Canvas} from "../Canvas";
import {LayerImage} from "./LayerImage";
import {LayerPolylineView} from "./LayerPolylineView";
import {LayerTextView} from "./LayerTextView";
import {Layer} from "./Layer";

export enum LayerName {
    IMAGE,
    POLYLINE_VIEW,
    TEXT_VIEW,
}

export class Layers {

    public static create(canvas: Canvas): Layer[] {
        return [
            new LayerImage(canvas),
            new LayerPolylineView(canvas),
            new LayerTextView(canvas),
        ];
    }

}
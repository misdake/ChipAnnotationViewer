import {Canvas} from "../Canvas";
import {EditorCameraControl} from "./EditorCameraControl";
import {Editor} from "./Editor";
import {EditorSelect} from "./EditorSelect";
import {EditorPolylineEdit} from "./EditorPolylineEdit";
import {EditorTextEdit} from "./EditorTextEdit";

export enum EditorName {
    CAMERA_CONTROL = 1,
    SELECT,
    POLYLINE_EDIT,
    TEXT_EDIT,
}

export class Editors {

    public static create(canvas: Canvas): Editor[] {
        return [
            new EditorCameraControl(canvas),
            new EditorSelect(canvas),
            new EditorPolylineEdit(canvas),
            new EditorTextEdit(canvas),
        ];
    }

}
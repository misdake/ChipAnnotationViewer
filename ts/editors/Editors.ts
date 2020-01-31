import {Canvas} from "../Canvas";
import {EditorCameraControl} from "./EditorCameraControl";
import {Editor} from "./Editor";
import {EditorSelect} from "./EditorSelect";
import {EditorPolylineEdit} from "./EditorPolylineEdit";
import {EditorTextEdit} from "./EditorTextEdit";
import {EditorPolylineCreate} from "./EditorPolylineCreate";
import {EditorTextCreate} from "./EditorTextCreate";

export enum EditorName {
    CAMERA_CONTROL = 1,
    SELECT,
    POLYLINE_EDIT,
    POLYLINE_CREATE,
    TEXT_EDIT,
    TEXT_CREATE,
}

export class Editors {

    public static create(canvas: Canvas): Editor[] {
        return [
            new EditorCameraControl(canvas),
            new EditorSelect(canvas),
            new EditorPolylineEdit(canvas),
            new EditorPolylineCreate(canvas),
            new EditorTextEdit(canvas),
            new EditorTextCreate(canvas),
        ];
    }

}
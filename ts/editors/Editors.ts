import {Canvas} from "../Canvas";
import {EditorCameraControl} from "./EditorCameraControl";
import {Editor} from "./Editor";
import {EditorSelect} from "./EditorSelect";

export enum EditorName {
    CAMERA_CONTROL,
    SELECT,
}

export class Editors {

    public static create(canvas: Canvas): Editor[] {
        return [
            new EditorCameraControl(canvas),
            new EditorSelect(canvas),
        ];
    }

}
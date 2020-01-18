import {Canvas} from "../Canvas";
import {EditorCameraControl} from "./EditorCameraControl";
import {Editor} from "./Editor";

export enum EditorName {
    CAMERA_CONTROL,
}

export class Editors {

    public static create(canvas: Canvas): Editor[] {
        return [
            new EditorCameraControl(canvas),
        ];
    }

}
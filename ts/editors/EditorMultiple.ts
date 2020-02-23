import {Editor, Usage, UsageType} from "./Editor";
import {EditorName} from "./Editors";
import {Canvas} from "../Canvas";
import {Env} from "../Env";

export class EditorMultiple extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.MULTIPLE_EDIT, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("hold alt to drag", UsageType.MOUSE),
            Editor.usage("hold ctrl+alt to copy and drag", UsageType.MOUSE),
            Editor.usage("WSAD ↑↓←→ to move, hold shift to speed up", UsageType.KEYBOARD),
            Editor.usage("press del to delete", UsageType.KEYBOARD),
        ];
    }

    enter(env: Env): void {
    }

    exit(env: Env): void {
    }

    render(env: Env): void {
    }

}
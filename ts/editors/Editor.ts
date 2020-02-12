import {Canvas} from "../Canvas";
import {Camera} from "../Camera";
import {MouseListener} from "../MouseListener";
import {KeyboardListener} from "../KeyboardListener";
import {EditorName} from "./Editors";
import {Env} from "../Env";

export enum UsageType {
    NONE,
    MOUSE,
    KEYBOARD,
    _LAST
}

export interface Usage {
    content: string;
    type: UsageType;
}

export abstract class Editor {

    public readonly name: EditorName;

    protected readonly canvas: Canvas;
    protected readonly camera: Camera;

    protected _mouseListener?: MouseListener = null;
    protected _keyboardListener?: KeyboardListener = null;
    get mouseListener(): MouseListener {
        return this._mouseListener;
    }
    get keyboardListener(): KeyboardListener {
        return this._keyboardListener;
    }

    protected constructor(name: EditorName, canvas: Canvas) {
        this.name = name;
        this.canvas = canvas;
        this.camera = canvas.getCamera();
    }

    public static usage(content: string, type: UsageType = UsageType.NONE): Usage {
        return {content: content, type: type};
    }
    public abstract usages(): Usage[];

    public abstract enter(env: Env): void;

    public abstract exit(env: Env): void;

    public abstract render(env: Env): void;

}

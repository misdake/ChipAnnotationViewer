import {Editor} from "./Editor";
import {Data} from "../data/Data";
import {Map} from "../data/Map";
import {Renderer} from "../Renderer";
import {MouseIn, MouseListener, WheelIn} from "../MouseListener";
import {EditorName} from "./Editors";
import {Canvas} from "../Canvas";
import {Env} from "../Env";

export class EditorCameraControl extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.CAMERA_CONTROL, canvas);
    }

    enter(env: Env): void {
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down = false;
            private lastX = -1;
            private lastY = -1;
            private lastPanX = -1;
            private lastPanY = -1;
            onwheel(event: WheelIn): boolean {
                let camera = self.canvas.getCamera();
                camera.action();
                let offsetX = event.offsetX;
                let offsetY = event.offsetY;
                let point1 = camera.screenXyToCanvas(offsetX, offsetY);
                camera.changeZoomBy(event.deltaY > 0 ? 1 : -1);
                camera.action();
                let point2 = camera.screenXyToCanvas(offsetX, offsetY);
                let dx = point1.x - point2.x;
                let dy = point1.y - point2.y;
                camera.moveXy(dx, dy);
                self.canvas.requestRender();
                return true;
            }
            onmousedown(event: MouseIn): boolean {
                this.down = true;
                this.lastX = event.offsetX;
                this.lastY = event.offsetY;
                return true;
            }
            onmouseup(event: MouseIn): boolean {
                this.down = false;
                return true;
            }
            onmousemove(event: MouseIn): boolean {
                if (this.down && event.buttons > 0) {
                    let camera = self.canvas.getCamera();
                    camera.action();
                    let offsetX = event.offsetX;
                    let offsetY = event.offsetY;
                    let point1 = camera.screenXyToCanvas(this.lastX, this.lastY);
                    let point2 = camera.screenXyToCanvas(offsetX, offsetY);
                    let dx = point1.x - point2.x;
                    let dy = point1.y - point2.y;
                    camera.moveXy(dx, dy);
                    this.lastX = offsetX;
                    this.lastY = offsetY;
                    self.canvas.requestRender();
                    return true;
                } else {
                    return false;
                }
            }
            onpan(event: HammerInput): boolean {
                let dx = event.deltaX - this.lastPanX;
                let dy = event.deltaY - this.lastPanY;
                let camera = self.canvas.getCamera();
                let scale = camera.screenSizeToCanvas(1);
                camera.moveXy(-dx * scale, -dy * scale);
                self.canvas.requestRender();
                this.lastPanX = event.deltaX;
                this.lastPanY = event.deltaY;
                if (event.isFinal) {
                    this.lastPanX = 0;
                    this.lastPanY = 0;
                }
                return true;
            }
        };
    }

    exit(): void {
        this._mouseListener = null;
    }

    render(renderer: Renderer): void {
    }

}
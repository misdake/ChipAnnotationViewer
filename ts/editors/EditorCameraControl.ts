import { Editor, Usage, UsageType } from "./Editor";
import { MouseIn, MouseListener, WheelIn } from "../MouseListener";
import { EditorName } from "./Editors";
import { Canvas } from "../Canvas";
import { Env } from "../Env";

export class EditorCameraControl extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.CAMERA_CONTROL, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("drag right button to view map", UsageType.MOUSE),
            Editor.usage("mouse wheel to zoom", UsageType.MOUSE),
        ];
    }

    enter(env: Env): void {
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down = false;
            private lastX = -1;
            private lastY = -1;
            private lastPanX = -1;
            private lastPanY = -1;
            private pinching = false;
            private suppressPanUntilFinal = false;
            private lastPinchScale = 1;
            private lastPinchCenterX = 0;
            private lastPinchCenterY = 0;
            onwheel(event: WheelIn): boolean {
                let camera = self.canvas.getCamera();
                let ratio = Math.pow(1.2, -event.deltaY / 100);
                camera.changeScaleAroundScreenPoint(ratio, event.offsetX, event.offsetY);
                self.canvas.requestRender();
                return true;
            }
            onmousedown(event: MouseIn): boolean {
                if (event.button !== 2) return false;
                this.down = true;
                this.lastX = event.offsetX;
                this.lastY = event.offsetY;
                return true;
            }
            onmouseup(event: MouseIn): boolean {
                if (event.button !== 2 && !this.down) return false;
                this.down = false;
                return true;
            }
            onmousemove(event: MouseIn): boolean {
                if (this.down && (event.buttons & 2)) {
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
                if (this.suppressPanUntilFinal) {
                    if (event.isFirst || event.type === "panstart") {
                        this.suppressPanUntilFinal = false;
                        this.lastPanX = event.deltaX;
                        this.lastPanY = event.deltaY;
                        return true;
                    }
                    this.lastPanX = event.deltaX;
                    this.lastPanY = event.deltaY;
                    if (event.isFinal) {
                        this.suppressPanUntilFinal = false;
                        this.lastPanX = 0;
                        this.lastPanY = 0;
                    }
                    return true;
                }
                if (this.pinching || event.pointers.length > 1) {
                    this.lastPanX = event.deltaX;
                    this.lastPanY = event.deltaY;
                    return false;
                }
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
            onpinch(event: HammerInput): boolean {
                let camera = self.canvas.getCamera();
                let rect = self.canvas.getElement().getBoundingClientRect();
                let centerX = (event.center.x - rect.left) * window.devicePixelRatio;
                let centerY = (event.center.y - rect.top) * window.devicePixelRatio;
                if (event.type === "pinchstart" || !this.pinching) {
                    this.pinching = true;
                    this.suppressPanUntilFinal = false;
                    this.lastPinchScale = event.scale;
                    this.lastPinchCenterX = centerX;
                    this.lastPinchCenterY = centerY;
                    this.lastPanX = event.deltaX;
                    this.lastPanY = event.deltaY;
                    return true;
                }
                let ratio = event.scale / this.lastPinchScale;
                camera.changeScaleAroundScreenPoint(ratio, this.lastPinchCenterX, this.lastPinchCenterY);
                let dx = centerX - this.lastPinchCenterX;
                let dy = centerY - this.lastPinchCenterY;
                let scale = camera.screenSizeToCanvas(1);
                camera.moveXy(-dx * scale, -dy * scale);
                self.canvas.requestRender();
                this.lastPinchScale = event.scale;
                this.lastPinchCenterX = centerX;
                this.lastPinchCenterY = centerY;
                if (event.isFinal || event.type === "pinchend" || event.type === "pinchcancel") {
                    this.pinching = false;
                    this.lastPinchScale = 1;
                    if (event.pointers.length > 0) {
                        this.suppressPanUntilFinal = false;
                        this.lastPanX = event.deltaX;
                        this.lastPanY = event.deltaY;
                    } else {
                        this.suppressPanUntilFinal = true;
                        this.lastPanX = 0;
                        this.lastPanY = 0;
                    }
                }
                return true;
            }
        };
    }

    exit(env: Env): void {
    }

    render(env: Env): void {
    }

}

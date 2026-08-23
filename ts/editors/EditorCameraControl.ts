import { Editor, Usage, UsageType } from "./Editor";
import { MouseIn, MouseListener, WheelIn } from "../MouseListener";
import { EditorName } from "./Editors";
import { Canvas } from "../Canvas";
import { Env } from "../Env";
import { Camera } from "../Camera";
import { AABB } from "../util/AABB";

export class EditorCameraControl extends Editor {
    public static allowLeftMousePan = false;
    private zoomBoxDown = false;
    private zoomBoxVisible = false;
    private zoomBoxStartX = 0;
    private zoomBoxStartY = 0;
    private zoomBoxCurrentX = 0;
    private zoomBoxCurrentY = 0;
    private zoomBoxStartScreenX = 0;
    private zoomBoxStartScreenY = 0;
    private static readonly ZOOM_BOX_MIN_DRAG_PX = 6;

    constructor(canvas: Canvas) {
        super(EditorName.CAMERA_CONTROL, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage(EditorCameraControl.allowLeftMousePan ? "drag the left or right button to pan" : "drag the right button to pan", UsageType.MOUSE),
            Editor.usage("drag the middle button to frame and focus an area", UsageType.MOUSE),
            Editor.usage("scroll the mouse wheel to zoom", UsageType.MOUSE),
        ];
    }

    enter(env: Env): void {
        let self = this;
        this.clearZoomBox();
        this._mouseListener = new class extends MouseListener {
            private down = false;
            private buttonMask = 0;
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
                let ratio = Math.pow(Camera.ZOOM_STEP, -event.deltaY / 100);
                camera.changeScaleAroundScreenPoint(ratio, event.offsetX, event.offsetY);
                self.canvas.requestRender();
                return true;
            }
            onmousedown(event: MouseIn): boolean {
                if (event.button === 1) {
                    self.beginZoomBox(event);
                    return true;
                }
                const isRightButton = event.button === 2;
                const isAllowedLeftButton = event.button === 0 && EditorCameraControl.allowLeftMousePan;
                if (!isRightButton && !isAllowedLeftButton) return false;
                this.down = true;
                this.buttonMask = isRightButton ? 2 : 1;
                this.lastX = event.offsetX;
                this.lastY = event.offsetY;
                self.canvas.getElement().style.cursor = "grabbing";
                return true;
            }
            onmouseup(event: MouseIn): boolean {
                if (event.button === 1 && self.zoomBoxDown) {
                    self.finishZoomBox(event);
                    return true;
                }
                if (!this.down) return false;
                this.down = false;
                this.buttonMask = 0;
                self.canvas.getElement().style.cursor = EditorCameraControl.allowLeftMousePan ? "grab" : "";
                return true;
            }
            onmousemove(event: MouseIn): boolean {
                if (self.zoomBoxDown) {
                    if (event.buttons & 4) {
                        self.updateZoomBox(event);
                        return true;
                    }
                    self.clearZoomBox();
                    self.canvas.requestRender();
                }
                if (this.down && (event.buttons & this.buttonMask)) {
                    self.canvas.getElement().style.cursor = "grabbing";
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
                    if (this.down && event.buttons === 0) {
                        this.down = false;
                        this.buttonMask = 0;
                        self.canvas.getElement().style.cursor = EditorCameraControl.allowLeftMousePan ? "grab" : "";
                    }
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
        this.clearZoomBox();
    }

    render(env: Env): void {
        if (!this.zoomBoxVisible) return;
        const p1 = this.camera.canvasToScreen(this.zoomBoxStartX, this.zoomBoxStartY);
        const p2 = this.camera.canvasToScreen(this.zoomBoxCurrentX, this.zoomBoxCurrentY);
        env.renderer.setColor("rgba(245, 158, 11, .2)");
        env.renderer.drawRect(p1.x, p1.y, p2.x, p2.y, true, false);
        env.renderer.setColor("rgba(245, 158, 11, .95)");
        env.renderer.drawRect(p1.x, p1.y, p2.x, p2.y, false, true, Math.max(1, window.devicePixelRatio));
    }

    private beginZoomBox(event: MouseIn) {
        this.camera.action();
        const point = this.camera.screenXyToCanvas(event.offsetX, event.offsetY);
        this.zoomBoxDown = true;
        this.zoomBoxVisible = false;
        this.zoomBoxStartX = point.x;
        this.zoomBoxStartY = point.y;
        this.zoomBoxCurrentX = point.x;
        this.zoomBoxCurrentY = point.y;
        this.zoomBoxStartScreenX = event.offsetX;
        this.zoomBoxStartScreenY = event.offsetY;
        this.canvas.getElement().style.cursor = "crosshair";
    }

    private updateZoomBox(event: MouseIn) {
        const point = this.camera.screenXyToCanvas(event.offsetX, event.offsetY);
        this.zoomBoxCurrentX = point.x;
        this.zoomBoxCurrentY = point.y;
        this.zoomBoxVisible = Math.hypot(
            event.offsetX - this.zoomBoxStartScreenX,
            event.offsetY - this.zoomBoxStartScreenY,
        ) >= EditorCameraControl.ZOOM_BOX_MIN_DRAG_PX;
        this.canvas.requestRender();
    }

    private finishZoomBox(event: MouseIn) {
        this.updateZoomBox(event);
        const shouldFocus = this.zoomBoxVisible;
        const bounds = new AABB(
            Math.min(this.zoomBoxStartX, this.zoomBoxCurrentX),
            Math.min(this.zoomBoxStartY, this.zoomBoxCurrentY),
            Math.max(this.zoomBoxStartX, this.zoomBoxCurrentX),
            Math.max(this.zoomBoxStartY, this.zoomBoxCurrentY),
        );
        this.clearZoomBox();
        if (shouldFocus) this.camera.fitToAABB(bounds, 0);
        this.canvas.requestRender();
    }

    private clearZoomBox() {
        this.zoomBoxDown = false;
        this.zoomBoxVisible = false;
        this.canvas.getElement().style.cursor = EditorCameraControl.allowLeftMousePan ? "grab" : "";
    }

}

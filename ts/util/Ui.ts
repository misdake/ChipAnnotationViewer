import {AlphaEntry, ColorEntry} from "./Color";
import {KeyboardIn, KeyboardListener} from "../KeyboardListener";
import {Camera} from "../Camera";
import {Canvas} from "../Canvas";
import {DrawableText} from "../editable/DrawableText";
import {DrawablePolyline} from "../editable/DrawablePolyline";

export class Ui {

    static isMobile() {
        return (/Mobi|Android/i.test(navigator.userAgent));
    }

    static createPolylineKeyboardListener(canvas: Canvas, camera: Camera, text: DrawablePolyline, ondelete: () => void) {
        return new class extends KeyboardListener {
            public onkeydown(event: KeyboardIn): boolean {
                let scale = camera.screenSizeToCanvas(1);
                let {dx, dy} = Ui.getMove(event, scale);
                if (dx !== 0 || dy !== 0) {
                    text.editor.move(dx, dy);
                    canvas.requestRender();
                    return true;
                }
                if (event.key === "Delete") {
                    if (ondelete) ondelete();
                    canvas.requestRender();
                    return true;
                }
                return false;
            }
        };
    }
    static createTextKeyboardListener(canvas: Canvas, camera: Camera, text: DrawableText, ondelete: () => void) {
        return new class extends KeyboardListener {
            public onkeydown(event: KeyboardIn): boolean {
                let scale = camera.screenSizeToCanvas(1);
                let {dx, dy} = Ui.getMove(event, scale);
                if (dx !== 0 || dy !== 0) {
                    text.setPosition(text.x + dx, text.y + dy);
                    canvas.requestRender();
                    return true;
                }
                if (event.key === "Delete") {
                    if (ondelete) ondelete();
                    canvas.requestRender();
                    return true;
                }
                return false;
            }
        };
    }
    static getMove(event: KeyboardIn, scale: number) {
        let dx = 0, dy = 0;
        if (event.shiftKey) scale *= 10;
        switch (event.key) {
            case 'w':
            case 'W':
            case 'ArrowUp':
                dy -= scale;
                break;
            case 'a':
            case 'A':
            case 'ArrowLeft':
                dx -= scale;
                break;
            case 's':
            case 'S':
            case 'ArrowDown':
                dy += scale;
                break;
            case 'd':
            case 'D':
            case 'ArrowRight':
                dx += scale;
                break;
        }
        return {dx: dx, dy: dy};
    }

}

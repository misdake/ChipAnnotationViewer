import {Drawable} from "./Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";
import {Size} from "../util/Size";

export enum AnchorX {
    LEFT = "left",
    MIDDLE = "center",
    RIGHT = "right",
}

export enum AnchorY {
    TOP = "top",
    MIDDLE = "middle",
    BOTTOM = "bottom",
}

export class DrawableText extends Drawable {

    public text: string = "";
    public color: string;
    public anchorX: AnchorX;
    public anchorY: AnchorY;
    public fontSize: Size;
    public x: number;
    public y: number;

    public constructor(text: string, color: string, anchorX: AnchorX, anchorY: AnchorY, fontSize: Size, x: number, y: number) {
        super();
        this.text = text;
        this.color = color;
        this.anchorX = anchorX;
        this.anchorY = anchorY;
        this.fontSize = fontSize;
        this.x = x;
        this.y = y;
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        renderer.setColor(this.color);
        renderer.renderText(camera, this.text, this.fontSize, this.x, this.y, this.anchorX, this.anchorY);
    }

}
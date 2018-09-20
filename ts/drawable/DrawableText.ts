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

export class DrawableTextPack {
    public constructor(text: string, color: string, anchorX: AnchorX, anchorY: AnchorY, fontSize: Size, x: number, y: number) {
        this.text = text;
        this.color = color;
        this.anchorX = anchorX;
        this.anchorY = anchorY;
        this.fontSize = fontSize;
        this.x = x;
        this.y = y;
    }
    text: string = "";
    color: string;
    anchorX: AnchorX;
    anchorY: AnchorY;
    fontSize: Size;
    x: number;
    y: number;
}

export class DrawableText extends Drawable {

    public text: string = "";
    public color: string;
    public anchorX: AnchorX;
    public anchorY: AnchorY;
    public fontSize: Size;
    public x: number;
    public y: number;

    public constructor(pack: DrawableTextPack) {
        super();
        this.text = pack.text;
        this.color = pack.color;
        this.anchorX = pack.anchorX;
        this.anchorY = pack.anchorY;
        this.fontSize = pack.fontSize;
        this.x = pack.x;
        this.y = pack.y;
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        renderer.setColor(this.color);
        renderer.renderText(camera, this.text, this.fontSize, this.x, this.y, this.anchorX, this.anchorY);
    }

}
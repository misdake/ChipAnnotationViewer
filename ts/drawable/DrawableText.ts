import {Drawable} from "./Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";
import {Size} from "../util/Size";
import {AlphaEntry, ColorEntry, combineColorAlpha} from "../util/Color";

export class DrawableTextPack {
    public constructor(text: string, colorName: string, alphaName: string,
                       // anchorX: CanvasTextAlign, anchorY: CanvasTextBaseline,
                       fontSize: Size, x: number, y: number) {
        this.text = text;
        this.colorName = colorName;
        this.alphaName = alphaName;
        // this.anchorX = anchorX;
        // this.anchorY = anchorY;
        this.fontSize = fontSize;
        this.x = x;
        this.y = y;
    }
    text: string = "";
    colorName: string;
    alphaName: string;
    // anchorX: CanvasTextAlign;
    // anchorY: CanvasTextBaseline;
    fontSize: Size;
    x: number;
    y: number;
}

export class DrawableText extends Drawable {

    public text: string = "";
    public color: ColorEntry;
    public alpha: AlphaEntry;
    public colorString: string;
    // public anchorX: CanvasTextAlign;
    // public anchorY: CanvasTextBaseline;
    public fontSize: Size;
    public x: number;
    public y: number;

    public canvasWidth: number = 0;
    public canvasHeight: number = 0;

    public constructor(pack: DrawableTextPack) {
        super();
        this.text = pack.text;
        this.color = ColorEntry.findByName(pack.colorName);
        this.alpha = AlphaEntry.findByName(pack.alphaName);
        this.colorString = combineColorAlpha(this.color, this.alpha);
        // this.anchorX = pack.anchorX;
        // this.anchorY = pack.anchorY;
        this.fontSize = pack.fontSize;
        this.x = pack.x;
        this.y = pack.y;
    }

    public pack(): DrawableTextPack {
        return new DrawableTextPack(
            this.text,
            this.color.name,
            this.alpha.name,
            // this.anchorX,
            // this.anchorY,
            this.fontSize,
            this.x,
            this.y,
        )
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        renderer.setColor(this.colorString);
        let wh = renderer.renderText(camera, this.text, this.fontSize, this.x, this.y, "center", "middle");
        let ratio = camera.screenSizeToCanvas(1);
        this.canvasWidth = wh[0] * ratio / 2;
        this.canvasHeight = wh[1] * ratio / 2;
    }

    public pick(x: number, y: number, radius: number) {
        let h = (this.x - this.canvasWidth - radius <= x) && (x <= this.x + this.canvasWidth + radius);
        let v = (this.y - this.canvasHeight - radius <= y) && (y <= this.y + this.canvasHeight + radius);
        return h && v;
    }
}
import {Drawable} from "./Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";
import {Size} from "../util/Size";
import {AlphaEntry, ColorEntry, combineColorAlpha} from "../util/Color";
import {AABB} from "../util/AABB";

export class DrawableTextPack {
    public constructor(text: string, colorName: string, alphaName: string,
                       // anchorX: CanvasTextAlign, anchorY: CanvasTextBaseline,
                       fontSize: Size, x: number, y: number) {
        this.text = text;
        this.colorName = colorName;
        this.alphaName = alphaName;
        this.fontSize = fontSize;
        this.x = x;
        this.y = y;
    }
    text: string = "";
    colorName: string;
    alphaName: string;
    fontSize: Size;
    x: number;
    y: number;
}

export class DrawableText extends Drawable {
    public static readonly typeName = "DrawableText";

    private _text: string = "";
    private _x: number;
    private _y: number;

    public color: ColorEntry;
    public alpha: AlphaEntry;
    public colorString: string;
    public fontSize: Size;

    public constructor(pack: DrawableTextPack) {
        super();
        this._text = pack.text;
        this.color = ColorEntry.findByName(pack.colorName);
        this.alpha = AlphaEntry.findByName(pack.alphaName);
        this.colorString = combineColorAlpha(this.color, this.alpha);
        this.fontSize = pack.fontSize;
        this._x = pack.x;
        this._y = pack.y;
    }

    private invalidate() {
        this.sizeValid = false;
    }
    private _canvasAABB: AABB = new AABB();
    private sizeValid: boolean = false;
    private canvasZoom: number = -1;
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;
    private screenWidth: number = 0;
    private screenHeight: number = 0;

    get text(): string {
        return this._text;
    }
    get x(): number {
        return this._x;
    }
    get y(): number {
        return this._y;
    }
    public validateCanvasAABB(camera: Camera, renderer: Renderer): AABB {
        this.validate(camera, renderer);
        return this._canvasAABB;
    }

    get onScreen(): number {
        return this.fontSize.onScreen;
    }
    get onCanvas(): number {
        return this.fontSize.onCanvas;
    }
    get ofScreen(): number {
        return this.fontSize.ofScreen;
    }
    set onScreen(onScreen: number) {
        this.fontSize.onScreen = onScreen;
        this.invalidate();
    }
    set onCanvas(onCanvas: number) {
        this.fontSize.onCanvas = onCanvas;
        this.invalidate();
    }
    set ofScreen(ofScreen: number) {
        this.fontSize.ofScreen = ofScreen;
        this.invalidate();
    }

    public setPosition(x: number, y: number) {
        this._x = x;
        this._y = y;
        this.invalidate();
    }
    set text(value: string) {
        this._text = value;
        this.invalidate();
    }

    public setColorAlpha(color: ColorEntry, alpha: AlphaEntry) {
        this.color = color;
        this.alpha = alpha;
        this.colorString = combineColorAlpha(this.color, this.alpha);
    }

    public clone(offsetX: number, offsetY: number): DrawableTextPack {
        return new DrawableTextPack(
            this._text,
            this.color.name,
            this.alpha.name,
            this.fontSize,
            this._x + offsetX,
            this._y + offsetY,
        )
    }

    public pack(): DrawableTextPack {
        return new DrawableTextPack(
            this._text,
            this.color.name,
            this.alpha.name,
            this.fontSize,
            this._x,
            this._y,
        )
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        renderer.setColor(this.colorString);
        this.validate(camera, renderer);
        let inScreen = camera.canvasAABBInScreen(this._canvasAABB);
        if (inScreen) {
            renderer.renderText(camera, this._text, this.screenHeight, this._x, this._y, "center", "middle");
        }
    }

    private validate(camera: Camera, renderer: Renderer) {
        if (!this.sizeValid || this.canvasZoom != camera.getZoom()) {
            this.sizeValid = true;

            let wh = renderer.measureText(camera, this._text, this.fontSize);
            let ratio = camera.screenSizeToCanvas(1);
            this.canvasZoom = camera.getZoom();
            this.canvasWidth = wh[0] * ratio / 2;
            this.canvasHeight = wh[1] * ratio / 2;
            this.screenWidth = wh[0];
            this.screenHeight = wh[1];

            this.calcCanvasAABB();
        }
    }

    public pick(x: number, y: number, radius: number): boolean {
        let h = (this._x - this.canvasWidth - radius <= x) && (x <= this._x + this.canvasWidth + radius);
        let v = (this._y - this.canvasHeight - radius <= y) && (y <= this._y + this.canvasHeight + radius);
        return h && v;
    }

    private calcCanvasAABB(): AABB {
        this._canvasAABB.x1 = this.x - this.canvasWidth;
        this._canvasAABB.y1 = this.y - this.canvasHeight;
        this._canvasAABB.x2 = this.x + this.canvasWidth;
        this._canvasAABB.y2 = this.y + this.canvasHeight;
        return this._canvasAABB;
    }
}

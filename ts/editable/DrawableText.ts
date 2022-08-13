import {Drawable} from "../drawable/Drawable";
import {Canvas} from "../Canvas";
import {Renderer} from "../Renderer";
import {Camera} from "../Camera";
import {Size} from "../util/Size";
import {AlphaEntry, ColorEntry, combineColorAlpha} from "../util/Color";
import {AABB} from "../util/AABB";
import {html, TemplateResult} from "lit-html";
import {Primitive, PrimitivePack} from "./Primitive";
import {EditableColor, EditableDeleteClone, EditableMove, EditablePick} from "./Editable";
import {LayerTextView} from "../layers/LayerTextView";
import {LayerName} from "../layers/Layers";
import {Selection, SelectType} from "../layers/Selection";

export class DrawableTextPack implements PrimitivePack {
    public constructor(text: string, colorName: string, alphaName: string, fontSize: Size, x: number, y: number) {
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

export class DrawableText implements EditablePick, EditableDeleteClone, EditableMove, EditableColor, Drawable, Primitive {
    pickType = SelectType.TEXT;
    isEditablePick = true;
    isEditableMove = true;
    isEditableDeleteClone = true;
    isEditableColor = true;

    private _sourceText: string = "";
    private _text: string = "";
    private _x: number;
    private _y: number;
    private _link: string = null;

    public color: ColorEntry;
    public alpha: AlphaEntry;
    public colorString: string;
    protected readonly fontSize: Size;

    public constructor(pack: DrawableTextPack) {
        this.color = ColorEntry.findByName(pack.colorName);
        this.alpha = AlphaEntry.findByName(pack.alphaName);
        this.colorString = combineColorAlpha(this.color, this.alpha);
        this.fontSize = new Size(pack.fontSize.onScreen, pack.fontSize.onCanvas);
        this._x = pack.x;
        this._y = pack.y;
        this._sourceText = pack.text;
        this.text = pack.text;
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
    private screenFontSize: number = 0;

    get text(): string {
        return this._sourceText;
    }
    get link(): string {
        return this._link;
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
    set onScreen(onScreen: number) {
        this.fontSize.onScreen = onScreen;
        this.invalidate();
    }
    set onCanvas(onCanvas: number) {
        this.fontSize.onCanvas = onCanvas;
        this.invalidate();
    }

    public setPosition(x: number, y: number) {
        this._x = x;
        this._y = y;
        this.invalidate();
    }

    static readonly CHIP_LINK_REGEX = /@(chip|map)\[(\w+)]/;
    static readonly ANNOTATION_LINK_REGEX = /@(annotation|comment)\[(\w+)]\(([0-9]+)\)/;

    set text(value: string) {
        this._sourceText = value;

        //generate link from text
        this._link = null;
        let chipLink = DrawableText.CHIP_LINK_REGEX.exec(value);
        let annotationLink = DrawableText.ANNOTATION_LINK_REGEX.exec(value);
        if (chipLink) this._link = `${window.location.origin}${window.location.pathname}?chip=${encodeURIComponent(chipLink[1])}`;
        if (annotationLink) this._link = `${window.location.origin}${window.location.pathname}?chip=${encodeURIComponent(annotationLink[1])}&annotation=${annotationLink[2]}`;

        //remove link from rendering text
        this._text = this._sourceText;
        this._text = this._text.replace(DrawableText.CHIP_LINK_REGEX, "");
        this._text = this._text.replace(DrawableText.ANNOTATION_LINK_REGEX, "");

        if (chipLink || annotationLink) {
            console.log(this._link);
        }

        this.invalidate();
    }

    //Editable
    public move(dx: number, dy: number): void {
        this.setPosition(this._x + dx, this._y + dy);
    }
    public aabb(): AABB {
        return new AABB(this._x, this._y, this._x, this._y);
    }
    public flipX(centerX: number): void {
        this._x = centerX * 2 - this._x;
        this.invalidate();
    }
    public flipY(centerY: number): void {
        this._y = centerY * 2 - this._y;
        this.invalidate();
    }
    public rotateCCW(centerX: number, centerY: number): void {
        let dx = this._x - centerX;
        let dy = this._y - centerY;
        this._x = centerX + dy;
        this._y = centerY - dx;
        this.invalidate();
    }
    public rotateCW(centerX: number, centerY: number): void {
        let dx = this._x - centerX;
        let dy = this._y - centerY;
        this._x = centerX - dy;
        this._y = centerY + dx;
        this.invalidate();
    }
    public setColorAlpha(color: ColorEntry, alpha: AlphaEntry) {
        if (color) this.color = color;
        if (alpha) this.alpha = alpha;
        this.colorString = combineColorAlpha(this.color, this.alpha);
    }
    public deleteOnCanvas(canvas: Canvas): void {
        let layerView = <LayerTextView>canvas.findLayer(LayerName.TEXT_VIEW);
        layerView.deleteText(this);
        Selection.deselect(SelectType.TEXT);
        Selection.deselect(SelectType.TEXT_CREATE);
        canvas.requestRender();
    }
    private clone(offsetX: number, offsetY: number): DrawableTextPack {
        return new DrawableTextPack(
            this._sourceText,
            this.color.name,
            this.alpha.name,
            this.fontSize.clone(),
            this._x + offsetX,
            this._y + offsetY,
        )
    }
    public cloneOnCanvas(canvas: Canvas, offsetX: number, offsetY: number): Drawable {
        let layerView = <LayerTextView>canvas.findLayer(LayerName.TEXT_VIEW);
        let newText = new DrawableText(this.clone(offsetX, offsetY));
        layerView.addText(newText);
        canvas.requestRender();
        return newText;
    }

    public pack(): DrawableTextPack {
        return new DrawableTextPack(
            this._sourceText,
            this.color.name,
            this.alpha.name,
            this.fontSize.clone(),
            this._x,
            this._y,
        )
    }

    public render(canvas: Canvas, renderer: Renderer, camera: Camera): void {
        renderer.setColor(this.colorString);
        this.validate(camera, renderer);
        let inScreen = camera.canvasAABBInScreen(this._canvasAABB);
        if (inScreen) {
            renderer.renderText(camera, this._text, this.screenFontSize, this._x, this._y, "center", "middle");

            if (this._link) { //draw underline
                let p1 = camera.canvasToScreen(this._canvasAABB.x1, this._canvasAABB.y1);
                let p2 = camera.canvasToScreen(this._canvasAABB.x2, this._canvasAABB.y2);
                renderer.drawRect(
                    p1.x, p2.y, p2.x, p2.y,
                    false, true, 2
                );
            }
        }
    }

    private validate(camera: Camera, renderer: Renderer) {
        if (!this.sizeValid || this.canvasZoom != camera.getZoom()) {
            this.sizeValid = true;

            let {width, totalHeight, fontSize} = renderer.measureText(camera, this._text, this.fontSize);
            let ratio = camera.screenSizeToCanvas(1);
            this.canvasZoom = camera.getZoom();
            this.canvasWidth = width * ratio / 2;
            this.canvasHeight = totalHeight * ratio / 2;
            this.screenWidth = width;
            this.screenHeight = totalHeight;
            this.screenFontSize = fontSize;

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

    public renderUi(canvas: Canvas): TemplateResult {
        return html`<textedit-element .text=${this} .canvas=${canvas}></textedit-element>`;
    }
}

import {customElement, html, LitElement, property} from "lit-element";
import {Canvas} from "../Canvas";
import {AlphaEntry, ColorEntry} from "../util/Color";
import "elements/ColorAlphaElement"
import {Selection, SelectType} from "../layers/Selection";
import {Drawable} from "../drawable/Drawable";
import {EditableColor, EditableDeleteClone, EditableMove, editableMultiple} from "./Editable";
import {TemplateResult} from "lit-html";

@customElement('multipleedit-element')
export class MultipleEdit extends LitElement {

    @property()
    canvas: Canvas;

    public static renderUi(canvas: Canvas): TemplateResult {
        return html`<multipleedit-element .canvas=${canvas}></multipleedit-element>`;
    }

    delete(editable: EditableDeleteClone) {
        editable.deleteOnCanvas(this.canvas);
    }
    copy(editable: EditableDeleteClone) {
        let offset = this.canvas.getCamera().screenSizeToCanvas(20);
        let list = editable.cloneOnCanvas(this.canvas, offset, offset);
        Selection.select(SelectType.MULTIPLE, list);
    }

    rotateCCW(editable: EditableDeleteClone & EditableMove & EditableColor) {
        let aabb = editable.aabb();
        editable.rotateCCW(aabb.centerX, aabb.centerY);
        this.canvas.requestRender();
    }
    rotateCW(editable: EditableDeleteClone & EditableMove & EditableColor) {
        let aabb = editable.aabb();
        editable.rotateCW(aabb.centerX, aabb.centerY);
        this.canvas.requestRender();
    }
    flipX(editable: EditableDeleteClone & EditableMove & EditableColor) {
        let aabb = editable.aabb();
        editable.flipX(aabb.centerX);
        this.canvas.requestRender();
    }
    flipY(editable: EditableDeleteClone & EditableMove & EditableColor) {
        let aabb = editable.aabb();
        editable.flipY(aabb.centerY);
        this.canvas.requestRender();
    }

    render() {
        let drawables = <Drawable[]>Selection.getSelected().item;
        let editable = editableMultiple(drawables);

        return html`
            <button class="configButton" @click=${() => this.delete(editable)}>delete selected</button><br>
            <button class="configButton" @click=${() => this.copy(editable)}>copy selected</button><br>
            
            <button class="configButton" @click=${() => this.rotateCCW(editable)} >rotate ccw</button>
            <button class="configButton" @click=${() => this.rotateCW(editable)}  >rotate cw</button>
            <button class="configButton" @click=${() => this.flipX(editable)}     >flip x</button>
            <button class="configButton" @click=${() => this.flipY(editable)}     >flip y</button>

            <div>color</div>
            <coloralpha-element
                .setColor=${(color: ColorEntry) => {
                    editable.setColorAlpha(color, undefined);
                    this.canvas.requestRender();
                }}
                .setAlpha=${(alpha: AlphaEntry) => {
                    editable.setColorAlpha(undefined, alpha);
                    this.canvas.requestRender();
                }}
            ></coloralpha-element>
        `;
    }

    createRenderRoot() {
        return this;
    }
}

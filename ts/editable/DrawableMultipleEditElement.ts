import { customElement, html, LitElement, property } from "lit-element";
import { Canvas } from "../Canvas";
import { AlphaEntry, ColorEntry } from "../util/Color";
import "../elements/ColorAlphaElement"
import { Selection } from "../layers/Selection";
import { Drawable } from "../drawable/Drawable";
import { EditableColor, EditableDeleteClone, EditableMove, editableMultiple } from "./Editable";
import { TemplateResult } from "lit-html";
import { rotateCCWIcon, rotateCWIcon, flipXIcon, flipYIcon } from "../util/Icons";

@customElement('multipleedit-element')
export class MultipleEdit extends LitElement {

    @property()
    canvas: Canvas;
    @property()
    items: Drawable[];

    public static renderUi(canvas: Canvas, items: Drawable[]): TemplateResult {
        return html`<multipleedit-element .canvas=${canvas} .items=${items}></multipleedit-element>`;
    }

    delete(editable: EditableDeleteClone) {
        editable.deleteOnCanvas(this.canvas);
    }
    copy(editable: EditableDeleteClone) {
        let offset = this.canvas.getCamera().screenSizeToCanvas(20);
        let list = <Drawable[]>editable.cloneOnCanvas(this.canvas, offset, offset);
        let current = <Drawable[]>Selection.getSelected().item;
        current.splice(0, current.length, ...list);
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
            <button class="configButton" @click=${() => this.delete(editable)}>Delete Selected</button><br>
            <button class="configButton" @click=${() => this.copy(editable)}>Clone Selected</button><br>
            
            <button class="iconButton" @click=${() => this.rotateCCW(editable)} title="Rotate CCW">${rotateCCWIcon}</button>
            <button class="iconButton" @click=${() => this.rotateCW(editable)}  title="Rotate CW">${rotateCWIcon}</button>
            <button class="iconButton" @click=${() => this.flipX(editable)}     title="Flip X">${flipXIcon}</button>
            <button class="iconButton" @click=${() => this.flipY(editable)}     title="Flip Y">${flipYIcon}</button>

            <div>Color</div>
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

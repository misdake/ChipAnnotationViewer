import { customElement, html, LitElement, property, TemplateResult } from "lit-element";
import { Canvas } from "../Canvas";
import { annotationHistory, HistoryDrawable } from "../history/AnnotationHistory";
import { cloneIcon, deleteIcon, flipXIcon, flipYIcon, rotateCCWIcon, rotateCWIcon } from "../util/Icons";
import { DeleteConfirmation } from "../util/DeleteConfirmation";
import { AABB } from "../util/AABB";

@customElement("multipleedit-element")
export class MultipleEditElement extends LitElement {
    @property()
    drawables: HistoryDrawable[] = [];

    @property()
    canvas: Canvas;
    @property()
    extraActions: TemplateResult;

    private confirmDelete() {
        DeleteConfirmation.confirm(`${this.drawables.length} selected items`).then(confirmed => {
            if (confirmed) annotationHistory.removeDrawables(this.canvas, this.drawables, "selection.delete");
        });
    }

    private cloneSelection() {
        const offset = this.canvas.getCamera().screenSizeToCanvas(20);
        annotationHistory.cloneDrawables(this.canvas, this.drawables, offset, offset, "selection.clone");
    }

    private transform(kind: "rotateCCW" | "rotateCW" | "flipX" | "flipY") {
        if (!this.drawables.length) return;
        const aabb = AABB.combineAll(this.drawables.map(item => item.aabb()));
        const centerX = aabb.centerX;
        const centerY = aabb.centerY;
        annotationHistory.mutateDrawables(this.canvas, this.drawables, `selection.${kind}`, items => {
            for (const item of items) {
                if (kind === "rotateCCW") item.rotateCCW(centerX, centerY);
                else if (kind === "rotateCW") item.rotateCW(centerX, centerY);
                else if (kind === "flipX") item.flipX(centerX);
                else item.flipY(centerY);
            }
        });
    }

    render() {
        return html`
            <div class="toolButtonRow">
                <button class="iconButton deleteIconButton" @click=${() => this.confirmDelete()} title="Delete Selection" aria-label="Delete Selection">${deleteIcon}</button>
                <button class="iconButton" @click=${() => this.cloneSelection()} title="Clone Selection" aria-label="Clone Selection">${cloneIcon}</button>
                <button class="iconButton" @click=${() => this.transform("rotateCCW")} title="Rotate CCW">${rotateCCWIcon}</button>
                <button class="iconButton" @click=${() => this.transform("rotateCW")} title="Rotate CW">${rotateCWIcon}</button>
                <button class="iconButton" @click=${() => this.transform("flipX")} title="Flip X">${flipXIcon}</button>
                <button class="iconButton" @click=${() => this.transform("flipY")} title="Flip Y">${flipYIcon}</button>
                ${this.extraActions || html``}
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }
}

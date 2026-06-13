import { customElement, html, LitElement, property } from "lit-element";
import { Canvas } from "../Canvas";
import { annotationHistory, HistoryDrawable } from "../history/AnnotationHistory";
import { cloneIcon, deleteIcon } from "../util/Icons";
import { DeleteConfirmation } from "../util/DeleteConfirmation";

@customElement("multipleedit-element")
export class MultipleEditElement extends LitElement {
    @property()
    drawables: HistoryDrawable[] = [];

    @property()
    canvas: Canvas;

    private confirmDelete() {
        DeleteConfirmation.confirm(`${this.drawables.length} selected items`).then(confirmed => {
            if (confirmed) annotationHistory.removeDrawables(this.canvas, this.drawables, "selection.delete");
        });
    }

    private cloneSelection() {
        const offset = this.canvas.getCamera().screenSizeToCanvas(20);
        annotationHistory.cloneDrawables(this.canvas, this.drawables, offset, offset, "selection.clone");
    }

    render() {
        return html`
            <div class="toolButtonRow">
                <button class="iconButton deleteIconButton" @click=${() => this.confirmDelete()} title="Delete Selection" aria-label="Delete Selection">${deleteIcon}</button>
                <button class="iconButton" @click=${() => this.cloneSelection()} title="Clone Selection" aria-label="Clone Selection">${cloneIcon}</button>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }
}

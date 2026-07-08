import { customElement, html, LitElement, property } from "lit-element";
import { DrawableText } from "./DrawableText";
import { Canvas } from "../Canvas";
import { alphaOf, rgbOf } from "../util/Color";
import "../elements/ColorAlphaElement"
import "../elements/NumberInputElement"
import "../elements/TextInputElement"
import "../elements/SizeInputElement"
import { getUnifiedValue } from "../util/MultiSelect";
import { cloneIcon, deleteIcon } from "../util/Icons";
import { DeleteConfirmation } from "../util/DeleteConfirmation";
import { annotationHistory } from "../history/AnnotationHistory";

@customElement('textedit-element')
export class TextEdit extends LitElement {

    @property()
    texts: DrawableText[] = [];

    @property()
    canvas: Canvas;

    @property({ type: Boolean })
    showActions: boolean = true;

    deleteText() {
        annotationHistory.removeDrawables(this.canvas, this.texts, "text.delete");
    }
    confirmDeleteText() {
        const target = this.texts.length === 1 ? "this text" : `${this.texts.length} texts`;
        DeleteConfirmation.confirm(target).then(confirmed => {
            if (confirmed) this.deleteText();
        });
    }
    copyText() {
        const offset = this.canvas.getCamera().screenSizeToCanvas(20);
        annotationHistory.cloneDrawables(this.canvas, this.texts, offset, offset, "text.clone");
    }

    private getText(): string | undefined {
        return getUnifiedValue(this.texts, t => t.text);
    }
    private getMultiline(): boolean {
        const value = getUnifiedValue(this.texts, t => t.multiline);
        return value === true;
    }
    private getRgb(): number | undefined {
        return getUnifiedValue(this.texts, t => rgbOf(t.color));
    }
    private getAlpha(): number | undefined {
        return getUnifiedValue(this.texts, t => alphaOf(t.color));
    }
    private getOnScreen(): number | undefined {
        return getUnifiedValue(this.texts, t => t.onScreen);
    }
    private getOnCanvas(): number | undefined {
        return getUnifiedValue(this.texts, t => t.onCanvas);
    }

    private editText = (content: string) => {
        annotationHistory.mutateDrawables(this.canvas, this.texts, "text.content", (items) => {
            for (const text of items as DrawableText[]) text.text = content;
        }, annotationHistory.mergeKey("text.content", this.texts));
        this.requestUpdate();
    };
    private setMultiline = (multiline: boolean) => {
        annotationHistory.mutateDrawables(this.canvas, this.texts, "text.multiline", (items) => {
            for (const text of items as DrawableText[]) text.multiline = multiline;
        });
        this.requestUpdate();
    };

    private onSizeInput = (options: { screen?: number, canvas?: number }) => {
        annotationHistory.mutateDrawables(this.canvas, this.texts, "text.size", (items) => {
            for (const text of items as DrawableText[]) {
                if (options.screen !== undefined) text.onScreen = options.screen;
                if (options.canvas !== undefined) text.onCanvas = options.canvas;
            }
        }, annotationHistory.mergeKey("text.size", this.texts));
        this.requestUpdate();
    };

    render() {
        const multiline = this.getMultiline();
        const textValue = this.getText() || "";
        const actionButtons = this.showActions
            ? html`
                <div class="toolButtonRow">
                    <button class="iconButton deleteIconButton" @click=${() => this.confirmDeleteText()} title="Delete Text" aria-label="Delete Text">${deleteIcon}</button>
                    <button class="iconButton" @click=${() => this.copyText()} title="Clone Text" aria-label="Clone Text">${cloneIcon}</button>
                </div>
            `
            : html``;
        return html`
            ${actionButtons}

            <div class="editorConfigSection">
                <div class="configColorHeader">
                    <span class="editorConfigTitle">Text</span>
                    <span class="configColorHeaderControls">
                        <span class="chkBox ${multiline ? 'chkChecked' : ''}" @click=${() => this.setMultiline(!multiline)}>
                            ${multiline ? html`
                                <svg viewBox="0 0 24 24">
                                    <polyline points="4,12 10,18 20,6" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            ` : ''}
                        </span>
                        <span class="chkLabel editorConfigOptionLabel" @click=${() => this.setMultiline(!multiline)}>Multiline</span>
                    </span>
                </div>
                <div style="margin-top: 6px;">
                    ${multiline
                ? html`
                            <textarea
                                rows="3"
                                .value=${textValue}
                                @input="${(ev: Event) => this.editText((ev.target as HTMLTextAreaElement).value)}"
                            ></textarea>
                        `
                : html`
                            <text-input
                                .value=${textValue}
                                .placeholder=${"-"}
                                .onChange=${(val: string) => this.editText(val)}
                            ></text-input>
                        `
            }
                </div>
            </div>

            <div class="editorConfigSection">
                <div class="editorConfigTitle">Text Color</div>
                <coloralpha-element
                    .currentRgb=${this.getRgb()}
                    .currentAlpha=${this.getAlpha()}
                    .setRgb=${(rgb: number) => {
                annotationHistory.mutateDrawables(this.canvas, this.texts, "text.color", (items) => {
                    for (const text of items as DrawableText[]) text.setColorAlpha(rgb, undefined);
                }, annotationHistory.mergeKey("text.color", this.texts));
            }}
                    .setAlpha=${(alpha: number) => {
                annotationHistory.mutateDrawables(this.canvas, this.texts, "text.alpha", (items) => {
                    for (const text of items as DrawableText[]) text.setColorAlpha(undefined, alpha);
                }, annotationHistory.mergeKey("text.alpha", this.texts));
            }} 
                ></coloralpha-element>
            </div>

            <div class="editorConfigSection">
                <div class="editorConfigTitle">Size</div>
                <size-input
                    .screen=${this.getOnScreen()}
                    .image=${this.getOnCanvas()}
                    .setScreen=${(value: number) => this.onSizeInput({ screen: value })}
                    .setImage=${(value: number) => this.onSizeInput({ canvas: value })}
                ></size-input>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

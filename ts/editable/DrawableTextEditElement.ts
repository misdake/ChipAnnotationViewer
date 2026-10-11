import { customElement, html, LitElement, property, TemplateResult } from "lit-element";
import { DrawableText } from "./DrawableText";
import { Canvas } from "../Canvas";
import { alphaOf, rgbOf } from "../util/Color";
import "../elements/ColorAlphaElement"
import "../elements/NumberInputElement"
import "../elements/TextInputElement"
import "../elements/SizeInputElement"
import "../elements/TriStateCheckboxElement"
import { getUnifiedValue } from "../util/MultiSelect";
import { cloneIcon, deleteIcon, linkIcon } from "../util/Icons";
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
    @property()
    extraActions: TemplateResult;

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
        return getUnifiedValue(this.texts, t => this.stripLinkMarkup(t.text));
    }
    private getLink(): string | undefined {
        return getUnifiedValue(this.texts, t => t.link || '');
    }
    private getLinkBadgeLabel(): string {
        const markup = getUnifiedValue(this.texts, t => this.linkMarkupOf(t.text));
        if (!markup) return '';
        const chipLink = DrawableText.CHIP_LINK_REGEX.exec(markup);
        if (chipLink) return chipLink[1];
        const annotationLink = DrawableText.ANNOTATION_LINK_REGEX.exec(markup);
        return annotationLink ? `${annotationLink[2]} · #${annotationLink[3]}` : '';
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

    //the link markup (@chip[...] / @annotation[...](id) / @comment[...](id)) lives in the text but is never shown in the text box
    private stripLinkMarkup(value: string): string {
        const markup = this.linkMarkupOf(value);
        return markup ? value.replace(markup, "").replace(/\s+$/, "") : value;
    }
    private linkMarkupOf(value: string): string {
        const match = DrawableText.CHIP_LINK_REGEX.exec(value) || DrawableText.ANNOTATION_LINK_REGEX.exec(value);
        return match ? match[0] : "";
    }

    private editText = (content: string) => {
        annotationHistory.mutateDrawables(this.canvas, this.texts, "text.content", (items) => {
            for (const text of items as DrawableText[]) {
                const markup = this.linkMarkupOf(text.text);
                text.text = markup ? content + markup : content;
            }
        }, annotationHistory.mergeKey("text.content", this.texts));
        this.requestUpdate();
    };
    private setMultiline = (multiline: boolean) => {
        annotationHistory.mutateDrawables(this.canvas, this.texts, "text.multiline", (items) => {
            for (const text of items as DrawableText[]) text.multiline = multiline;
        });
        this.requestUpdate();
    };

    private linkInputOpen = false;
    private linkError = '';

    private toggleLinkInput = () => {
        this.linkInputOpen = !this.linkInputOpen;
        this.linkError = '';
        this.requestUpdate();
        if (this.linkInputOpen) {
            this.updateComplete.then(() => {
                const input = this.querySelector('input.linkUrlInput') as HTMLInputElement;
                if (input) input.focus();
            });
        }
    };

    //recognize a link to this viewer and turn it into text-link syntax
    private parseLinkUrl(raw: string): string | null {
        let url: URL;
        try {
            url = new URL(raw.trim());
        } catch (_) {
            return null;
        }
        if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return null;
        const chip = url.searchParams.get('chip') || url.searchParams.get('map');
        if (!chip || !/^\w+$/.test(chip)) return null;
        const annotation = parseInt(url.searchParams.get('annotation') || '0', 10);
        if (annotation > 0) return `@annotation[${chip}](${annotation})`;
        const commentId = parseInt(url.searchParams.get('commentId') || '0', 10);
        if (commentId > 0) return `@comment[${chip}](${commentId})`;
        return `@chip[${chip}]`;
    }

    private applyLink = (raw: string) => {
        const trimmed = raw.trim();
        let suffix = '';
        if (trimmed) {
            suffix = this.parseLinkUrl(trimmed);
            if (!suffix) {
                this.linkError = 'Not a link to this viewer (expected a chip/annotation link)';
                this.requestUpdate();
                return;
            }
        }
        const markup = suffix; //empty input removes the link
        annotationHistory.mutateDrawables(this.canvas, this.texts, "text.content", (items) => {
            for (const text of items as DrawableText[]) {
                const body = this.stripLinkMarkup(text.text);
                text.text = body + markup;
            }
        });
        this.linkInputOpen = false;
        this.linkError = '';
        this.requestUpdate();
    };

    private onLinkInputKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            this.applyLink((event.target as HTMLInputElement).value);
            event.preventDefault();
        } else if (event.key === 'Escape') {
            this.toggleLinkInput();
            event.preventDefault();
        }
        event.stopPropagation();
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
        const link = this.getLink() || "";
        const actionButtons = this.showActions || this.extraActions
            ? html`
                <div class="toolButtonRow">
                    ${this.showActions ? html`
                        <button class="iconButton deleteIconButton" @click=${() => this.confirmDeleteText()} title="Delete Text" aria-label="Delete Text">${deleteIcon}</button>
                        <button class="iconButton" @click=${() => this.copyText()} title="Clone Text" aria-label="Clone Text">${cloneIcon}</button>
                    ` : html``}
                    ${this.extraActions || html``}
                </div>
            `
            : html``;
        return html`
            ${actionButtons}

            <div class="editorConfigSection">
                <div class="configColorHeader">
                    <span class="editorConfigTitle">Text</span>
                    <span class="configColorHeaderControls">
                        ${link ? html`
                            <span class="linkBadge" @click=${this.toggleLinkInput} title=${link}>
                                ${linkIcon}<span class="linkBadgeLabel">${this.getLinkBadgeLabel()}</span>
                                <span class="linkBadgeRemove" title="Remove link" @click=${(event: Event) => {
                                    event.stopPropagation();
                                    this.applyLink('');
                                }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                            </span>
                        ` : html`
                            <button class="linkBadgeAdd" @click=${this.toggleLinkInput} title="Add link">${linkIcon}<span>link</span></button>
                        `}
                        <tristate-checkbox
                            .state=${multiline ? 'all' : 'none'}
                            label="Multiline"
                            .onChange=${(state: "none" | "all") => this.setMultiline(state === "all")}
                        ></tristate-checkbox>
                    </span>
                </div>
                ${this.linkInputOpen ? html`
                    <div class="linkUrlRow">
                        <input
                            class="linkUrlInput"
                            type="text"
                            placeholder="Paste a viewer link"
                            title="Paste a link to this viewer, e.g. ?chip=Fiji&annotation=12 — recognized as @chip/@annotation (@comment is supported for legacy links only). Submit with an empty value to remove the link."
                            .value=${link}
                            @keydown=${this.onLinkInputKeydown}
                        />
                        <button class="linkConfirmButton" title="Apply link" aria-label="Apply link" @click=${() => {
                            const input = this.querySelector('input.linkUrlInput') as HTMLInputElement;
                            if (input) this.applyLink(input.value);
                        }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,12 10,18 20,6"/></svg></button>
                    </div>
                    ${this.linkError ? html`<div style="color: var(--error-color, #d33); font-size: 12px; margin-top: 4px;">${this.linkError}</div>` : ''}
                ` : ''}
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

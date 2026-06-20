import { customElement, html, LitElement, property, TemplateResult } from "lit-element";

export type ModalStatusKind = "saving" | "success" | "warning" | "error";

export interface AppModalContext {
    input?: HTMLInputElement;
    inputValue: string;
    close: () => void;
    setStatus: (message: string, kind?: ModalStatusKind) => void;
    setPrimaryDisabled: (disabled: boolean) => void;
    setPrimaryText: (text: string) => void;
}

export interface AppModalInputConfig {
    label: string;
    value?: string;
    required?: boolean;
    confirmText?: string;
    selectOnOpen?: boolean;
    autocomplete?: string;
    spellcheck?: boolean;
}

export interface AppModalConfig {
    title: string;
    ariaLabel?: string;
    body?: TemplateResult;
    input?: AppModalInputConfig;
    primaryText: string;
    primaryClassName?: string;
    cancelText?: string;
    showCancel?: boolean;
    initialStatus?: string;
    onSubmit: (context: AppModalContext) => boolean | void | Promise<boolean | void>;
    onInputChange?: (value: string, context: AppModalContext) => void;
    onCancel?: () => void;
}

@customElement("app-modal")
class AppModalElement extends LitElement {
    @property({ type: Boolean })
    openState: boolean = false;

    private config: AppModalConfig | null = null;
    private openVersion = 0;
    private inputValue = "";
    private statusMessage = "";
    private statusKind: ModalStatusKind = "warning";
    private primaryText = "";
    private primaryDisabled = false;
    private submitting = false;
    private previouslyFocused: HTMLElement | null = null;

    constructor() {
        super();
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.onInput = this.onInput.bind(this);
        this.onInputKeyDown = this.onInputKeyDown.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.classList.add("appModalRoot");
        window.addEventListener("keydown", this.handleKeyDown);
    }

    disconnectedCallback() {
        window.removeEventListener("keydown", this.handleKeyDown);
        super.disconnectedCallback();
    }

    createRenderRoot() {
        return this;
    }

    public open(config: AppModalConfig) {
        this.cancelCurrentModal();

        this.previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.config = config;
        this.inputValue = config.input ? (config.input.value || "") : "";
        this.statusMessage = config.initialStatus || "";
        this.statusKind = "warning";
        this.primaryText = config.primaryText;
        this.submitting = false;
        this.primaryDisabled = this.computePrimaryDisabled();
        this.openState = true;
        this.openVersion++;
        this.classList.add("appModalOpen");
        this.requestUpdate();

        const version = this.openVersion;
        this.updateComplete.then(() => {
            if (version !== this.openVersion || !this.openState) return;
            this.focusInput();
        });
    }

    private close(runCancel: boolean = false) {
        if (!this.openState) return;
        const config = this.config;
        this.openState = false;
        this.submitting = false;
        this.classList.remove("appModalOpen");
        this.openVersion++;
        this.requestUpdate();
        if (runCancel && config && config.onCancel) config.onCancel();
        this.restoreFocus();
    }

    private cancelCurrentModal() {
        if (!this.openState) return;
        const config = this.config;
        this.openState = false;
        this.submitting = false;
        this.classList.remove("appModalOpen");
        this.openVersion++;
        if (config && config.onCancel) config.onCancel();
        this.restoreFocus();
    }

    private restoreFocus() {
        const target = this.previouslyFocused;
        this.previouslyFocused = null;
        if (target && document.body.contains(target)) {
            target.focus({ preventScroll: true });
        }
    }

    private handleKeyDown(ev: KeyboardEvent) {
        if (!this.openState) return;
        if (ev.key === "Escape") {
            ev.preventDefault();
            this.close(true);
            return;
        }
        if (ev.key === "Tab") {
            this.trapFocus(ev);
        }
    }

    private focusInput() {
        const input = this.querySelector("#app-modal-input") as HTMLInputElement;
        if (input && this.config && this.config.input) {
            input.focus({ preventScroll: true });
            if (this.config.input.selectOnOpen) input.select();
            return;
        }
        const focusable = this.getFocusableElements();
        if (focusable.length) focusable[0].focus({ preventScroll: true });
    }

    private getFocusableElements(): HTMLElement[] {
        return Array.from(this.querySelectorAll<HTMLElement>(
            "button:not([disabled]), input:not([disabled]), a[href], textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )).filter(element => element.offsetParent !== null || element === document.activeElement);
    }

    private trapFocus(ev: KeyboardEvent) {
        const focusable = this.getFocusableElements();
        if (!focusable.length) {
            ev.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement;
        if (ev.shiftKey && active === first) {
            ev.preventDefault();
            last.focus({ preventScroll: true });
        } else if (!ev.shiftKey && active === last) {
            ev.preventDefault();
            first.focus({ preventScroll: true });
        }
    }

    private computePrimaryDisabled(): boolean {
        if (!this.config || !this.config.input) return false;
        const value = this.inputValue.trim();
        return (this.config.input.required && !value)
            || (!!this.config.input.confirmText && this.inputValue !== this.config.input.confirmText);
    }

    private setStatus(message: string, kind: ModalStatusKind = "warning") {
        this.statusMessage = message;
        this.statusKind = kind;
        this.requestUpdate();
    }

    private context(): AppModalContext {
        const input = this.querySelector("#app-modal-input") as HTMLInputElement;
        return {
            input: input || undefined,
            inputValue: this.inputValue.trim(),
            close: () => this.close(false),
            setStatus: (message, kind) => this.setStatus(message, kind),
            setPrimaryDisabled: disabled => {
                this.primaryDisabled = disabled;
                this.requestUpdate();
            },
            setPrimaryText: text => {
                this.primaryText = text;
                this.requestUpdate();
            },
        };
    }

    private onInput(ev: Event) {
        this.inputValue = (ev.target as HTMLInputElement).value;
        this.primaryDisabled = this.computePrimaryDisabled();
        if (this.statusMessage) this.setStatus("");
        if (this.config && this.config.onInputChange) {
            this.config.onInputChange(this.inputValue, this.context());
        }
        this.requestUpdate();
    }

    private async submit() {
        if (!this.config || this.submitting) return;

        this.primaryDisabled = this.computePrimaryDisabled();
        if (this.primaryDisabled) {
            this.focusInput();
            this.requestUpdate();
            return;
        }

        const version = this.openVersion;
        this.submitting = true;
        this.primaryDisabled = true;
        this.requestUpdate();

        try {
            const shouldClose = await this.config.onSubmit(this.context());
            if (version !== this.openVersion) return;
            if (shouldClose !== false) {
                this.close(false);
                return;
            }
        } catch (error) {
            console.warn("App modal submit failed", error);
            if (version === this.openVersion) this.setStatus("Action failed. Please try again.", "error");
        }

        if (version === this.openVersion) {
            this.submitting = false;
            this.primaryDisabled = this.computePrimaryDisabled();
            this.requestUpdate();
        }
    }

    private onInputKeyDown(ev: KeyboardEvent) {
        if (ev.key === "Enter") {
            ev.preventDefault();
            this.submit();
        }
    }

    render() {
        const config = this.config;
        const input = config && config.input;
        const primaryClass = `configButton appModalPrimary${config && config.primaryClassName ? ` ${config.primaryClassName}` : ""}`;

        return html`
            <div class="chipInfoModalOverlay">
                <button class="chipInfoBackdrop appModalBackdrop" type="button" aria-label="Cancel" @click=${() => this.close(true)}></button>
                <div class="chipInfoModal" role="dialog" aria-modal="true" aria-label=${config ? (config.ariaLabel || config.title) : ""}>
                    <div class="chipInfoModalHeader">
                        <h3 class="appModalTitle">${config ? config.title : ""}</h3>
                        <button class="chipInfoCloseButton appModalClose" type="button" aria-label="Cancel" @click=${() => this.close(true)}>
                            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="chipInfoModalBody">
                        <div class="appModalBody">${config && config.body ? config.body : html``}</div>
                        ${input
                            ? html`
                                <div class="appModalInputWrap">
                                    <label class="deleteAnnotationPrompt" for="app-modal-input">${input.label}</label>
                                    <input
                                        id="app-modal-input"
                                        type="text"
                                        autocomplete=${input.autocomplete || "off"}
                                        .value=${this.inputValue}
                                        .spellcheck=${input.spellcheck === true}
                                        @input=${this.onInput}
                                        @keydown=${this.onInputKeyDown}
                                    >
                                </div>
                            `
                            : html``}
                        <p class="appModalStatus appModalStatus-${this.statusKind}">${this.statusMessage}</p>
                        <div class="deleteAnnotationActions">
                            ${config && config.showCancel !== false
                                ? html`<button class="configButton appModalCancel" type="button" @click=${() => this.close(true)}>${config.cancelText || "Cancel"}</button>`
                                : html``}
                            <button class=${primaryClass} type="button" ?disabled=${this.primaryDisabled} @click=${() => this.submit()}>${this.primaryText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

export class AppModal {
    private static readonly ELEMENT_ID = "app-modal-root";

    private static ensureElement(): AppModalElement {
        let element = document.getElementById(this.ELEMENT_ID) as AppModalElement;
        if (element) return element;

        element = document.createElement("app-modal") as AppModalElement;
        element.id = this.ELEMENT_ID;
        document.body.appendChild(element);
        return element;
    }

    static open(config: AppModalConfig) {
        this.ensureElement().open(config);
    }
}

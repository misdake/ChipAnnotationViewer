import { customElement, html, LitElement, property } from 'lit-element';
import { Annotation } from '../data/Annotation';
import { ChipContent } from '../data/Chip';
import { Canvas } from '../Canvas';
import { ClientApi } from '../data/ClientApi';
import { deleteIcon, redoIcon, saveIcon, undoIcon } from '../util/Icons';


@customElement('title-element')
export class TitleElement extends LitElement {
    private static readonly DELETE_MODAL_ID = "delete-annotation-modal-state";
    private static readonly DELETE_MODAL_ROOT_ID = "delete-annotation-modal-root";

    @property()
    chipContent: ChipContent;
    @property()
    annotation: Annotation;
    @property()
    canvas: Canvas;
    @property()
    editMode: 'none' | 'create' | 'update' = 'none';
    @property()
    onUserChange: (userId: number, userName: string) => void;
    @property()
    onUndo: () => void;
    @property()
    onRedo: () => void;
    @property({ type: Boolean })
    canUndo: boolean = false;
    @property({ type: Boolean })
    canRedo: boolean = false;

    @property()
    userName: string;
    @property()
    menuOpen: boolean = false;

    userId: number;
    private toast(message: string) {
        window.dispatchEvent(new CustomEvent<string>("chipannotation-toast", { detail: message }));
    }

    private notifyAnnotationCreated(aid: number) {
        window.dispatchEvent(new CustomEvent<number>("chipannotation-annotation-created", { detail: aid }));
    }

    private notifyAnnotationDeleted(aid: number) {
        window.dispatchEvent(new CustomEvent<number>("chipannotation-annotation-deleted", { detail: aid }));
    }

    private ensureDeleteAnnotationModal() {
        const previousRoot = document.getElementById(TitleElement.DELETE_MODAL_ROOT_ID);
        if (previousRoot) previousRoot.remove();

        const root = document.createElement("div");
        root.id = TitleElement.DELETE_MODAL_ROOT_ID;
        root.innerHTML = `
            <input class="chipInfoModalState" id="${TitleElement.DELETE_MODAL_ID}" type="checkbox">
            <div class="chipInfoModalOverlay">
                <label class="chipInfoBackdrop" for="${TitleElement.DELETE_MODAL_ID}" aria-label="Cancel deletion"></label>
                <div class="chipInfoModal" role="dialog" aria-modal="true" aria-label="Delete Annotation">
                    <div class="chipInfoModalHeader">
                        <h3>Delete Annotation</h3>
                        <label class="chipInfoCloseButton" for="${TitleElement.DELETE_MODAL_ID}" aria-label="Cancel deletion">
                            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"></path>
                            </svg>
                        </label>
                    </div>
                    <div class="chipInfoModalBody">
                        <p class="deleteAnnotationWarning">Warning: this permanently deletes the annotation.</p>
                        <p class="deleteAnnotationWarning">This action cannot be undone. The annotation data cannot be recovered from this viewer.</p>
                        <p class="deleteAnnotationTarget">Annotation: <strong id="delete-annotation-title"></strong></p>
                        <label class="deleteAnnotationPrompt" for="delete-annotation-confirmation">Type <strong>DELETE</strong> to confirm:</label>
                        <input id="delete-annotation-confirmation" type="text" autocomplete="off" spellcheck="false">
                        <div class="deleteAnnotationActions">
                            <label class="configButton" for="${TitleElement.DELETE_MODAL_ID}">Cancel</label>
                            <button id="delete-annotation-submit" class="configButton deleteAnnotationSubmit" disabled>Delete Permanently</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(root);

        const input = document.getElementById("delete-annotation-confirmation") as HTMLInputElement;
        const submit = document.getElementById("delete-annotation-submit") as HTMLButtonElement;
        input.addEventListener("input", () => {
            submit.disabled = input.value !== "DELETE";
        });
        submit.addEventListener("click", () => this.confirmDeleteAnnotation());
    }

    private getLogin() {
        ClientApi.getCurrentLogin().then(({userName, userId}) => {
            console.log('login:', userName, userId);
            this.userName = userName;
            this.userId = userId;
            if (this.onUserChange) this.onUserChange(userId || 0, userName || '');
        });
    }

    protected firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
        super.firstUpdated(_changedProperties);

        this.getLogin();
        this.ensureDeleteAnnotationModal();

        window.addEventListener('message', (e: MessageEvent) => {
            if (e.data && e.data.type === 'chipannotation-login-done') {
                this.getLogin();
                ClientApi.closeAllLoginTabs();
            }
        });

        window.addEventListener('storage', (e) => {
            if (e.key === 'chipannotation-token' && e.newValue) {
                this.getLogin();
            }
            ClientApi.closeAllLoginTabs();
        });
    }

    private getData(): string {
        let data = this.canvas.save();
        this.annotation.title = (document.getElementById('inputTitle') as HTMLInputElement).value;
        if (!this.annotation.title) this.annotation.title = 'untitled';
        return JSON.stringify(data);
    }

    private uploadAnnotation() {
        if (!this.chipContent || !this.annotation) return;

        if (!this.userId) {
            this.onClickLogin();
            return;
        }
        if (this.editMode === 'none') return;

        let dataString = this.getData();
        if (this.editMode === 'create') {
            ClientApi.createAnnotation(this.chipContent.name, this.annotation.title, dataString).then(r => {
                Object.assign(this.annotation, r);
                this.toast('Created');
                this.notifyAnnotationCreated(r.aid);
                //TODO refresh annotationlist and replace url
                //TODO via global event bus?

            }).catch(e => {
                console.log('createAnnotation error:', e);
            });
        } else if (this.editMode === 'update') {
            ClientApi.updateAnnotation(this.annotation.aid, this.annotation.title, dataString).then(r => {
                Object.assign(this.annotation, r);
                this.toast('Updated');
            }).catch(e => {
                console.log('updateAnnotation error:', e);
            });
        }
    }

    private openDeleteAnnotationModal() {
        if (!this.annotation || this.annotation.aid <= 0 || this.annotation.userId !== this.userId) return;

        const title = this.annotation.title || 'untitled';
        const modalState = document.getElementById(TitleElement.DELETE_MODAL_ID) as HTMLInputElement;
        const titleElement = document.getElementById("delete-annotation-title");
        const input = document.getElementById("delete-annotation-confirmation") as HTMLInputElement;
        const submit = document.getElementById("delete-annotation-submit") as HTMLButtonElement;
        if (!modalState || !titleElement || !input || !submit) return;

        titleElement.textContent = title;
        input.value = "";
        submit.disabled = true;
        modalState.checked = true;
        input.focus();
    }

    private confirmDeleteAnnotation() {
        if (!this.annotation || this.annotation.aid <= 0 || this.annotation.userId !== this.userId) return;

        const input = document.getElementById("delete-annotation-confirmation") as HTMLInputElement;
        const submit = document.getElementById("delete-annotation-submit") as HTMLButtonElement;
        const modalState = document.getElementById(TitleElement.DELETE_MODAL_ID) as HTMLInputElement;
        if (!input || !submit || !modalState || input.value !== "DELETE") return;

        const aid = this.annotation.aid;
        submit.disabled = true;
        ClientApi.deleteAnnotation(aid).then(deleted => {
            if (!deleted) throw new Error('Delete annotation rejected');
            modalState.checked = false;
            this.toast('Deleted');
            this.notifyAnnotationDeleted(aid);
        }).catch(e => {
            console.log('deleteAnnotation error:', e);
            this.toast('Delete failed');
            submit.disabled = false;
        });
    }

    private onClickLogin() {
        ClientApi.openLoginTab();
    }
    private onClickLogout() {
        ClientApi.logout().then(() => {
            this.userName = '';
            this.userId = 0;
            this.menuOpen = false;
            if (this.onUserChange) this.onUserChange(0, '');
            this.requestUpdate();
        });
    }
    private toggleUserMenu() {
        this.menuOpen = !this.menuOpen;
        this.requestUpdate();
    }

    render() {
        let title = '';
        if (this.annotation) {
            title = this.annotation.title || '';
        }

        let loginControl = this.userId > 0
            ? html`
                <div class="userMenu">
                    <div class="userMenuRow">
                        <span class="userMenuName">${this.userName}</span>
                        <button class="userMenuToggle" @click="${this.toggleUserMenu}" aria-label="User menu">▶</button>
                        <button id="userLogoutInline" class="configButton" style="${this.menuOpen ? '' : 'display:none;'}" @click="${this.onClickLogout}">Logout</button>
                    </div>
                </div>
            `
            : html`<button id="userLoginInline" class="configButton" @click="${this.onClickLogin}">Login</button>`;
        const canDelete = this.editMode === 'update'
            && this.annotation
            && this.annotation.aid > 0
            && this.annotation.userId === this.userId;
        const buttonLine = this.editMode !== 'none'
            ? html`
                <div class="annotationActionRow">
                    <button class="iconButton" @click="${this.uploadAnnotation}" title="Save Annotation" aria-label="Save Annotation">${saveIcon}</button>
                    <button id="buttonUndo" class="iconButton historyButton" ?disabled="${!this.canUndo}" @click="${() => this.onUndo && this.onUndo()}" title="Undo (Ctrl+Z)" aria-label="Undo">${undoIcon}</button>
                    <button id="buttonRedo" class="iconButton historyButton" ?disabled="${!this.canRedo}" @click="${() => this.onRedo && this.onRedo()}" title="Redo (Ctrl+Y / Ctrl+Shift+Z)" aria-label="Redo">${redoIcon}</button>
                    ${canDelete
                        ? html`<button class="iconButton deleteIconButton annotationDeleteButton" @click="${this.openDeleteAnnotationModal}" title="Delete Annotation" aria-label="Delete Annotation">${deleteIcon}</button>`
                        : html``}
                </div>
            `
            : html``;
        const titleRow = this.editMode !== 'none'
            ? html`
                <div class="titleInput">
                    <label for="dataTitle">Title:</label>
                    <input id="inputTitle" type="text" class="configText" value="${title}">
                </div>
            `
            : html``;

        return html`
            <div class="titleInput loginInput">
                <label for="loginMenu">Login:</label>
                <div id="loginMenu" class="loginControl">${loginControl}</div>
            </div>
            ${titleRow}
            ${buttonLine}
        `;
    }

    createRenderRoot() {
        return this;
    }

}

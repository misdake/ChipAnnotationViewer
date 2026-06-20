import { customElement, html, LitElement, property } from 'lit-element';
import { Annotation, AnnotationData } from '../data/Annotation';
import { ChipContent } from '../data/Chip';
import { Canvas } from '../Canvas';
import { ClientApi } from '../data/ClientApi';
import { deleteIcon, newAnnotationIcon, redoIcon, saveIcon, undoIcon } from '../util/Icons';
import { notifyToast, ToastKind } from '../util/Toast';
import { AppModal, AppModalContext } from '../util/AppModal';


@customElement('title-element')
export class TitleElement extends LitElement {
    @property()
    chipContent: ChipContent;
    @property()
    annotation: Annotation;
    @property()
    titleValue: string = '';
    @property()
    canvas: Canvas;
    @property()
    editMode: 'none' | 'create' | 'update' = 'none';
    @property({ type: Boolean })
    canCreate: boolean = false;
    @property({ type: Boolean })
    dirty: boolean = false;
    @property()
    onAnnotationChanged: (title: string) => void;
    @property()
    onAnnotationSaved: () => void;
    @property()
    canDiscardCurrentAnnotation: () => boolean;
    @property()
    onAnnotationCreated: () => void;
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
    private createdAnnotationIdToSelect = 0;
    private toast(message: string, kind: ToastKind = "success") {
        notifyToast(message, kind);
    }

    private notifyAnnotationCreated(aid: number) {
        window.dispatchEvent(new CustomEvent<number>("chipannotation-annotation-created", { detail: aid }));
    }

    private notifyAnnotationDeleted(aid: number) {
        window.dispatchEvent(new CustomEvent<number>("chipannotation-annotation-deleted", { detail: aid }));
    }

    private getLogin() {
        ClientApi.getCurrentLogin().then(({userName, userId}) => {
            console.log('login:', userName, userId);
            this.userName = userName;
            this.userId = userId;
            if (this.onUserChange) this.onUserChange(userId || 0, userName || '');
        }).catch(e => {
            console.warn('getCurrentLogin error:', e);
            this.toast('Could not check login status', 'warning');
        });
    }

    protected firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
        super.firstUpdated(_changedProperties);

        this.getLogin();

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
        this.toast('Saving...', 'saving');
        if (this.editMode === 'create') {
            ClientApi.createAnnotation(this.chipContent.name, this.annotation.title, dataString).then(r => {
                Object.assign(this.annotation, r);
                this.toast('Saved');
                if (this.onAnnotationSaved) this.onAnnotationSaved();
                if (this.onAnnotationCreated) this.onAnnotationCreated();
                this.notifyAnnotationCreated(r.aid);
            }).catch(e => {
                console.log('createAnnotation error:', e);
                this.toast('Save failed', 'warning');
            });
        } else if (this.editMode === 'update') {
            ClientApi.updateAnnotation(this.annotation.aid, this.annotation.title, dataString).then(r => {
                Object.assign(this.annotation, r);
                this.toast('Saved');
                if (this.onAnnotationSaved) this.onAnnotationSaved();
            }).catch(e => {
                console.log('updateAnnotation error:', e);
                this.toast('Save failed', 'warning');
            });
        }
    }

    private openCreateAnnotationModal() {
        if (!this.canCreate || !this.chipContent) return;
        if (this.canDiscardCurrentAnnotation && !this.canDiscardCurrentAnnotation()) return;

        this.createdAnnotationIdToSelect = 0;
        AppModal.open({
            title: "New Annotation",
            ariaLabel: "New Annotation",
            input: {
                label: "Title",
                required: true,
            },
            primaryText: "Create",
            onSubmit: context => this.confirmCreateAnnotation(context),
            onInputChange: (_value, context) => {
                if (!this.createdAnnotationIdToSelect) return;
                this.createdAnnotationIdToSelect = 0;
                context.setPrimaryText("Create");
            },
            onCancel: () => {
                this.createdAnnotationIdToSelect = 0;
            },
        });
    }

    private async confirmCreateAnnotation(context: AppModalContext): Promise<boolean> {
        if (!this.canCreate || !this.chipContent) return false;

        const title = context.inputValue;
        if (!title) {
            context.setStatus("Enter a title before creating.");
            context.input?.focus({ preventScroll: true });
            return false;
        }

        context.setPrimaryDisabled(true);
        context.setStatus("Creating...", "saving");

        try {
            let createdAid = this.createdAnnotationIdToSelect;
            if (!createdAid) {
                const dataString = JSON.stringify(AnnotationData.dummy());
                const created = await ClientApi.createAnnotation(this.chipContent.name, title, dataString);
                createdAid = created.aid;
                this.createdAnnotationIdToSelect = createdAid;
                context.setPrimaryText("Retry");
            }

            const annotations = await ClientApi.listAnnotationByChip(this.chipContent.name);
            const listed = annotations && annotations.some(annotation => annotation.aid === createdAid);
            if (!listed) throw new Error("Created annotation was not returned by the annotation list");

            this.toast("Created");
            this.notifyAnnotationCreated(createdAid);
            return true;
        } catch (e) {
            console.log("createAnnotation error:", e);
            context.setStatus(
                this.createdAnnotationIdToSelect
                    ? "Created, but list reload failed. Retry to select it."
                    : "Create failed. Check login or network, then retry."
            );
            this.toast("Create failed", "warning");
            context.setPrimaryDisabled(false);
            return false;
        }
    }

    private openDeleteAnnotationModal() {
        if (!this.annotation || this.annotation.aid <= 0 || this.annotation.userId !== this.userId) return;

        const title = this.annotation.title || 'untitled';
        AppModal.open({
            title: "Delete Annotation",
            ariaLabel: "Delete Annotation",
            input: {
                label: "Type DELETE to confirm:",
                required: true,
                confirmText: "DELETE",
            },
            primaryText: "Delete Permanently",
            primaryClassName: "deleteAnnotationSubmit",
            body: html`
                <p class="deleteAnnotationWarning">Warning: this permanently deletes the annotation.</p>
                <p class="deleteAnnotationWarning">This action cannot be undone. The annotation data cannot be recovered from this viewer.</p>
                <p class="deleteAnnotationTarget">Annotation: <strong>${title}</strong></p>
            `,
            onSubmit: context => this.confirmDeleteAnnotation(context),
        });
    }

    private async confirmDeleteAnnotation(context: AppModalContext): Promise<boolean> {
        if (!this.annotation || this.annotation.aid <= 0 || this.annotation.userId !== this.userId) return false;
        if (!context.input || context.input.value !== "DELETE") return false;

        const aid = this.annotation.aid;
        context.setPrimaryDisabled(true);
        context.setStatus("Deleting...", "saving");
        try {
            const deleted = await ClientApi.deleteAnnotation(aid);
            if (!deleted) throw new Error('Delete annotation rejected');
            this.toast('Deleted', 'warning');
            this.notifyAnnotationDeleted(aid);
            return true;
        } catch (e) {
            console.log('deleteAnnotation error:', e);
            context.setStatus("Delete failed. Check login or network, then retry.");
            this.toast('Delete failed', 'warning');
            context.setPrimaryDisabled(false);
            return false;
        }
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

    private onTitleInput(event: Event) {
        if (this.onAnnotationChanged) this.onAnnotationChanged((event.target as HTMLInputElement).value);
    }

    render() {
        let title = '';
        if (this.annotation) title = this.titleValue !== undefined && this.titleValue !== null ? this.titleValue : (this.annotation.title || '');

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
        const buttonLine = this.editMode !== 'none' || this.canCreate
            ? html`
                <div class="annotationActionRow">
                    ${this.editMode !== 'none'
                        ? html`
                            <button id="buttonSaveAnnotation" class="iconButton" ?disabled="${!this.dirty}" @click="${() => this.uploadAnnotation()}" title="Save Annotation (Ctrl+S)" aria-label="Save Annotation">${saveIcon}</button>
                            <button id="buttonUndo" class="iconButton historyButton" ?disabled="${!this.canUndo}" @click="${() => this.onUndo && this.onUndo()}" title="Undo (Ctrl+Z)" aria-label="Undo">${undoIcon}</button>
                            <button id="buttonRedo" class="iconButton historyButton" ?disabled="${!this.canRedo}" @click="${() => this.onRedo && this.onRedo()}" title="Redo (Ctrl+Y / Ctrl+Shift+Z)" aria-label="Redo">${redoIcon}</button>
                        `
                        : html``}
                    ${this.canCreate
                        ? html`<button class="iconButton createIconButton annotationCreateButton" @click="${() => this.openCreateAnnotationModal()}" title="New Annotation" aria-label="New Annotation">${newAnnotationIcon}</button>`
                        : html``}
                    ${canDelete
                        ? html`<button class="iconButton deleteIconButton annotationDeleteButton" @click="${() => this.openDeleteAnnotationModal()}" title="Delete Annotation" aria-label="Delete Annotation">${deleteIcon}</button>`
                        : html``}
                </div>
            `
            : html``;
        const titleRow = this.editMode !== 'none'
            ? html`
                <div class="titleInput">
                    <label for="dataTitle">Title:</label>
                    <input id="inputTitle" type="text" class="configText" value="${title}" @input="${(event: Event) => this.onTitleInput(event)}">
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

import { customElement, html, LitElement, property } from 'lit-element';
import { Annotation, AnnotationData } from '../data/Annotation';
import { ChipContent } from '../data/Chip';
import { Canvas } from '../Canvas';
import { ClientApi } from '../data/ClientApi';
import { deleteIcon, saveIcon } from '../util/Icons';
import { notifyToast, ToastKind } from '../util/Toast';
import { AppModal, AppModalContext } from '../util/AppModal';
import { Selection, SelectType } from '../layers/Selection';
import { DrawablePolyline } from '../editable/DrawablePolyline';
import { AABB } from '../util/AABB';

type ShareFocusMode = 'none' | 'selection' | 'view';

@customElement('title-element')
export class TitleElement extends LitElement {
    private static readonly SHARE_FOCUS_STORAGE_KEY = 'chipannotation-share-focus-mode';
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
    creatingFromScratch: boolean = false;
    @property({ type: Boolean })
    dirty: boolean = false;
    @property()
    getCreateAnnotationData: () => AnnotationData;
    @property()
    onAnnotationChanged: (title: string) => void;
    @property()
    onAnnotationSaved: () => void;
    @property()
    canDiscardCurrentAnnotation: () => boolean;
    @property()
    onAnnotationCreated: (annotation?: Annotation, data?: AnnotationData) => void;
    @property()
    onUserChange: (userId: number, userName: string) => void;

    @property()
    userName: string;
    @property()
    menuOpen: boolean = false;

    userId: number;
    private createdAnnotationIdToSelect = 0;
    private annotationDataToCreate: AnnotationData = null;
    private readonly closeUserMenuOnOutsideClick = (event: PointerEvent) => {
        if (!this.menuOpen || this.contains(event.target as Node)) return;
        this.menuOpen = false;
        this.hideControlsHint();
    };

    private hideControlsHint() {
        document.getElementById('hint')?.classList.remove('visible');
    }

    private toggleControlsHint() {
        const toggle = this.querySelector('#hintToggle') as HTMLButtonElement;
        const hint = document.getElementById('hint');
        if (!toggle || !hint) return;
        const show = !hint.classList.contains('visible');
        hint.classList.toggle('visible', show);
        toggle.setAttribute('aria-expanded', String(show));
        if (!show) return;
        const rect = toggle.getBoundingClientRect();
        const hintRect = hint.getBoundingClientRect();
        hint.style.top = `${Math.max(8, Math.min(window.innerHeight - hintRect.height - 8, rect.bottom + 8))}px`;
        hint.style.left = `${Math.min(window.innerWidth - hintRect.width - 8, Math.max(8, rect.right - hintRect.width))}px`;
    }

    connectedCallback(): void {
        super.connectedCallback();
        document.addEventListener('pointerdown', this.closeUserMenuOnOutsideClick);
    }

    disconnectedCallback(): void {
        document.removeEventListener('pointerdown', this.closeUserMenuOnOutsideClick);
        this.hideControlsHint();
        super.disconnectedCallback();
    }
    private toast(message: string, kind: ToastKind = "success") {
        notifyToast(message, kind);
    }

    private notifyAnnotationCreated(aid: number) {
        window.dispatchEvent(new CustomEvent<number>("chipannotation-annotation-created", { detail: aid }));
    }

    private notifyAnnotationDeleted(aid: number) {
        window.dispatchEvent(new CustomEvent<number>("chipannotation-annotation-deleted", { detail: aid }));
    }

    private notifyAnnotationUpdated(aid: number) {
        window.dispatchEvent(new CustomEvent<number>("chipannotation-annotation-updated", { detail: aid }));
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
                ClientApi.storeLoginToken(e);
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
        window.addEventListener('chipannotation-new-annotation-requested', () => this.openCreateAnnotationModal());
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
                this.notifyAnnotationUpdated(r.aid);
            }).catch(e => {
                console.log('updateAnnotation error:', e);
                this.toast('Save failed', 'warning');
            });
        }
    }

    private openCreateAnnotationModal() {
        if (!this.canCreate || !this.chipContent) return;
        if (!this.creatingFromScratch && this.canDiscardCurrentAnnotation && !this.canDiscardCurrentAnnotation()) return;

        this.createdAnnotationIdToSelect = 0;
        this.annotationDataToCreate = this.getCreateAnnotationData
            ? this.getCreateAnnotationData()
            : AnnotationData.dummy();
        const temporaryItemCount = (this.annotationDataToCreate.polylines || []).length
            + (this.annotationDataToCreate.texts || []).length;
        AppModal.open({
            title: "New Annotation",
            ariaLabel: "New Annotation",
            body: temporaryItemCount > 0 ? html`
                <div class="createAnnotationDraftNotice">
                    ${temporaryItemCount} temporary item${temporaryItemCount === 1 ? '' : 's'} will be included.
                </div>` : html``,
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
                this.annotationDataToCreate = null;
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
                const dataString = JSON.stringify(this.annotationDataToCreate || AnnotationData.dummy());
                const created = await ClientApi.createAnnotation(this.chipContent.name, title, dataString);
                createdAid = created.aid;
                this.createdAnnotationIdToSelect = createdAid;
                context.setPrimaryText("Retry");
            }

            const annotations = await ClientApi.listAnnotationByChip(this.chipContent.name);
            const listed = annotations && annotations.find(annotation => annotation.aid === createdAid);
            if (!listed) throw new Error("Created annotation was not returned by the annotation list");

            this.toast("Created");
            if (this.onAnnotationCreated) {
                const data = this.annotationDataToCreate || AnnotationData.dummy();
                this.onAnnotationCreated(listed, data);
            }
            this.notifyAnnotationCreated(createdAid);
            this.annotationDataToCreate = null;
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
        if (!this.menuOpen) this.hideControlsHint();
        this.requestUpdate();
    }

    private createShareUrl(focusMode: ShareFocusMode, selectionBounds: AABB, viewBounds: AABB): string {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        if (this.chipContent && this.chipContent.name) url.searchParams.set('chip', this.chipContent.name);
        if (this.annotation && this.annotation.aid > 0) {
            url.searchParams.set('annotation', String(this.annotation.aid));
        }
        const bounds = focusMode === 'selection' ? selectionBounds : focusMode === 'view' ? viewBounds : null;
        if (bounds) {
            url.searchParams.set('focus', focusMode);
            url.searchParams.set('bounds', [bounds.x1, bounds.y1, bounds.x2, bounds.y2]
                .map(value => Number(value.toFixed(4)).toString()).join(','));
        }
        return url.toString();
    }

    private getSelectedPolylineBounds(): AABB {
        if (!this.annotation || this.annotation.aid <= 0) return null;
        const selected = Selection.getSelected();
        let polylines: DrawablePolyline[] = [];
        if (selected.type === SelectType.POLYLINE || selected.type === SelectType.POLYLINE_CREATE) {
            polylines = [selected.item as DrawablePolyline];
        } else if (selected.type === SelectType.MULTIPLE) {
            polylines = (selected.item || []).filter(item => item instanceof DrawablePolyline) as DrawablePolyline[];
        }
        if (!polylines.length) return null;
        const bounds = AABB.combineAll(polylines.map(polyline => polyline.aabb()));
        return [bounds.x1, bounds.y1, bounds.x2, bounds.y2].every(Number.isFinite) ? bounds : null;
    }

    private openShareModal() {
        this.menuOpen = false;
        this.hideControlsHint();
        const selectionBounds = this.getSelectedPolylineBounds();
        const viewBounds = this.canvas && this.chipContent ? this.canvas.getVisibleAABB() : null;
        const storedMode = localStorage.getItem(TitleElement.SHARE_FOCUS_STORAGE_KEY);
        let focusMode: ShareFocusMode = storedMode === 'selection' || storedMode === 'view' ? storedMode : 'none';
        if ((focusMode === 'selection' && !selectionBounds) || (focusMode === 'view' && !viewBounds)) focusMode = 'none';
        const updateUrl = () => {
            const input = document.getElementById('shareUrlInput') as HTMLTextAreaElement;
            if (input) input.value = this.createShareUrl(focusMode, selectionBounds, viewBounds);
        };
        AppModal.open({
            title: 'Share',
            ariaLabel: 'Share current view',
            primaryText: 'Copy',
            cancelText: 'Close',
            body: html`
                <div class="shareConfig">
                    <span class="shareFocusLabel" id="shareFocusLabel">Open behavior</span>
                    <div class="shareFocusOptions" role="radiogroup" aria-labelledby="shareFocusLabel"
                        @change=${(event: Event) => {
                            focusMode = (event.target as HTMLInputElement).value as ShareFocusMode;
                            localStorage.setItem(TitleElement.SHARE_FOCUS_STORAGE_KEY, focusMode);
                            updateUrl();
                        }}>
                        <label class="shareFocusOption">
                            <input type="radio" name="shareFocusMode" value="none" .checked=${focusMode === 'none'}>
                            <span>No extra focus</span>
                        </label>
                        <label class="shareFocusOption ${!selectionBounds ? 'disabled' : ''}">
                            <input type="radio" name="shareFocusMode" value="selection"
                                .checked=${focusMode === 'selection'} ?disabled=${!selectionBounds}>
                            <span>Focus selected polyline</span>
                        </label>
                        <label class="shareFocusOption ${!viewBounds ? 'disabled' : ''}">
                            <input type="radio" name="shareFocusMode" value="view"
                                .checked=${focusMode === 'view'} ?disabled=${!viewBounds}>
                            <span>Focus current view</span>
                        </label>
                    </div>
                    <textarea id="shareUrlInput" rows="3" wrap="soft" readonly spellcheck="false"
                        .value=${this.createShareUrl(focusMode, selectionBounds, viewBounds)} aria-label="Share URL"></textarea>
                </div>
            `,
            onSubmit: context => this.copyShareUrl(context),
        });
    }

    private async copyShareUrl(context: AppModalContext): Promise<boolean> {
        const input = document.getElementById('shareUrlInput') as HTMLTextAreaElement;
        if (!input) {
            context.setStatus('Could not find the share URL.', 'error');
            return false;
        }
        context.setPrimaryText('Copying...');
        try {
            if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard API unavailable');
            await navigator.clipboard.writeText(input.value);
            this.toast('Link copied', 'copied');
            return true;
        } catch (clipboardError) {
            try {
                input.focus({preventScroll: true});
                input.select();
                if (document.execCommand('copy')) {
                    this.toast('Link copied', 'copied');
                    return true;
                }
            } catch (fallbackError) {
                console.warn('Could not copy share URL', clipboardError, fallbackError);
            }
            context.setPrimaryText('Copy');
            context.setStatus('Clipboard permission was denied. Please copy the selected URL manually.', 'error');
            return false;
        }
    }

    private openChangelogModal() {
        this.menuOpen = false;
        this.hideControlsHint();
        AppModal.open({
            title: 'Changelog',
            ariaLabel: 'Application changelog',
            primaryText: 'Close',
            showCancel: false,
            body: html`
                <div class="changelog" aria-label="Changes since version 3.0">
                    <section class="changelogRelease">
                        <h4>
                            <span>3.3.0</span>
                            <span class="changelogCurrent">Current</span>
                            <time datetime="2026-08-23">2026-08-23</time>
                        </h4>
                        <ul>
                            <li>Added share links with a more reliable copy flow.</li>
                            <li>Added selection and box-focus controls, plus share links that reopen the current view or selected geometry.</li>
                            <li>Read-only mode can select and measure annotations.</li>
                            <li>Added temporary chip measurements, with correctly formatted die-area units.</li>
                            <li>Refined responsive canvas tools, selection interactions, and chip-picker scrolling.</li>
                            <li>Browser back and forward navigation now follows chip and annotation changes.</li>
                        </ul>
                    </section>
                    <section class="changelogRelease">
                        <h4>
                            <span>3.2.0</span>
                            <time datetime="2026-08-01">2026-08-01</time>
                        </h4>
                        <ul>
                            <li>Chip details and annotation lists now load in parallel when switching chips.</li>
                            <li>Annotation contents preload with the list, then safely revalidate on selection.</li>
                            <li>Comment pages keep their state in the URL hash and render login state and titles immediately.</li>
                            <li>The RSS shortcut now points to the daily update feed.</li>
                            <li>Production API configuration is now tracked for reliable CI and GitHub Pages builds.</li>
                        </ul>
                    </section>
                    <section class="changelogRelease">
                        <h4>
                            <span>3.1.0</span>
                            <time datetime="2026-08-01">2026-08-01</time>
                        </h4>
                        <ul>
                            <li>Refined the chip and annotation selector controls.</li>
                            <li>Improved cross-origin login token handling.</li>
                            <li>The quick chip list now shows all chips, filters as you type, and opens chips with one click.</li>
                            <li>Legacy comment links now resolve through the current comment endpoint.</li>
                            <li>Added Recent Updates backed by the server feed.</li>
                            <li>Fixed advanced-browser overflow.</li>
                            <li>Added GitHub Pages deployment and the MIT license.</li>
                        </ul>
                    </section>
                    <section class="changelogRelease">
                        <h4>
                            <span>3.0.0</span>
                            <time datetime="2026-07-09">2026-07-09</time>
                        </h4>
                        <ul>
                            <li>Migrated annotations and authentication to the new server API.</li>
                            <li>Introduced a responsive editor workspace with read-only navigation and an advanced chip browser.</li>
                            <li>Added modal-based annotation creation, upgraded editing actions, and unsaved-change protection.</li>
                            <li>Added multiline text editing, foldable color controls, editable hex colors, and packed RGBA storage.</li>
                            <li>Versioned the annotation JSON format for future data upgrades.</li>
                            <li>Added annotation undo and redo history.</li>
                            <li>Added global chip information, image credits, tile caching, and seamless image tiles.</li>
                            <li>Added chip and annotation comments, including an embedded panel and real-time updates.</li>
                            <li>Added clearer network feedback, editor hints, and a controls guide.</li>
                        </ul>
                    </section>
                </div>
            `,
            onSubmit: () => true,
        });
    }

    private onTitleInput(event: Event) {
        if (this.onAnnotationChanged) this.onAnnotationChanged((event.target as HTMLInputElement).value);
    }

    render() {
        let title = '';
        if (this.annotation) title = this.titleValue !== undefined && this.titleValue !== null ? this.titleValue : (this.annotation.title || '');

        const projectLinks = html`
            <div class="userMenuLinks" aria-label="Project links">
                <a href="https://github.com/misdake/ChipAnnotationViewer" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub"><img src="res/github.png" alt=""></a>
                <a href="https://twitter.com/rSkip" target="_blank" rel="noopener" title="Twitter" aria-label="Twitter"><img src="res/twitter.png" alt=""></a>
                <a href="https://rgbuv.xyz/chipannotation3/rss/daily.xml" target="_blank" rel="noopener" title="RSS" aria-label="RSS"><img src="res/rss.png" alt=""></a>
            </div>`;
        const loginControl = html`
            <div class="userMenu">
                <div class="userMenuRow">
                    ${this.userId > 0 ? html`` : html`
                        <button id="userLoginButton" type="button" @click="${this.onClickLogin}">Login</button>`}
                    <button class="userMenuToggle" @click="${this.toggleUserMenu}" aria-label="User menu" aria-expanded=${this.menuOpen}>
                        ${this.userId > 0 ? html`<span class="userMenuName">${this.userName}</span>` : html``}
                        <span class="userMenuArrow" aria-hidden="true">▾</span>
                    </button>
                </div>
                <div class="userMenuDropdown" ?hidden=${!this.menuOpen}>
                    ${this.userId > 0 ? html`<button id="userLogoutInline" type="button" @click="${this.onClickLogout}">Logout</button>` : html``}
                    <button id="shareViewButton" type="button" @click=${() => this.openShareModal()}>Share</button>
                    <button id="hintToggle" type="button" aria-describedby="hint" aria-expanded="false" @click=${this.toggleControlsHint}>Controls</button>
                    <button id="changelogButton" type="button" @click=${() => this.openChangelogModal()}>Changelog</button>
                    ${projectLinks}
                </div>
            </div>`;
        const canDelete = this.editMode === 'update'
            && this.annotation
            && this.annotation.aid > 0
            && this.annotation.userId === this.userId;
        const buttonLine = this.editMode !== 'none'
            ? html`
                <button id="buttonSaveAnnotation" class="topBarIconButton saveAnnotationButton" ?disabled="${!this.dirty}" @click="${() => this.uploadAnnotation()}" title="Save Annotation (Ctrl+S)" aria-label="Save Annotation">${saveIcon}</button>
                ${canDelete
                    ? html`<button class="topBarIconButton deleteAnnotationButton" @click="${() => this.openDeleteAnnotationModal()}" title="Delete Annotation" aria-label="Delete Annotation">${deleteIcon}</button>`
                    : html``}
            `
            : html``;
        const titleRow = this.editMode !== 'none'
            ? html`
                <label class="selector-field annotationTitleField">
                    <span class="selector-field-label ui-section-label">Title</span>
                    <span class="selector-control">
                        <input id="inputTitle" type="text" value="${title}" @input="${(event: Event) => this.onTitleInput(event)}">
                        ${buttonLine}
                    </span>
                </label>
            `
            : html``;

        return html`
            ${titleRow}
            <div class="loginInput">
                <div id="loginMenu" class="loginControl">${loginControl}</div>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

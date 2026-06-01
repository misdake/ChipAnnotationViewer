import { customElement, html, LitElement, property } from 'lit-element';
import { Annotation } from '../data/Annotation';
import { ChipContent } from '../data/Chip';
import { Canvas } from '../Canvas';
import { ClientApi } from '../data/ClientApi';


@customElement('title-element')
export class TitleElement extends LitElement {

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
        const buttonLine = this.editMode !== 'none'
            ? html`<button class="configButton" @click="${this.uploadAnnotation}">${this.editMode === "update" ? "Update" : "Create New"} Annotation</button>`
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

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
    userName: string;
    @property()
    menuOpen: boolean = false;

    userId: number;

    private canUpdateCurrentAnnotation(): boolean {
        return !!this.annotation
            && this.annotation.aid > 0
            && this.userId > 0
            && this.annotation.userId === this.userId;
    }

    private canCreateCurrentAnnotation(): boolean {
        return !!this.annotation
            && this.annotation.aid === 0
            && this.userId > 0;
    }

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

        let dataString = this.getData();

        if (this.canCreateCurrentAnnotation()) {
            ClientApi.createAnnotation(this.chipContent.name, this.annotation.title, dataString).then(r => {
                Object.assign(this.annotation, r);
                this.toast('Created');
                this.notifyAnnotationCreated(r.aid);
                //TODO refresh annotationlist and replace url
                //TODO via global event bus?

            }).catch(e => {
                console.log('createAnnotation error:', e);
            });
        } else if (this.canUpdateCurrentAnnotation()) {
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
        const canUpdate = this.canUpdateCurrentAnnotation();
        const canCreate = this.canCreateCurrentAnnotation();
        const buttonLine = (canUpdate || canCreate)
            ? html`<button class="configButton" @click="${this.uploadAnnotation}">${canUpdate ? "Update" : "Create New"} Annotation</button>`
            : html``;

        return html`
            <div class="titleInput loginInput">
                <label for="loginMenu">Login:</label>
                <div id="loginMenu" class="loginControl">${loginControl}</div>
            </div>
            <div class="titleInput">
                <label for="dataTitle">Title:</label>
                <input id="inputTitle" type="text" class="configText" value="${title}">
            </div>
            ${buttonLine}
        `;
    }

    createRenderRoot() {
        return this;
    }

}

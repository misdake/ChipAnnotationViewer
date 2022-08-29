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

    userId: number;

    private getLogin() {
        ClientApi.getCurrentLogin().then(({userName, userId}) => {
            this.userName = userName;
            this.userId = userId;
        });
    }

    protected firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
        super.firstUpdated(_changedProperties);

        this.getLogin();

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

        let dataString = this.getData();

        if (this.annotation.aid === 0) {
            ClientApi.createAnnotation(this.chipContent.name, this.annotation.title, dataString).then(r => {
                Object.assign(this.annotation, r);
                alert('created!');
                //TODO refresh annotationlist and replace url
                //TODO via global event bus?

            }).catch(e => {
                console.log('createAnnotation error:', e);
            });
        } else {
            ClientApi.updateAnnotation(this.annotation.aid, this.annotation.title, dataString).then(r => {
                Object.assign(this.annotation, r);
                alert('updated!');
            }).catch(e => {
                console.log('updateAnnotation error:', e);
            });
        }
    }

    private onClickLogin() {
        ClientApi.openLoginTab();
    }

    render() {
        let title = '';
        if (this.annotation) {
            title = this.annotation.title || '';
        }

        let helloLine = this.userId > 0 ? html`Hello ${this.userName}` : html`
            <button @click="${this.onClickLogin}">Login</button>`; //TODO 'login via githubt' button

        let auth = this.userId > 0 && (this.annotation.aid === 0 || this.annotation.userId == this.userId);
        let buttonText = `${this.annotation && this.annotation.aid ? 'update' : 'create new'} annotation`;
        let uploadLine = auth ? html`
            <button class="configButton" @click="${this.uploadAnnotation}">${buttonText}</button>` : html``;

        return html`
            <label for="dataTitle">title</label>
            <input id="inputTitle" class="configText" value="${title}" style="width:10em">
            <br>
            ${helloLine}
            <br>
            ${uploadLine}
        `;
    }

    createRenderRoot() {
        return this;
    }

}

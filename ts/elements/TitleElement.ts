import { customElement, html, LitElement, property } from 'lit-element';
import { Annotation } from '../data/Annotation';
import { ChipContent } from '../data/Chip';
import { Canvas } from '../Canvas';
import { AnnotationApi } from '../data/AnnotationApi';

@customElement('title-element')
export class TitleElement extends LitElement {

    @property()
    chipContent: ChipContent;
    @property()
    annotation: Annotation;
    @property()
    canvas: Canvas;

    private uploadAnnotation() {
        if (!this.chipContent || !this.annotation) return;

        let data = this.canvas.save();
        this.annotation.title = (document.getElementById('inputTitle') as HTMLInputElement).value;
        if (!this.annotation.title) this.annotation.title = 'untitled';
        let dataString = JSON.stringify(data);

        if (this.annotation.aid === 0) {
            AnnotationApi.createAnnotation(this.chipContent.name, this.annotation.title, dataString).then(r => {
                Object.assign(this.annotation, r);
                alert('created!');
            }).catch(e => {
                console.log('createAnnotation error:', e);
            });
        } else {
            AnnotationApi.updateAnnotation(this.annotation.aid, this.annotation.title, dataString).then(r => {
                Object.assign(this.annotation, r);
                alert('updated!');
            }).catch(e => {
                console.log('updateAnnotation error:', e);
            });
        }
    }

    render() {
        let title = '';
        if (this.annotation) {
            title = this.annotation.title || '';
        }

        return html`
            <label for="dataTitle">title</label>
            <input id="inputTitle" class="configText" value="${title}" style="width:10em">
            <br>
            <button class="configButton" @click="${this.uploadAnnotation}">${this.annotation && this.annotation.aid ? 'update' : 'create new'} annotation</button>
            <a href="https://github.com/misdake/ChipAnnotationViewer/blob/master/guide/contribute.md" target="_blank"><-how?</a>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

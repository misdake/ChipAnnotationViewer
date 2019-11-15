import {customElement, html, LitElement, property} from "lit-element";
import {Annotation} from "../data/Data";
import {Map} from "../data/Map";
import {Canvas} from "../Canvas";
import {Github} from "../util/GithubUtil";

@customElement('title-element')
export class TitleElement extends LitElement {

    @property()
    map: Map;
    @property()
    annotation: Annotation;
    @property()
    canvas: Canvas;

    private uploadAnnotation() {
        if (!this.map || !this.annotation) return;

        //TODO layerTextEdit.finishEditing();
        //TODO layerPolylineEdit.finishEditing();
        let data = this.canvas.save();
        data.title = (document.getElementById("inputTitle") as HTMLInputElement).value;
        if (data.title == null || data.title == "") {
            data.title = "untitled";
        }
        let issueLink: string;
        if (this.annotation.id > 0) {
            issueLink = Github.getCommentLink(this.map.githubRepo, this.map.githubIssueId, this.annotation.id);
        } else {
            issueLink = Github.getIssueLink(this.map.githubRepo, this.map.githubIssueId);
        }
        let dataString = JSON.stringify(data);
        navigator.clipboard.writeText(dataString).then(() => {
            if (issueLink) {
                window.open(issueLink, '_blank');
            }
        });
    }

    render() {
        let title = "";
        if (this.annotation && this.annotation.content) {
            title = this.annotation.content.title || "";
        }

        return html`
            <label for="dataTitle">title</label>
            <input id="inputTitle" class="configText" value="${title}" style="width:10em">
            <br>
            <button class="configButton" @click="${this.uploadAnnotation}">upload annotation</button>
            <a href="https://github.com/misdake/ChipAnnotationViewer/blob/master/guide/contribute.md" target="_blank"><-how?</a>
        `;
    }

    createRenderRoot() {
        return this;
    }

}
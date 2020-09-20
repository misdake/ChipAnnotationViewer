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

        let data = this.canvas.save();
        data.title = (document.getElementById("inputTitle") as HTMLInputElement).value;
        if (data.title == null || data.title == "") {
            data.title = "untitled";
        }
        let dataString = JSON.stringify(data);

        let auth = Github.getAuth();

        if (auth) {
            this.uploadAnnotation_githubapi(dataString);
        } else {
            this.uploadAnnotation_clipboard(dataString);
        }
    }

    private uploadAnnotation_githubapi(dataString: string) {
        if (this.annotation.id > 0) {
            Github.updateComment(this.map.githubRepo, this.map.githubIssueId, this.annotation.id, dataString, comment => {
                console.log("comment", comment);
                alert("uploaded!");
            });
        } else {
            Github.createComment(this.map.githubRepo, this.map.githubIssueId, dataString, comment => {
                console.log("comment", comment);
                alert("uploaded!");
            });
        }
    }

    private uploadAnnotation_clipboard(dataString: string) {
        let issueLink: string;
        if (this.annotation.id > 0) {
            issueLink = Github.getCommentLink(this.map.githubRepo, this.map.githubIssueId, this.annotation.id);
        } else {
            issueLink = Github.getIssueLink(this.map.githubRepo, this.map.githubIssueId);
        }
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
            <button class="configButton" @click="${this.uploadAnnotation}">${this.annotation&&this.annotation.id ? "update" : "create new"} annotation</button>
            <a href="https://github.com/misdake/ChipAnnotationViewer/blob/master/guide/contribute.md" target="_blank"><-how?</a>
        `;
    }

    createRenderRoot() {
        return this;
    }

}
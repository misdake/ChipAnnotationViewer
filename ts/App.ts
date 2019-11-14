import {Canvas} from "./Canvas";
import {NetUtil} from "./util/NetUtil";
import {Chip, Map} from "./data/Map";
import {LayerImage} from "./layers/LayerImage";
import {LayerPolylineView} from "./layers/LayerPolylineView";
import {LayerPolylineEdit} from "./layers/LayerPolylineEdit";
import {Data} from "./data/Data";
import {Ui} from "./util/Ui";
import {LayerTextEdit} from "./layers/LayerTextEdit";
import {LayerTextView} from "./layers/LayerTextView";
import {Github, GithubComment} from "./util/GithubUtil";
import {LayerPolylineCreate} from "./layers/LayerPolylineCreate";
import {LayerTextCreate} from "./layers/LayerTextCreate";
import {html, render} from "lit-html";
import "elements/SelectElement"

if (Ui.isMobile()) {
    document.getElementById("panel").style.display = "none";
} else {
    document.getElementById("panel").style.display = "flex";
}

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

let layerImage = new LayerImage(canvas);
let layerPolylineView = new LayerPolylineView(canvas);
let layerPolylineCreate = new LayerPolylineCreate(canvas);
let layerPolylineEdit = new LayerPolylineEdit(canvas);
let layerTextView = new LayerTextView(canvas);
let layerTextCreate = new LayerTextCreate(canvas);
let layerTextEdit = new LayerTextEdit(canvas);

canvas.addLayer(layerImage);
canvas.addLayer(layerPolylineView);
canvas.addLayer(layerPolylineEdit);
canvas.addLayer(layerPolylineCreate);
canvas.addLayer(layerTextView);
canvas.addLayer(layerTextEdit);
canvas.addLayer(layerTextCreate);

Ui.bindButtonOnClick("buttonNewPolyline", () => {
    layerTextEdit.finishEditing();
    layerPolylineCreate.createPolylineAndEdit();
});
Ui.bindButtonOnClick("polylineButtonDelete", () => {
    layerPolylineEdit.deleteEditing();
    layerPolylineCreate.deleteCreating();
    layerTextEdit.finishEditing();
    layerPolylineEdit.finishEditing();
});
Ui.bindButtonOnClick("buttonNewText", () => {
    layerPolylineEdit.finishEditing();
    layerTextCreate.createTextAndEdit()
});
Ui.bindButtonOnClick("textButtonDelete", () => {
    layerPolylineEdit.finishEditing();
    layerTextCreate.deleteCreating();
    layerTextCreate.finishCreating();
    layerTextEdit.deleteEditing();
    layerTextEdit.finishEditing();
});

class App {
    currentChip: Chip = null;
    issueLink = "";
    currentCommentId: number = 0;
    dummyData: Data = null;

    public start() {
        render(html`<select-element .onSelectChip=${(chip: Chip) =>this.loadMap(chip)}></select-element>`, document.getElementById("selectPanel"));

        // NetUtil.get("https://misdake.github.io/ChipAnnotationData/list.json", text => {
        //     let chips = JSON.parse(text) as Chip[];
        //
        //     let name_chip: { [key: string]: Chip } = {};
        //
        //     let selections: string[] = [];
        //     let selection_chip: Chip[] = [];
        //
        //     let sortMap: { [key: string]: Chip } = {};
        //     let sortKeys: string[] = [];
        //
        //     if (chips && chips.length) {
        //         for (let chip of chips) {
        //             let id = `${chip.vendor} ${chip.type} ${chip.family} ${chip.name}`;
        //             sortKeys.push(id);
        //             sortMap[id] = chip;
        //
        //             name_chip[chip.name] = chip;
        //         }
        //     }
        //
        //     sortKeys.sort();
        //     let last_VenderType = "";
        //     let last_Family = "";
        //     for (let key of sortKeys) {
        //         let chip = sortMap[key];
        //         let curr_VenderType = `${chip.vendor} ${chip.type}`;
        //         let curr_Family = `${chip.family}`;
        //
        //         if (last_VenderType !== curr_VenderType && curr_VenderType && curr_VenderType.length) {
        //             selections.push(curr_VenderType);
        //             selection_chip.push(null);
        //         }
        //         if (last_Family !== curr_Family && curr_Family && curr_Family.length) {
        //             selections.push("\xA0\xA0\xA0\xA0" + curr_Family);
        //             selection_chip.push(null);
        //         }
        //         selections.push("\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0" + chip.name);
        //         selection_chip.push(chip);
        //
        //         last_VenderType = curr_VenderType;
        //         last_Family = curr_Family;
        //     }
        //
        //     let url_string = window.location.href;
        //     let url = new URL(url_string);
        //     let mapName = url.searchParams.get("map") || "Fiji";
        //     let commentIdString = url.searchParams.get("commentId") || "0";
        //     this.currentCommentId = parseInt(commentIdString);
        //
        //     Ui.bindSelect("mapSelect", selections, "\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0" + mapName, (index, newMap) => {
        //         this.currentCommentId = 0;
        //         let chip = selection_chip[index];
        //         if (chip) {
        //             this.loadMap(chip);
        //             this.replaceUrl();
        //         }
        //     });

        // this.loadMap(name_chip[mapName]);

        // });


    }

    loadMap(chip: Chip) {
        this.currentChip = chip;

        NetUtil.get(chip.url + "/content.json", mapDesc => {
            let map: Map = JSON.parse(mapDesc) as Map;
            canvas.loadMap(map);
            canvas.requestRender();

            this.issueLink = Github.getIssueLink(map.githubRepo, map.githubIssueId);

            Ui.bindButtonOnClick("buttonSave", () => {
                layerTextEdit.finishEditing();
                layerPolylineEdit.finishEditing();

                let data = canvas.save();
                data.title = (document.getElementById("dataTitle") as HTMLInputElement).value;
                if (data.title == null || data.title == "") {
                    data.title = "untitled";
                }

                let dataString = JSON.stringify(data);
                navigator.clipboard.writeText(dataString).then(() => {
                    if (this.issueLink) {
                        window.open(this.issueLink, '_blank');
                    }
                });
            });
            Ui.bindValue("dataTitle", "", newValue => {
            });

            this.dummyData = new Data();
            this.dummyData.title = "";
            canvas.loadData(this.dummyData);

            this.loadGithubComment(map, this.currentCommentId);

            Ui.bindButtonOnClick("buttonRefreshData", () => {
                this.loadGithubComment(map, this.currentCommentId);
            });
        });
    }

    loadGithubComment(map: Map, commentId: number) {
        if (map.githubRepo && map.githubIssueId) {
            Github.getComments(map.githubRepo, map.githubIssueId, comments => {
                let list: GithubComment[] = [];
                let entries: Data[] = [];
                let items: string[] = [];

                list.push(null);
                entries.push(this.dummyData);
                items.push("dummy");

                let startIndex = 0;
                let startData = this.dummyData;
                let startCommentId = 0;

                for (let comment of comments) {
                    try {
                        let data: Data = JSON.parse(comment.body);
                        if (data.polylines != null && data.texts != null) {
                            if (data.title == null || data.title == "") {
                                data.title = "untitled";
                            }
                            list.push(comment);
                            entries.push(data);
                            items.push(`${data.title} @${comment.user.login}`);
                            if (commentId == comment.id) {
                                startIndex = list.length - 1;
                                startData = data;
                                startCommentId = comment.id;
                            }
                        }
                    } catch (e) {
                    }
                }

                items[0] = `(annotation count: ${items.length - 1})`;

                Ui.bindSelect("dataSelect", items, items[startIndex], index => {
                    let comment = list[index];
                    let data = entries[index];
                    this.loadData(map, data, comment ? comment.id : 0);
                });

                this.loadData(map, startData, startCommentId);
            });
        }
    }

    loadData(map: Map, data: Data, commentId: number) {
        Ui.bindValue("dataTitle", data.title, newValue => {
        });

        this.currentCommentId = commentId;

        if (commentId > 0) {
            this.issueLink = Github.getCommentLink(map.githubRepo, map.githubIssueId, commentId);
        } else {
            this.issueLink = Github.getIssueLink(map.githubRepo, map.githubIssueId);
        }

        canvas.loadData(data);
        this.replaceUrl();
        canvas.requestRender();
    }

    replaceUrl() {
        let url = location.pathname + '?map=' + this.currentChip.name;
        if (this.currentCommentId > 0) url += '&commentId=' + this.currentCommentId;
        history.replaceState(null, "", url);
    }
}

new App().start();

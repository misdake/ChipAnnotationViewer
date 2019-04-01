import {Canvas} from "./Canvas";
import {NetUtil} from "./util/NetUtil";
import {Map} from "./data/Map";
import {LayerImage} from "./layers/LayerImage";
import {LayerPolylineView} from "./layers/LayerPolylineView";
import {LayerPolylineEdit} from "./layers/LayerPolylineEdit";
import {Data} from "./data/Data";
import {Ui} from "./util/Ui";
import {LayerTextEdit} from "./layers/LayerTextEdit";
import {LayerTextView} from "./layers/LayerTextView";
import {Github, GithubComment} from "./util/GithubUtil";

let canvas = new Canvas(document.getElementById("container"), 'canvas2d');
canvas.init();

let layerImage = new LayerImage(canvas);
let layerPolylineView = new LayerPolylineView(canvas);
let layerPolylineEdit = new LayerPolylineEdit(canvas);
let layerTextView = new LayerTextView(canvas);
let layerTextEdit = new LayerTextEdit(canvas);

canvas.addLayer(layerImage);
canvas.addLayer(layerPolylineView);
canvas.addLayer(layerPolylineEdit);
canvas.addLayer(layerTextView);
canvas.addLayer(layerTextEdit);

Ui.bindButtonOnClick("buttonNewPolyline", () => {
    layerTextEdit.finishEditing();
    layerPolylineEdit.startCreatingPolyline();
});
Ui.bindButtonOnClick("polylineButtonDelete", () => {
    layerPolylineEdit.deleteEditing();
    layerPolylineEdit.deleteCreating();
    layerTextEdit.finishEditing();
    layerPolylineEdit.finishEditing();
});
Ui.bindButtonOnClick("buttonNewText", () => {
    layerPolylineEdit.finishEditing();
    layerTextEdit.startCreatingText()
});
Ui.bindButtonOnClick("textButtonDelete", () => {
    layerPolylineEdit.finishEditing();
    layerTextEdit.deleteEditing();
    layerTextEdit.finishEditing();
});

class App {
    currentMapName: string = null;
    issueLink = "";
    currentCommentId: number = 0;
    dummyData: Data = null;

    public start() {
        NetUtil.get("https://misdake.github.io/ChipAnnotationData/list.txt", text => {

            let defaultMap: string = null;
            let lines: string[] = [];
            let maps: { [key: string]: string } = {};
            let names: string[] = [];

            if (text && text.length) {
                lines = text.split("\n").filter(value => value.length > 0).map(value => value.trim());
                for (let line of lines) {
                    let name = line.substring(line.lastIndexOf('/') + 1);
                    names.push(name);
                    maps[name] = line;
                }
                if (lines.length > 0) {
                    defaultMap = names[0];
                }
            }

            if (!defaultMap) defaultMap = "Fiji";

            let url_string = window.location.href;
            let url = new URL(url_string);
            let mapName = url.searchParams.get("map") || defaultMap;
            let commentIdString = url.searchParams.get("commentId") || "0";
            this.currentCommentId = parseInt(commentIdString);

            Ui.bindSelect("mapSelect", names, mapName, (index, newMap) => {
                this.currentCommentId = 0;
                this.loadMap(newMap, maps[newMap]);
                this.replaceUrl();
            });

            this.loadMap(mapName, maps[mapName]);

        });
    }

    loadMap(mapName: string, mapString: string) {
        this.currentMapName = mapName;

        NetUtil.get(mapString + "/content.json", mapDesc => {
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
                Ui.bindValue("dataOutput", dataString, newValue => {
                });
                Ui.copyToClipboard("dataOutput");
                Ui.bindValue("dataOutput", "", newValue => {
                });

                if (this.issueLink) {
                    window.open(this.issueLink, '_blank');
                }
            });

            Ui.bindValue("dataOutput", "", newValue => {
            });
            Ui.bindValue("dataTitle", "", newValue => {
            });
            Ui.bindSelect("dataSelect", [], null, index => {
            });

            this.dummyData = new Data();
            this.dummyData.title = "";
            canvas.loadData(this.dummyData);

            Ui.bindValue("dataOutput", "", newValue => {
            });

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
                items.push("(empty)");

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
                            items.push(data.title + " @" + comment.user.login);
                            if (commentId == comment.id) {
                                startIndex = list.length - 1;
                                startData = data;
                                startCommentId = comment.id;
                            }
                        }
                    } catch (e) {
                    }
                }

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

        Ui.bindValue("dataOutput", "", newValue => {
        });

        canvas.loadData(data);
        this.replaceUrl();
        canvas.requestRender();
    }

    replaceUrl() {
        let url = location.pathname + '?map=' + this.currentMapName;
        if (this.currentCommentId > 0) url += '&commentId=' + this.currentCommentId;
        history.replaceState(null, "", url);
    }
}

new App().start();

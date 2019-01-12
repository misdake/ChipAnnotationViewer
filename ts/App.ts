import {Canvas} from "./Canvas";
import {NetUtil} from "./util/NetUtil";
import {Map} from "./data/Map";
import {LayerImage} from "./layers/LayerImage";
import {LayerPolylineView} from "./layers/LayerPolylineView";
import {LayerPolylineEdit} from "./layers/LayerPolylineEdit";
import {Data} from "./data/Data";
import {Ui} from "./util/Ui";
import {LZString} from "./util/LZString";
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

let currentMapString: string = null;
let issueLink = "";

function loadDataString(mapString: string, dataString: string) {
    let decompressed = dataString ? LZString.decompressFromEncodedURIComponent(dataString) : null;
    let data: Data = decompressed ? JSON.parse(decompressed) as Data : new Data;
    loadData(mapString, data);
}
function loadData(mapString: string, data: Data) {
    currentMapString = mapString;

    NetUtil.get("data/" + mapString + "/content.json", mapDesc => {
        let map: Map = JSON.parse(mapDesc) as Map;
        canvas.load(map, data, "data/" + mapString);
        canvas.requestRender();

        issueLink = Github.getIssueLink(map.githubRepo, map.githubIssueId);

        Ui.bindButtonOnClick("buttonSave", () => {
            let data = canvas.save();
            data.title = (document.getElementById("dataTitle") as HTMLInputElement).value;
            let dataString = JSON.stringify(data);
            Ui.bindValue("dataOutput", dataString, newValue => {
            });
            Ui.copyToClipboard("dataOutput");

            if (issueLink) {
                window.open(issueLink, '_blank');
            }
        });

        Ui.bindValue("dataOutput", "", newValue => {
        });
        Ui.bindValue("dataTitle", data.title || "", newValue => {
        });
        Ui.bindSelect("dataSelect", [], null, index => {
        });

        if (map.githubRepo && map.githubIssueId) {
            Github.getComments(map.githubRepo, map.githubIssueId, comments => {
                let list: GithubComment[] = [];
                let entries: Data[] = [];
                let items: string[] = [];

                list.push(null);
                entries.push(data);
                items.push("current");

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
                        }
                    } catch (e) {
                    }
                }

                if (entries.length > 1) {
                    if (currentMapString == mapString) {
                        Ui.bindSelect("dataSelect", items, items[0], index => {
                            let comment = list[index];
                            let data = entries[index];
                            Ui.bindValue("dataTitle", data.title, newValue => {
                            });

                            if (comment) {
                                issueLink = Github.getCommentLink(map.githubRepo, map.githubIssueId, comment.id);
                            } else {
                                issueLink = Github.getIssueLink(map.githubRepo, map.githubIssueId);
                            }

                            canvas.load(map, data, "data/" + mapString);
                            canvas.requestRender();
                        });
                    }
                }
            });
        }
    });

}

NetUtil.get("data/list.txt", text => {

    let defaultMap: string = null;
    let lines: string[] = [];

    if (text && text.length) {
        lines = text.split("\n").filter(value => value.length > 0).map(value => value.trim());
        if (lines.length > 0) {
            defaultMap = lines[0];
        }
    }

    if (!defaultMap) defaultMap = "Fiji";

    let url_string = window.location.href;
    let url = new URL(url_string);
    let mapString = url.searchParams.get("map") || defaultMap;
    let dataString = url.searchParams.get("data");

    Ui.bindSelect("mapSelect", lines, mapString, (index, newMap) => {
        loadDataString(newMap, null);
    });

    loadDataString(mapString, dataString);

});

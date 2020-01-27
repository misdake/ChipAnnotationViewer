import {Canvas} from "./Canvas";
import {Camera} from "./Camera";
import {Map} from "./data/Map";
import {Data} from "./data/Data";
import {DrawablePolyline} from "./editable/DrawablePolyline";
import {DrawableText} from "./editable/DrawableText";

export class Env {

    //after load

    canvas: Canvas;
    camera: Camera;

    loadCanvas(canvas: Canvas) {
        this.canvas = canvas;
        this.camera = canvas.getCamera();
    }

    //after selected map

    map: Map;
    data: Data;
    polylines: DrawablePolyline[];
    texts: DrawableText[];

    loadMap(map: Map) {
        this.map = map;
    }

    loadData(data: Data) {
        this.data = data;

        this.polylines = [];
        this.texts = [];

        if (data.polylines) {
            for (let pack of data.polylines) {
                this.polylines.push(new DrawablePolyline(pack))
            }
        }
        if (data.texts) {
            for (let pack of data.texts) {
                this.texts.push(new DrawableText(pack))
            }
        }

    }

}
import {Canvas} from "./Canvas";
import {Camera} from "./Camera";
import {Map} from "./data/Map";
import {Annotation, Data} from "./data/Data";
import {DrawablePolyline} from "./editable/DrawablePolyline";
import {DrawableText} from "./editable/DrawableText";

export class Env {
    canvas: Canvas;
    camera: Camera;

    map: Map;
    annotation: Annotation;

    polylines: DrawablePolyline[];
    texts: DrawableText[];


    loadMap() {

    }
    loadAnnotation() {

    }

}
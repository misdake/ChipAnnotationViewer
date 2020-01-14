import {Canvas} from "./Canvas";
import {Camera} from "./Camera";
import {Map} from "./data/Map";
import {Data} from "./data/Data";

export class Env {
    canvas: Canvas;
    camera: Camera;

    map: Map;
    data: Data;
}
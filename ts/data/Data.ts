import {DrawablePolylinePack} from "../drawable/DrawablePolyline";
import {DrawableTextPack} from "../drawable/DrawableText";

export class Annotation {
    id: number;
    user: string;
    content: Data;
}

export class Data {
    title: string;
    polylines: DrawablePolylinePack[];
    texts: DrawableTextPack[];
}
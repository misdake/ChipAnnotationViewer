import {DrawablePolylinePack} from "../editable/DrawablePolyline";
import {DrawableTextPack} from "../editable/DrawableText";

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
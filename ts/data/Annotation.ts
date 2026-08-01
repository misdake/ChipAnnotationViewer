import { DrawablePolylinePack } from '../editable/DrawablePolyline';
import { DrawableTextPack } from '../editable/DrawableText';

export const ANNOTATION_DATA_VERSION = 2;

export class Annotation {
    aid: number; //key
    title: string;

    //relation
    chipName: string;
    userId: number; //GitHub userId
    userName: string; //GitHub userName (display only)

    createTime: number;
    updateTime: number;

    //listchip may include the full content inline; selection then needs no extra request
    version?: number;
    content?: string;
}

export class AnnotationContent {
    aid: number;
    version: number; //Server-side content format version.

    content: string;
}

export class AnnotationData {
    version: number = ANNOTATION_DATA_VERSION;
    polylines: DrawablePolylinePack[];
    texts: DrawableTextPack[];

    static dummy(): AnnotationData {
        let r = new AnnotationData();
        r.polylines = [];
        r.texts = [];
        return r;
    }
}

import { DrawablePolylinePack } from '../editable/DrawablePolyline';
import { DrawableTextPack } from '../editable/DrawableText';

export class Annotation {
    aid: number; //key
    title: string;

    //relation
    chipName: string;
    userId: number; //GitHub userId
    userName: string; //GitHub userName (display only)

    createTime: number;
    updateTime: number;
}

export class AnnotationContent {
    aid: number;
    version: number; //v1 => version === 1

    content: string;
}

export class AnnotationData {
    polylines: DrawablePolylinePack[];
    texts: DrawableTextPack[];

    static dummy(): AnnotationData {
        let r = new AnnotationData();
        r.polylines = [];
        r.texts = [];
        return r;
    }
}

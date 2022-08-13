import { NetUtil } from '../util/NetUtil';
import { Annotation, AnnotationContent } from './Annotation';

let API_SERVER = 'http://localhost:8081';
const ANNOTATION_CONTENT_VERSION = 1;

export class AnnotationApi {

    static listAnnotationByChip(chipName: string): Promise<Annotation[]> {
        return new Promise((resolve, reject) => {
            NetUtil.get(`${API_SERVER}/annotation/listchip/${chipName}`, json => {
                try {
                    let array = JSON.parse(json) as Annotation[];
                    resolve(array);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
    static listAnnotationByUserId(userId: number): Promise<Annotation[]> {
        return new Promise((resolve, reject) => {
            NetUtil.get(`${API_SERVER}/annotation/listuser/${userId}`, json => {
                try {
                    let array = JSON.parse(json) as Annotation[];
                    resolve(array);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
    static listAnnotationByUpdateTime(): Promise<Annotation[]> {
        return new Promise((resolve, reject) => {
            NetUtil.get(`${API_SERVER}/annotation/listrecent`, json => {
                try {
                    let array = JSON.parse(json) as Annotation[];
                    resolve(array);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    static getAnnotationContent(aid: number): Promise<AnnotationContent> {
        return new Promise((resolve, reject) => {
            NetUtil.get(`${API_SERVER}/annotation/get/${aid}`, json => {
                try {
                    let result = JSON.parse(json) as AnnotationContent;
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    static createAnnotation(chipName: string, title: string, content: string): Promise<Annotation> {
        return new Promise((resolve, reject) => {
            NetUtil.post(`${API_SERVER}/annotation/create/${chipName}`, {title, content, version: ANNOTATION_CONTENT_VERSION}, json => {
                try {
                    let result = JSON.parse(json) as Annotation;
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
    static updateAnnotation(aid: number, title: string, content: string): Promise<Annotation> {
        return new Promise((resolve, reject) => {
            NetUtil.post(`${API_SERVER}/annotation/update/${aid}`, {title, content, version: ANNOTATION_CONTENT_VERSION}, json => {
                try {
                    let result = JSON.parse(json) as Annotation;
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
    static deleteComment(aid: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            NetUtil.get(`${API_SERVER}/annotation/delete/${aid}`, json => {
                try {
                    let result = JSON.parse(json) as boolean;
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}

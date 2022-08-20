import { NetUtil } from '../util/NetUtil';
import { Annotation, AnnotationContent } from './Annotation';

const API_SERVER = 'http://localhost:8082';
const ANNOTATION_CONTENT_VERSION = 1;

type UserInfo = { userName: string, userId: number };

function getToken() {
    let token = localStorage.getItem('chipannotation-token');
    return token && token !== 'undefined' ? token : null;
}

export class ClientApi {
    private static get<T>(url: string): Promise<T> {
        return new Promise((resolve, reject) => {
            NetUtil.get(url, json => {
                try {
                    let array = JSON.parse(json) as T;
                    resolve(array);
                } catch (e) {
                    reject(e);
                }
            }, getToken());
        });
    }
    private static post<B, T>(url: string, body: B): Promise<T> {
        return new Promise((resolve, reject) => {
            NetUtil.post(url, body, json => {
                try {
                    let result = JSON.parse(json) as T;
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            }, getToken());
        });
    }

    static getLogin(): Promise<UserInfo> {
        return ClientApi.get(`${API_SERVER}/login/get`);
    }

    static listAnnotationByChip(chipName: string): Promise<Annotation[]> {
        return ClientApi.get(`${API_SERVER}/annotation/listchip/${chipName}`);
    }
    static listAnnotationByUserId(userId: number): Promise<Annotation[]> {
        return ClientApi.get(`${API_SERVER}/annotation/listuser/${userId}`);
    }
    static listAnnotationByUpdateTime(): Promise<Annotation[]> {
        return ClientApi.get(`${API_SERVER}/annotation/listrecent`);
    }

    static getAnnotationContent(aid: number): Promise<AnnotationContent> {
        return ClientApi.get(`${API_SERVER}/annotation/get/${aid}`);
    }

    static createAnnotation(chipName: string, title: string, content: string): Promise<Annotation> {
        return ClientApi.post(`${API_SERVER}/annotation/create/${chipName}`, {title, content, version: ANNOTATION_CONTENT_VERSION});
    }
    static updateAnnotation(aid: number, title: string, content: string): Promise<Annotation> {
        return ClientApi.post(`${API_SERVER}/annotation/update/${aid}`, {title, content, version: ANNOTATION_CONTENT_VERSION});
    }
    static deleteComment(aid: number): Promise<boolean> {
        return ClientApi.get(`${API_SERVER}/annotation/delete/${aid}`);
    }
}

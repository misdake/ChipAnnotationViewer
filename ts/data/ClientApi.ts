import { NetUtil } from '../util/NetUtil';
import { ANNOTATION_DATA_VERSION, Annotation, AnnotationContent } from './Annotation';
import { Comment } from './Comment';

declare const __API_SERVER__: string;

const API_SERVER = __API_SERVER__;

type UserInfo = { userName: string, userId: number };

function getToken() {
    let token = localStorage.getItem('chipannotation-token');
    return token && token !== 'undefined' ? token : null;
}

const openedWindows : Window[] = [];

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
            }, getToken(), true, reject);
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
            }, getToken(), true, reject);
        });
    }

    static openLoginTab() {
        let newWindow = window.open(`${API_SERVER}/login/github`, '_blank');
        openedWindows.push(newWindow);
        newWindow.focus();
    }
    static closeAllLoginTabs() {
        for (let w of openedWindows) {
            w.close();
        }
        openedWindows.length = 0;
    }

    static getCurrentLogin(): Promise<UserInfo> {
        return ClientApi.get(`${API_SERVER}/login/get`);
    }
    static logout(): Promise<boolean> {
        return new Promise(resolve => {
            localStorage.removeItem('chipannotation-token');
            let done = false;
            let finish = () => {
                if (done) return;
                done = true;
                resolve(true);
            };
            NetUtil.get(`${API_SERVER}/login/logout`, _ => finish(), null, true);
            setTimeout(() => finish(), 500);
        });
    }

    static listAnnotationByChip(chipName: string): Promise<Annotation[]> {
        return ClientApi.get(`${API_SERVER}/annotation/listchip/${encodeURIComponent(chipName)}`);
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
        return ClientApi.post(`${API_SERVER}/annotation/create/${encodeURIComponent(chipName)}`, {title, content, version: ANNOTATION_DATA_VERSION});
    }
    static updateAnnotation(aid: number, title: string, content: string): Promise<Annotation> {
        return ClientApi.post(`${API_SERVER}/annotation/update/${aid}`, {title, content, version: ANNOTATION_DATA_VERSION});
    }
    static deleteAnnotation(aid: number): Promise<boolean> {
        return ClientApi.get(`${API_SERVER}/annotation/delete/${aid}`);
    }

    static getCommentCount(chipName: string, annotation: number): Promise<number> {
        return ClientApi.get(`${API_SERVER}/comment/count/${encodeURIComponent(chipName)}/${annotation}`);
    }
    static listComments(chipName: string, annotation: number): Promise<Comment[]> {
        return ClientApi.get(`${API_SERVER}/comment/list/${encodeURIComponent(chipName)}/${annotation}`);
    }
    static createComment(chipName: string, annotation: number, content: string): Promise<Comment> {
        return ClientApi.post(`${API_SERVER}/comment/create/${encodeURIComponent(chipName)}/${annotation}`, {content});
    }
    static deleteComment(cid: number): Promise<boolean> {
        return ClientApi.post(`${API_SERVER}/comment/delete/${cid}`, {});
    }
}

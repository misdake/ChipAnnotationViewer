export class NetUtil {
    public static get(url: string, callback?: (text: string) => void, token?: string) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                if (callback) callback(request.responseText);
            }
        };
        request.open('GET', url, true);
        if (token) request.setRequestHeader('token', token);
        request.send();
    }

    public static post(url: string, bodyObject: any, callback?: (text: string) => void, token?: string) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status >= 200 && request.status < 300) {
                if (callback) callback(request.responseText);
            }
        };
        request.open('POST', url, true);
        if (token) request.setRequestHeader('token', token);
        request.setRequestHeader('content-type', 'application/json');
        request.send(JSON.stringify(bodyObject));
    }
}

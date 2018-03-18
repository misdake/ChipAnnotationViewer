export class NetUtil {
    public static get(url: string, callback: (text: string) => void) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                callback(request.responseText);
            }
        };
        request.open("GET", url, true);
        request.send();
    }
}
export class NetUtil {
    private static readonly TIMEOUT_MS = 15000;

    public static get(
        url: string,
        callback?: (text: string) => void,
        token?: string,
        withCredentials: boolean = false,
        onError?: (error: Error) => void,
    ) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        NetUtil.configure(request, callback, onError);
        request.withCredentials = withCredentials;
        if (token) request.setRequestHeader('token', token);
        request.send();
    }

    public static post(
        url: string,
        bodyObject: any,
        callback?: (text: string) => void,
        token?: string,
        withCredentials: boolean = false,
        onError?: (error: Error) => void,
    ) {
        let request = new XMLHttpRequest();
        request.open('POST', url, true);
        NetUtil.configure(request, callback, onError);
        request.withCredentials = withCredentials;
        if (token) request.setRequestHeader('token', token);
        request.setRequestHeader('content-type', 'application/json');
        request.send(JSON.stringify(bodyObject));
    }

    private static configure(
        request: XMLHttpRequest,
        onSuccess?: (text: string) => void,
        onError?: (error: Error) => void,
    ): void {
        request.timeout = NetUtil.TIMEOUT_MS;
        request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
                if (onSuccess) onSuccess(request.responseText);
            } else if (onError) {
                onError(new Error(`Request failed with status ${request.status}`));
            }
        };
        request.onerror = () => {
            if (onError) onError(new Error('Network request failed'));
        };
        request.ontimeout = () => {
            if (onError) onError(new Error('Network request timed out'));
        };
    }
}

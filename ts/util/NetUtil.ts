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

    public static post(url: string, params: { [key: string]: string }, callback: (text: string) => void) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                callback(request.responseText);
            }
        };
        request.open('POST', url, true);
        request.setRequestHeader("Access-Control-Allow-Origin", "*");
        request.setRequestHeader("Access-Control-Allow-Methods", "POST,GET");
        request.setRequestHeader("Content-type","application/x-www-form-urlencoded");

        let s: string = null;
        for (let key in params) {
            if (s == null) {
                s = "";
            } else {
                s = s + "&"
            }
            s += key + "=" + params[key];
        }

        console.log(s);

        request.send(s);

        {
            var httpRequest = new XMLHttpRequest();//第一步：创建需要的对象
            httpRequest.open('POST', 'url', true); //第二步：打开连接
            httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");//设置请求头 注：post方式必须设置请求头（在建立连接后设置请求头）
            httpRequest.send('name=teswe&ee=ef');//发送请求 将情头体写在send中
        }
    }
}
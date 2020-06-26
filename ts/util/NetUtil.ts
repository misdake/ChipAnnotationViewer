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

    public static count(chip: string, comment: number) {
        console.log("count", chip, comment)
        let url = `https://api.countapi.xyz/hit/chipannotationviewer/${chip}_${comment}`;
        NetUtil.get(url, text => {
        });
    }
}
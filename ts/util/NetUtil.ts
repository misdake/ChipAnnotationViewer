export class NetUtil {
    public static get(url: string, callback?: (text: string) => void, auth?: string) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                if (callback) callback(request.responseText);
            }
        };
        request.open("GET", url, true);
        if (auth) request.setRequestHeader("Authorization", auth);
        request.send();
    }

    public static post(url: string, bodyObject: any, callback?: (text: string) => void, auth?: string) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status >= 200 && request.status < 300) {
                if (callback) callback(request.responseText);
            }
        };
        request.open("POST", url, true);
        if (auth) request.setRequestHeader("Authorization", auth);
        request.setRequestHeader('content-type', 'application/json');
        request.send(JSON.stringify(bodyObject));
    }

    public static patch(url: string, bodyObject: any, callback?: (text: string) => void, auth?: string) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status >= 200 && request.status < 300) {
                if (callback) callback(request.responseText);
            }
        };
        request.open("PATCH", url, true);
        if (auth) request.setRequestHeader("Authorization", auth);
        request.setRequestHeader('content-type', 'application/json');
        request.send(JSON.stringify(bodyObject));
    }

    public static count(chip: string, comment: number) {
        let t = new Date().getTime();
        const DAY_TIME = 1000 * 60 * 60 * 24;
        let today = ~~(t / DAY_TIME);

        let savedDayString = localStorage.getItem("today");
        let savedDay = undefined;
        if (savedDayString) {
            try {
                savedDay = parseInt(savedDayString);
            } catch (e) {
            }
        }

        if (!savedDay || today > savedDay) {
            NetUtil.get(`https://chipannotation.vercel.app/user/log/0`);
            localStorage.setItem("today", `${today}`);
        }

        let url = `https://chipannotation.vercel.app/count/log/${chip}/${comment}`;
        NetUtil.get(url);
    }
}

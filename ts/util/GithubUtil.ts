import {NetUtil} from "./NetUtil";

export class Github {
    static getComments(repo: string, issueId: number, callback: (comments: GithubComment[]) => void) {
        let githubUsername = window.localStorage.getItem("github_username");
        let githubToken = window.localStorage.getItem("github_token");

        let auth = undefined;
        if (githubUsername && githubToken) {
            auth = "Basic " + btoa(`${githubUsername}:${githubToken}`);
        }

        NetUtil.get("https://api.github.com/repos/" + repo + "/issues/" + issueId + "/comments", json => {
            try {
                let array = JSON.parse(json) as GithubComment[];
                callback(array);
            } catch (e) {
            }
        }, auth);
    }

    static getIssueLink(repo: string, issueId: number): string {
        return "https://github.com/" + repo + "/issues/" + issueId;
    }
    static getCommentLink(repo: string, issueId: number, commentId: number): string {
        return "https://github.com/" + repo + "/issues/" + issueId + "#issuecomment-" + commentId;
    }
}

export class GithubUser {
    login: string;
    id: number;
}

export class GithubComment {
    user: GithubUser;
    id: number;
    body: string;
}
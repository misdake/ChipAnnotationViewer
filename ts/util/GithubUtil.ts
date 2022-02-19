import {NetUtil} from "./NetUtil";

export class Github {

    static getAuth(check?: (username: string) => boolean) {
        let githubUsername = window.localStorage.getItem("github_username");
        let githubToken = window.localStorage.getItem("github_token");
        if (githubUsername && githubToken && (!check || check(githubUsername))) {
            let auth = "Basic " + btoa(`${githubUsername}:${githubToken}`);
            return auth;
        }
        return null;
    }

    static getComments(repo: string, issueId: number, callback: (comments: GithubComment[]) => void) {
        let auth = Github.getAuth();

        NetUtil.get("https://api.github.com/repos/" + repo + "/issues/" + issueId + "/comments", json => {
            try {
                let array = JSON.parse(json) as GithubComment[];
                callback(array);
            } catch (e) {
            }
        }, auth);
    }

    static createComment(repo: string, issueId: number, commentBody: string, callback: (comment: GithubComment) => void) {
        let auth = Github.getAuth();

        NetUtil.post("https://api.github.com/repos/" + repo + "/issues/" + issueId + "/comments", {body: commentBody}, json => {
            try {
                let comment = JSON.parse(json) as GithubComment;
                callback(comment);
            } catch (e) {
            }
        }, auth);
    }

    static updateComment(repo: string, issueId: number, commentId: number, commentBody: string, callback: (comment: GithubComment) => void) {
        let auth = Github.getAuth();

        NetUtil.patch("https://api.github.com/repos/" + repo + "/issues/comments/" + commentId, {body: commentBody}, json => {
            try {
                let comment = JSON.parse(json) as GithubComment;
                callback(comment);
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

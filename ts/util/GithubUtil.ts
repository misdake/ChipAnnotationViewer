import {NetUtil} from "./NetUtil";

export class Github {
    static getComments(repo: string, issueId: number, callback: (comments: GithubComment[]) => void) {
        NetUtil.get("https://api.github.com/repos/" + repo + "/issues/" + issueId + "/comments", json => {
            try {
                let array = JSON.parse(json) as GithubComment[];
                callback(array);
            } catch (e) {
            }
        });
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
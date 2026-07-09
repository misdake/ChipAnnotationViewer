import { Comment } from './data/Comment';
import { ClientApi } from './data/ClientApi';

type UserInfo = { userId: number, userName: string };

const params = new URLSearchParams(window.location.search);
const chipName = params.get('chip') || '';
const annotationParam = params.get('annotation');
const annotation = annotationParam === null || annotationParam === '' ? 0 : Number(annotationParam);

const titleElement = document.getElementById('comment-title');
const statusElement = document.getElementById('login-status');
const loginButton = document.getElementById('login-button') as HTMLButtonElement;
const refreshButton = document.getElementById('refresh-button') as HTMLButtonElement;
const sortButton = document.getElementById('sort-button') as HTMLButtonElement;
const form = document.getElementById('comment-form') as HTMLFormElement;
const textarea = document.getElementById('comment-content') as HTMLTextAreaElement;
const submitActions = document.getElementById('comment-submit-actions') as HTMLElement;
const submitButton = document.getElementById('comment-submit') as HTMLButtonElement;
const messageElement = document.getElementById('message');
const listElement = document.getElementById('comment-list');
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;

const THEME_STORAGE_KEY = 'chipannotation-comments-theme';
type Theme = 'light' | 'dark';

let currentUser: UserInfo = {userId: 0, userName: 'guest'};
let comments: Comment[] = [];
let newestFirst = true;
let commentEvents: EventSource = null;
let commentEventsReady = false;
let realtimeRefreshTimer: number = null;
let commentsLoadPromise: Promise<void> = null;
let reloadAfterCurrentLoad = false;

function notifyParentCommentsChanged() {
    if (window.parent === window) return;
    window.parent.postMessage({
        type: 'chipannotation-comments-changed',
        chip: chipName,
        annotation,
    }, window.location.origin);
}

function currentTheme(): Theme {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function updateThemeButton() {
    const dark = currentTheme() === 'dark';
    themeToggle.textContent = dark ? '☀' : '☾';
    themeToggle.title = dark ? 'Use light theme' : 'Use dark theme';
    themeToggle.setAttribute('aria-label', themeToggle.title);
}

function setTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (_) {
        // Theme switching still works when storage is unavailable.
    }
    updateThemeButton();
}

function setMessage(message: string, error: boolean = false) {
    messageElement.textContent = message;
    messageElement.className = error ? 'error' : '';
}

function updateSubmitState() {
    submitButton.disabled = !textarea.value.trim();
}

function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
}

function updateSortButton() {
    sortButton.textContent = newestFirst ? '↓ Newest' : '↑ Oldest';
    sortButton.title = newestFirst ? 'Show oldest comments first' : 'Show newest comments first';
    sortButton.setAttribute('aria-label', sortButton.title);
}

function renderComments() {
    listElement.innerHTML = '';
    listElement.setAttribute('aria-busy', 'false');
    if (comments.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'No comments yet.';
        listElement.appendChild(empty);
        return;
    }

    const orderedComments = comments.slice().sort((a, b) => newestFirst
        ? b.createTime - a.createTime
        : a.createTime - b.createTime);
    for (const comment of orderedComments) {
        const article = document.createElement('article');
        article.className = 'comment';

        const header = document.createElement('header');
        const author = document.createElement('strong');
        author.textContent = comment.userName;
        const time = document.createElement('time');
        time.dateTime = new Date(comment.createTime).toISOString();
        time.textContent = formatTime(comment.createTime);
        header.append(author, time);

        if (currentUser.userId === comment.userId) {
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'delete-button';
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteComment(comment.cid, deleteButton);
            header.appendChild(deleteButton);
        }

        const content = document.createElement('div');
        content.className = 'comment-content';
        content.textContent = comment.content;
        article.append(header, content);
        listElement.appendChild(article);
    }
}

async function loadUser() {
    currentUser = await ClientApi.getCurrentLogin();
    if (currentUser.userId) {
        statusElement.textContent = `Logged in as ${currentUser.userName}`;
        loginButton.hidden = true;
        textarea.hidden = false;
        textarea.disabled = false;
        submitActions.hidden = false;
    } else {
        statusElement.textContent = 'Sign in to post a comment.';
        loginButton.hidden = false;
        textarea.hidden = true;
        textarea.disabled = true;
        submitActions.hidden = true;
    }
}

async function loadComments(render: boolean = true) {
    if (realtimeRefreshTimer !== null) {
        window.clearTimeout(realtimeRefreshTimer);
        realtimeRefreshTimer = null;
    }
    if (commentsLoadPromise) {
        reloadAfterCurrentLoad = true;
        await commentsLoadPromise;
        return;
    }
    commentsLoadPromise = (async () => {
        comments = await ClientApi.listComments(chipName, annotation);
        if (render) renderComments();
        notifyParentCommentsChanged();
    })();
    try {
        await commentsLoadPromise;
    } finally {
        commentsLoadPromise = null;
    }
    if (reloadAfterCurrentLoad) {
        reloadAfterCurrentLoad = false;
        await loadComments(true);
    }
}

function connectCommentEvents() {
    if (commentEvents) commentEvents.close();
    commentEventsReady = false;
    commentEvents = ClientApi.openCommentEvents(chipName, annotation);
    commentEvents.addEventListener('ready', () => {
        if (commentEventsReady) scheduleRealtimeRefresh();
        commentEventsReady = true;
    });
    commentEvents.addEventListener('comments', scheduleRealtimeRefresh);
}

function scheduleRealtimeRefresh() {
    if (realtimeRefreshTimer !== null) window.clearTimeout(realtimeRefreshTimer);
    realtimeRefreshTimer = window.setTimeout(() => {
        realtimeRefreshTimer = null;
        loadComments().catch(error => {
            setMessage(error instanceof Error ? error.message : 'Could not update comments.', true);
        });
    }, 150);
}

async function getAnnotationTitle(): Promise<string> {
    const annotations = await ClientApi.listAnnotationByChip(chipName);
    const selected = annotations.find(item => item.aid === annotation);
    return selected && selected.title ? selected.title : `Annotation #${annotation}`;
}

async function refresh() {
    refreshButton.disabled = true;
    setMessage('Refreshing...');
    try {
        await loadUser();
        await loadComments();
        setMessage('Comments refreshed.');
    } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not refresh comments.', true);
    } finally {
        refreshButton.disabled = false;
    }
}

async function deleteComment(cid: number, button: HTMLButtonElement) {
    if (!window.confirm('Delete this comment?')) return;
    button.disabled = true;
    try {
        const deleted = await ClientApi.deleteComment(cid);
        if (!deleted) throw new Error('You cannot delete this comment, or it no longer exists.');
        setMessage('Comment deleted.');
        await loadComments();
    } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not delete the comment.', true);
        button.disabled = false;
    }
}

async function initialize() {
    if (!chipName || !Number.isSafeInteger(annotation) || annotation < 0) {
        titleElement.textContent = 'Invalid comment parameters';
        setMessage('The URL must include a non-empty chip parameter, and annotation must be a non-negative integer.', true);
        loginButton.hidden = true;
        form.hidden = true;
        delete document.documentElement.dataset.loading;
        return;
    }

    try {
        titleElement.textContent = `Comments on ${chipName}`;
        const titlePromise = annotation === 0 ? Promise.resolve('') : getAnnotationTitle();
        const [, , annotationTitle] = await Promise.all([loadUser(), loadComments(false), titlePromise]);
        if (annotationTitle) titleElement.textContent = `Comments on ${chipName} / ${annotationTitle}`;
        renderComments();
        connectCommentEvents();
    } catch (error) {
        listElement.innerHTML = '';
        listElement.setAttribute('aria-busy', 'false');
        setMessage(error instanceof Error ? error.message : 'Could not load comments.', true);
    } finally {
        delete document.documentElement.dataset.loading;
    }
}

loginButton.onclick = () => ClientApi.openLoginTab();
refreshButton.onclick = refresh;
sortButton.onclick = () => {
    newestFirst = !newestFirst;
    updateSortButton();
    renderComments();
};
themeToggle.onclick = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark');

updateSortButton();
updateThemeButton();

window.addEventListener('message', event => {
    if (event.data && event.data.type === 'chipannotation-login-done') {
        ClientApi.closeAllLoginTabs();
        initialize();
    }
});

window.addEventListener('beforeunload', () => {
    if (commentEvents) commentEvents.close();
    if (realtimeRefreshTimer !== null) window.clearTimeout(realtimeRefreshTimer);
});

form.onsubmit = async event => {
    event.preventDefault();
    if (!textarea.value.trim()) {
        updateSubmitState();
        return;
    }
    submitButton.disabled = true;
    setMessage('');
    try {
        await ClientApi.createComment(chipName, annotation, textarea.value);
        textarea.value = '';
        updateSubmitState();
        setMessage('Comment posted.');
        await loadComments();
    } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not post the comment.', true);
    } finally {
        updateSubmitState();
    }
};

textarea.addEventListener('input', updateSubmitState);
textarea.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === 'Enter' && !submitButton.disabled) {
        event.preventDefault();
        form.requestSubmit();
    }
});

updateSubmitState();

initialize();

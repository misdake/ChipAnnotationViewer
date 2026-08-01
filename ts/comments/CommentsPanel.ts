export interface CommentsTarget {
    chipName: string;
    annotation: number;
    count: number;
    label: string;
    title?: string;
}

type JsPanelElement = HTMLElement & {
    status: string;
    content: HTMLElement;
    titlebar: HTMLElement;
    currentData: { width: string; height: string };
    smallify: () => JsPanelElement;
    unsmallify: () => JsPanelElement;
    reposition: (position: unknown) => JsPanelElement;
    resize: (size: unknown) => JsPanelElement;
    close: () => void;
    setHeaderTitle: (title: string) => JsPanelElement;
};

const EXPANDED_STORAGE_KEY = 'chipannotation-comments-panel-expanded';
const PANEL_WIDTH = 410;
const PANEL_HEIGHT = 540;

function sameTarget(left: CommentsTarget, right: CommentsTarget): boolean {
    return !!left && !!right && left.chipName === right.chipName && left.annotation === right.annotation;
}

class CommentsPanelManager {
    private panel: JsPanelElement = null;
    private iframe: HTMLIFrameElement = null;
    private target: CommentsTarget = null;
    private onCountRefresh: (target: CommentsTarget) => void = null;
    private onStateChange: () => void = null;
    private createPromise: Promise<void> = null;
    private shouldExpandOnCreate = false;
    private userId = 0;
    private userName = '';

    constructor() {
        window.addEventListener('message', event => this.onMessage(event));
        window.addEventListener('resize', () => this.fitViewport());
    }

    public setUser(userId: number, userName: string) {
        this.userId = userId || 0;
        this.userName = userName || '';
    }

    public setCountRefreshHandler(handler: (target: CommentsTarget) => void) {
        this.onCountRefresh = handler;
    }

    public setStateChangeHandler(handler: () => void) {
        this.onStateChange = handler;
    }

    public isOpen(target: CommentsTarget): boolean {
        return !!this.target && sameTarget(this.target, target);
    }

    public clearTarget() {
        this.target = null;
        this.shouldExpandOnCreate = false;
        this.notifyStateChange();
        if (this.panel) this.panel.close();
    }

    public updateCount(target: CommentsTarget) {
        if (!target || !this.target || !sameTarget(this.target, target)) return;
        this.showTarget(target, false);
    }

    public open(target: CommentsTarget) {
        if (!target) return;
        this.showTarget(target, true);
    }

    public toggle(target: CommentsTarget) {
        if (!target) return;
        if (this.target && sameTarget(this.target, target)) {
            this.clearTarget();
            return;
        }
        this.open(target);
    }

    public followChip(chipName: string, count: number) {
        if (!this.target) return;
        if (this.target.annotation === 0) {
            this.showTarget({ ...this.target, chipName, count: count || 0 }, false);
        } else if (this.target.chipName !== chipName) {
            this.clearTarget();
        }
    }

    public followAnnotation(chipName: string, annotation: number, count: number, title?: string) {
        if (!this.target || this.target.annotation === 0) return;
        if (annotation <= 0) {
            this.clearTarget();
            return;
        }
        this.showTarget({ ...this.target, chipName, annotation, count: count || 0, title: title || '' }, false);
    }

    private showTarget(target: CommentsTarget, expand: boolean) {
        const changed = !sameTarget(this.target, target);
        this.target = { ...target };
        if (changed) this.notifyStateChange();
        if (!this.panel) {
            this.shouldExpandOnCreate = this.shouldExpandOnCreate || expand || this.readExpanded();
            this.createPanel();
        } else {
            this.updateHeader();
            if (changed) this.updateIframe();
            if (expand && this.isSmallified()) this.panel.unsmallify();
            this.anchorBottomRight();
        }
    }

    private createPanel() {
        if (this.createPromise) return;
        this.createPromise = this.loadAndCreatePanel();
        this.createPromise.then(() => {
            this.createPromise = null;
        }, error => {
            this.createPromise = null;
            console.error('Could not load comments panel', error);
        });
    }

    private async loadAndCreatePanel() {
        const [{ jsPanel }] = await Promise.all([
            import('jspanel4'),
            import('jspanel4/dist/jspanel.min.css'),
        ]);
        if (!this.target || this.panel) return;

        const expanded = this.shouldExpandOnCreate;
        this.shouldExpandOnCreate = false;
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'comments-dock-frame';
        this.iframe.title = 'Comments';

        this.panel = jsPanel.create({
            id: 'comments-dock-panel',
            headerTitle: this.headerTitle(),
            headerControls: {
                size: 'xs',
                close: 'show',
                maximize: 'remove',
                normalize: 'remove',
                minimize: 'remove',
                smallify: 'show',
                add: {
                    name: 'open-tab',
                    html: this.controlIcon('open-tab'),
                    ariaLabel: 'Open comments in a new tab',
                    position: 1,
                    handler: () => this.openInNewTab(),
                },
            },
            content: this.iframe,
            contentSize: this.panelSize(),
            contentOverflow: 'hidden',
            dragit: false,
            resizeit: false,
            boxShadow: 3,
            borderRadius: '8px 8px 0 0',
            position: { my: 'right-bottom', at: 'right-bottom' },
            css: { panel: 'comments-dock-panel' },
            onsmallified: () => this.onExpandedChanged(false),
            onunsmallified: () => this.onExpandedChanged(true),
            onclosed: () => {
                document.body.classList.remove('comments-panel-visible');
                this.target = null;
                this.shouldExpandOnCreate = false;
                this.panel = null;
                this.iframe = null;
                this.notifyStateChange();
            },
        }) as JsPanelElement;

        document.body.classList.add('comments-panel-visible');
        this.installControlIcons();
        this.panel.titlebar.addEventListener('click', () => this.toggleExpanded());
        this.updateIframe();
        if (!expanded) this.panel.smallify();
        else this.updateSmallifyControl(true);
        this.anchorBottomRight();
    }

    private toggleExpanded() {
        if (!this.panel) return;
        this.isSmallified() ? this.panel.unsmallify() : this.panel.smallify();
    }

    private isSmallified(): boolean {
        return !!this.panel && (this.panel.status === 'smallified' || this.panel.status === 'smallifiedmax');
    }

    private onExpandedChanged(expanded: boolean) {
        this.updateSmallifyControl(expanded);
        try {
            localStorage.setItem(EXPANDED_STORAGE_KEY, expanded ? '1' : '0');
        } catch (_) {
            // The panel still works when storage is unavailable.
        }
        requestAnimationFrame(() => this.anchorBottomRight());
    }

    private updateSmallifyControl(expanded: boolean) {
        if (!this.panel) return;
        const button = this.panel.querySelector('.jsPanel-btn-smallify') as HTMLButtonElement;
        if (!button) return;
        button.innerHTML = this.controlIcon(expanded ? 'collapse' : 'expand');
        button.title = expanded ? 'Collapse comments' : 'Expand comments';
        button.setAttribute('aria-label', button.title);
        button.style.transform = 'none';
    }

    private installControlIcons() {
        if (!this.panel) return;
        const closeButton = this.panel.querySelector('.jsPanel-btn-close') as HTMLButtonElement;
        if (closeButton) {
            closeButton.innerHTML = this.controlIcon('close');
            closeButton.title = 'Close comments';
            closeButton.setAttribute('aria-label', closeButton.title);
        }
    }

    private controlIcon(icon: 'open-tab' | 'collapse' | 'expand' | 'close'): string {
        const paths = {
            'open-tab': '<path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
            collapse: '<path d="m6 9 6 6 6-6"/>',
            expand: '<path d="m6 15 6-6 6 6"/>',
            close: '<path d="m6 6 12 12M18 6 6 18"/>',
        };
        return `<svg class="comments-control-icon" aria-hidden="true" viewBox="0 0 24 24">${paths[icon]}</svg>`;
    }

    private readExpanded(): boolean {
        try {
            return localStorage.getItem(EXPANDED_STORAGE_KEY) === '1';
        } catch (_) {
            return false;
        }
    }

    private notifyStateChange() {
        if (this.onStateChange) this.onStateChange();
    }

    private panelSize() {
        return {
            width: `${Math.min(PANEL_WIDTH, window.innerWidth)}px`,
            height: `${Math.min(PANEL_HEIGHT, Math.max(260, window.innerHeight - 58))}px`,
        };
    }

    private fitViewport() {
        if (!this.panel || this.isSmallified()) return;
        this.panel.resize(this.panelSize());
        this.anchorBottomRight();
    }

    private anchorBottomRight() {
        if (this.panel) this.panel.reposition({ my: 'right-bottom', at: 'right-bottom' });
    }

    private commentsUrl(compact: boolean): string {
        if (!this.target) return '';
        const params = new URLSearchParams({
            chip: this.target.chipName,
            annotation: String(this.target.annotation),
        });
        if (compact) params.set('compact', '1');
        //pass the login state and annotation title so the subpage can render instantly without waiting for /login/get or the annotation list
        if (this.userId > 0) {
            params.set('uid', String(this.userId));
            if (this.userName) params.set('uname', this.userName);
        }
        if (this.target.title) params.set('title', this.target.title);
        return `comments.html#${params.toString()}`;
    }

    private updateIframe() {
        if (this.iframe) this.iframe.src = this.commentsUrl(true);
    }

    private updateHeader() {
        if (this.panel) this.panel.setHeaderTitle(this.headerTitle());
    }

    private headerTitle(): string {
        if (!this.target) return 'Comments';
        return `${this.target.label} · ${this.target.count}`;
    }

    private openInNewTab() {
        const url = this.commentsUrl(false);
        if (url) window.open(url, '_blank', 'noopener');
    }

    private onMessage(event: MessageEvent) {
        if (event.origin !== window.location.origin || !this.iframe || event.source !== this.iframe.contentWindow) return;
        const detail = event.data;
        if (!detail || detail.type !== 'chipannotation-comments-changed' || !this.target) return;
        if (detail.chip !== this.target.chipName || Number(detail.annotation) !== this.target.annotation) return;
        if (this.onCountRefresh) this.onCountRefresh({ ...this.target });
    }
}

export const commentsPanel = new CommentsPanelManager();

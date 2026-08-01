import { customElement, html, LitElement, property, TemplateResult } from 'lit-element';
import { Chip, ChipContent } from '../data/Chip';
import { NetUtil } from '../util/NetUtil';
import { Annotation, AnnotationContent, AnnotationData } from '../data/Annotation';
import { upgradeAnnotationData } from '../data/AnnotationDataUpgrade';
import { ClientApi, RecentUpdateDay, RecentUpdateEvent } from '../data/ClientApi';
import { notifyToast } from '../util/Toast';
import { AppModal } from '../util/AppModal';
import { render as renderTemplate } from 'lit-html';
import { commentsPanel, CommentsTarget } from '../comments/CommentsPanel';

const commentIcon = html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4.5-1.1L3 20l1.3-4A8.3 8.3 0 0 1 3 11.5a8.4 8.4 0 0 1 9-8.5 8.4 8.4 0 0 1 9 8.5Z" />
    </svg>`;

const chipInfoIcon = html`
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5h.01" />
        <path d="M12 11v8" />
    </svg>`;

const refreshIcon = html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.5-2.4L20 11M4 13l2.4 4.4A7 7 0 0 0 17.9 15"/>
    </svg>`;

const clearIcon = html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18"/>
    </svg>`;

const newAnnotationIcon = html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M13 3v5h5"/><path d="M15 17h6M18 14v6"/>
    </svg>`;

const openChipIcon = html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 6h10"/>
        <path d="M4 11h7"/>
        <path d="M4 16h6"/>
        <circle cx="16.5" cy="15.5" r="3.5"/>
        <path d="M19 18l2 2"/>
    </svg>`;

const recentUpdatesIcon = html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M12 7v5l3.5 2"/>
    </svg>`;

function getUrlParam(url: URL, defaultValue: string, ...paramNames: string[]): string {
    let r = defaultValue;
    for (let param of paramNames) {
        let v = url.searchParams.get(param) && decodeURIComponent(url.searchParams.get(param));
        if (v) r = v;
    }
    return r;
}

@customElement('select-element')
export class SelectElement extends LitElement {
    // chip selection box

    chip_name_toload: string;

    @property()
    chiplist_html: TemplateResult[];
    chiplist_array: Chip[];

    chip_current: Chip;
    @property()
    onSelectChip: (chip: Chip) => void;

    @property()
    chip_content_current: ChipContent;

    @property()
    onSelectChipContent: (chipContent: ChipContent) => void;

    // chip selection box


    // annotation selection box

    annotation_id_toload: number;

    @property()
    annotationlist_html: TemplateResult[];
    annotationlist_array: Annotation[];

    @property()
    onSelectAnnotation: (annotation: Annotation, data: AnnotationData) => void;
    @property()
    canDiscardCurrentAnnotation: () => boolean;
    @property()
    isCurrentAnnotationDirty: () => boolean;

    @property({type: Number})
    chipCommentCount: number = null;
    @property({type: Number})
    annotationCommentCount: number = null;
    @property({type: Number})
    private annotationCommentTargetId: number = 0;
    @property({type: Boolean})
    canCreateAnnotation: boolean = false;

    @property()
    annotation_current: Annotation;
    annotation_content_current: AnnotationContent;
    private annotationContentCache: Map<number, AnnotationData> = new Map();
    private annotationSelectionVersion = 0;
    private chipSelectionVersion = 0;
    @property()
    private chipQuery = '';
    @property()
    private chipFilter = '';
    @property({ type: Boolean })
    private chipPickerOpen = false;
    @property({ type: Boolean })
    private advancedBrowserOpen = false;
    @property()
    private advancedName = '';
    @property()
    private advancedVendor = '';
    @property()
    private advancedType = '';
    @property()
    private advancedFamily = '';
    @property()
    private advancedSort: 'name' | 'classification' = 'classification';
    @property()
    private advancedSortDirection: 'asc' | 'desc' = 'asc';
    @property()
    private advancedSelectedChip: Chip = null;

    private static getDummyAnnotation: () => Annotation = () => ({ aid: 0, chipName: '', title: '', createTime: 0, updateTime: 0, userName: '', userId: 0 });

    // annotation selection box

    private replaceUrl() {
        let url = window.location.pathname + '?chip=' + encodeURIComponent(this.chip_current.name);
        if (this.annotation_current && this.annotation_current.aid > 0) url += '&annotation=' + this.annotation_current.aid;
        history.replaceState(null, '', url);
    }

    protected firstUpdated(): void {
        let url_string = window.location.href;
        let url = new URL(url_string);
        this.chip_name_toload = getUrlParam(url, 'Fiji', 'chip', 'map');
        this.annotation_id_toload = parseInt(getUrlParam(url, '0', 'annotation'), 10);

        //legacy urls use commentId (GitHub issue comment id); resolve it to an annotation id
        //before loading, then the normal selection flow rewrites the url to the new params
        const commentId = parseInt(url.searchParams.get('commentId') || '0', 10);
        if (!(this.annotation_id_toload > 0) && commentId > 0) {
            ClientApi.getAnnotationByCommentId(commentId).then(annotation => {
                if (annotation && annotation.aid > 0) {
                    this.annotation_id_toload = annotation.aid;
                    this.chip_name_toload = annotation.chipName || this.chip_name_toload;
                } else {
                    notifyToast('The linked annotation no longer exists', 'warning');
                }
                this.refreshChipList();
            }).catch(error => {
                const missing = error instanceof Error && error.message.indexOf('400') >= 0;
                if (missing) {
                    notifyToast('The linked annotation no longer exists', 'warning');
                } else {
                    SelectElement.warnNetwork('Could not resolve the linked annotation', error);
                }
                this.refreshChipList();
            });
        } else {
            this.refreshChipList();
        }
        this.mountRecentUpdatesFab();
        commentsPanel.setCountRefreshHandler(target => this.refreshCommentsTarget(target));
        commentsPanel.setStateChangeHandler(() => this.requestUpdate());

        window.addEventListener('chipannotation-annotation-created', (ev: Event) => {
            const custom = ev as CustomEvent<number>;
            if (!this.chip_content_current || !custom.detail) return;
            this.annotation_id_toload = custom.detail;
            this.refreshAnnotationList();
        });
        window.addEventListener('chipannotation-annotation-deleted', (ev: Event) => {
            const custom = ev as CustomEvent<number>;
            if (!this.chip_content_current || !custom.detail) return;
            this.annotation_id_toload = 0;
            this.refreshAnnotationList();
        });
        window.addEventListener('chipannotation-annotation-updated', (ev: Event) => {
            const custom = ev as CustomEvent<number>;
            if (!this.chip_content_current || !custom.detail) return;
            this.annotation_id_toload = custom.detail;
            this.refreshAnnotationList();
        });
    }

    private openChipInfoModal(chip: ChipContent) {
        const sourceText = chip.source || '';
        const widthMm = chip.widthMillimeter || 0;
        const heightMm = chip.heightMillimeter || 0;
        const hasDieSize = widthMm > 0 && heightMm > 0;
        const dieAreaMm2 = widthMm * heightMm;
        const specUrl = chip.specUrl || '';
        const authorName = chip.imageAuthorName || '';
        const authorUrl = chip.imageAuthorUrl || '';
        const hasAuthor = !!authorName;

        const fmt = (value: number) => {
            return Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, '') : '';
        };

        const rows: TemplateResult[] = [];
        const row = (keyText: string, value: TemplateResult | string, extraClass: string = "") => html`
            <div class="chipInfoRow ${extraClass}">
                <span class="chipInfoKey">${keyText}</span>
                <span class="chipInfoValue">${value}</span>
            </div>
        `;
        const link = (text: string, href: string) => html`
            <a class="chipInfoLink" href="${href}" title="${href}" target="_blank">${text}</a>
        `;

        rows.push(row("Name", chip.name || ""));
        rows.push(row("Type", `${chip.vendor || ''} / ${chip.type || ''} / ${chip.family || ''}`));
        rows.push(row("Size (px)", `${chip.width} x ${chip.height}`));
        if (hasDieSize) rows.push(row("Die Size", `${fmt(dieAreaMm2)} mm2, ${fmt(widthMm)} mm x ${fmt(heightMm)} mm`));
        if (specUrl) rows.push(row("Spec", link(specUrl, specUrl)));
        if (hasAuthor) rows.push(row("Credit", authorUrl ? link(authorName, authorUrl) : authorName, "chipInfoCreditRow"));
        rows.push(row("Source", sourceText ? link(sourceText, sourceText) : ""));

        AppModal.open({
            title: "Chip Information",
            ariaLabel: "Chip Information",
            primaryText: "Close",
            showCancel: false,
            body: html`${rows}`,
            onSubmit: () => true,
        });
    }

    private openGlobalChipInfoModal() {
        const chip = this.chip_content_current;
        if (!chip) return;

        this.openChipInfoModal(chip);
    }


    //load chip list

    private refreshChipList() {
        SelectElement.fetchChipList().then(chips => {
            let { html, array, current } = SelectElement.showChipList(chips, this.chip_name_toload);
            this.chip_current = current;
            this.chiplist_html = html;
            this.chiplist_array = array;
            if (current) this.selectedChip(current);
        }).catch(error => {
            SelectElement.warnNetwork('Could not load chip list', error);
        });
    }
    private static fetchChipList(): Promise<Chip[]> {
        return new Promise<Chip[]>((resolve, reject) => {
            NetUtil.get('https://chip.rgbuv.xyz/list.json', text => {
                try {
                    let chips = JSON.parse(text) as Chip[];
                    resolve(chips);
                } catch (error) {
                    reject(error);
                }
            }, undefined, false, reject);
        });
    }
    private static showChipList(chips: Chip[], chip_current_name: string): { html: TemplateResult[], array: Chip[], current: Chip } {
        let name_chip: { [key: string]: Chip } = {};

        let selections: TemplateResult[] = [];
        let selection_chip: Chip[] = [];

        let sortChip: { [key: string]: Chip } = {};
        let sortKeys: string[] = [];

        if (chips && chips.length) {
            for (let chip of chips) {
                let id = `${chip.vendor} ${chip.type} ${chip.family} ${chip.name}`;
                sortKeys.push(id);
                sortChip[id] = chip;

                name_chip[chip.name] = chip;
            }
        }

        let current: Chip = null;
        sortKeys.sort();
        let last_VenderType = "";
        let last_Family = "";
        for (let key of sortKeys) {
            let chip = sortChip[key];
            let curr_VenderType = `${chip.vendor} ${chip.type}`;
            let curr_Family = `${chip.family}`;
            let name = chip.listname ? chip.listname : chip.name;

            if (last_VenderType !== curr_VenderType && curr_VenderType && curr_VenderType.length) {
                selections.push(html`<option>${curr_VenderType}</option>`);
                selection_chip.push(null);
            }
            if (last_Family !== curr_Family && curr_Family && curr_Family.length) {
                selections.push(html`<option>\xA0\xA0\xA0\xA0${curr_Family}</option>`);
                selection_chip.push(null);
            }
            if (chip_current_name && chip_current_name === chip.name) {
                current = chip;
                selections.push(html`<option selected>\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0${name}</option>`);
            } else {
                selections.push(html`<option>\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0${name}</option>`);
            }
            selection_chip.push(chip);

            last_VenderType = curr_VenderType;
            last_Family = curr_Family;
        }

        return { html: selections, array: selection_chip, current: current };
    }

    //select chip

    private uiSelectedChip(index: number) {
        if (!this.canDiscardCurrent()) {
            this.restoreChipSelect();
            return;
        }
        let chip = this.chiplist_array[index];
        if (chip) {
            this.selectedChip(chip);
        }
    }
    private selectedChip(chip: Chip) {
        const selectionVersion = ++this.chipSelectionVersion;
        this.chip_name_toload = chip ? chip.name : '';
        this.chip_current = chip;
        this.chipQuery = chip ? (chip.listname || chip.name) : '';
        this.chipFilter = this.chipQuery;
        this.chipPickerOpen = false;
        this.chipCommentCount = null;
        this.annotationCommentCount = null;
        commentsPanel.followChip(chip ? chip.name : '', 0);
        if (this.onSelectChip) this.onSelectChip(chip);
        this.annotationlist_html = [];
        this.annotationlist_array = [];
        this.annotation_current = null;
        this.annotationCommentTargetId = 0;
        this.replaceUrl();

        if (chip) {
            this.loadChipCommentCount(chip.name, selectionVersion);
            //fire both requests up front so they run in parallel; the list is applied only after the chip content
            const annotationsPromise = ClientApi.listAnnotationByChip(chip.name);
            annotationsPromise.catch(() => {}); //rejection is handled in applyAnnotationList
            SelectElement.fetchChipDetail(chip).then(chipDetail => {
                if (selectionVersion !== this.chipSelectionVersion) return;
                this.chip_content_current = chipDetail;
                if (this.onSelectChipContent) this.onSelectChipContent(chipDetail);
                let save = this.annotation_id_toload;
                this.selectedAnnotation(SelectElement.getDummyAnnotation());
                this.annotation_id_toload = save;
                this.replaceUrl();
                this.applyAnnotationList(chipDetail, annotationsPromise);
            }).catch(error => {
                SelectElement.warnNetwork(`Could not load chip data for ${chip.name}`, error);
            });
        }
    }

    private openAdvancedBrowser() {
        this.advancedName = '';
        this.advancedVendor = '';
        this.advancedType = '';
        this.advancedFamily = '';
        this.advancedSelectedChip = this.chip_current;
        this.advancedBrowserOpen = true;
    }

    private closeAdvancedBrowser() {
        this.advancedBrowserOpen = false;
    }

    private confirmAdvancedChip() {
        if (!this.advancedSelectedChip || !this.canDiscardCurrent()) return;
        this.selectedChip(this.advancedSelectedChip);
        this.closeAdvancedBrowser();
    }

    private toggleAdvancedSort(sort: 'name' | 'classification') {
        if (this.advancedSort === sort) {
            this.advancedSortDirection = this.advancedSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.advancedSort = sort;
            this.advancedSortDirection = 'asc';
        }
        this.advancedSelectedChip = null;
    }

    private advancedClassification(chip: Chip): string {
        return [chip.vendor, chip.type, chip.family].filter(Boolean).join(' / ');
    }

    private setAdvancedFacet(key: 'vendor' | 'type' | 'family', value: string) {
        const property = `advanced${key.charAt(0).toUpperCase()}${key.slice(1)}` as 'advancedVendor' | 'advancedType' | 'advancedFamily';
        this[property] = value;
        const chips = (this.chiplist_array || []).filter((item): item is Chip => !!item);
        const name = this.advancedName.trim().toLowerCase();
        const otherKeys = (['vendor', 'type', 'family'] as const).filter(item => item !== key);

        for (const otherKey of otherKeys) {
            const otherProperty = `advanced${otherKey.charAt(0).toUpperCase()}${otherKey.slice(1)}` as 'advancedVendor' | 'advancedType' | 'advancedFamily';
            const selected = this[otherProperty];
            if (!selected) continue;
            const compatible = chips.some(chip => {
                const displayName = `${chip.name} ${chip.listname || ''}`.toLowerCase();
                return (!name || displayName.includes(name)) && (!value || chip[key] === value) && chip[otherKey] === selected;
            });
            if (!compatible) this[otherProperty] = '';
        }
        this.advancedSelectedChip = null;
    }

    protected updated(): void {
        const root = document.getElementById('advancedChipModalRoot');
        if (root) renderTemplate(this.renderAdvancedBrowser(), root);
    }

    disconnectedCallback(): void {
        commentsPanel.setCountRefreshHandler(null);
        commentsPanel.setStateChangeHandler(null);
        commentsPanel.clearTarget();
        const root = document.getElementById('advancedChipModalRoot');
        if (root) renderTemplate(html``, root);
        super.disconnectedCallback();
    }
    private refreshAnnotationList() {
        if (!this.canDiscardCurrent()) return;
        if (!this.chip_content_current) return;
        this.applyAnnotationList(this.chip_content_current, ClientApi.listAnnotationByChip(this.chip_content_current.name));
    }

    private applyAnnotationList(chipContent: ChipContent, annotationsPromise: Promise<Annotation[]>) {
        this.annotationlist_html = [];
        this.annotationlist_array = [];
        annotationsPromise.then(annotations => {
            if (this.chip_content_current !== chipContent) return; //chip switched while loading
            this.annotationContentCache.clear();
            for (let annotation of annotations || []) {
                if (!annotation.content) continue;
                try {
                    this.annotationContentCache.set(annotation.aid, upgradeAnnotationData(JSON.parse(annotation.content)));
                } catch (error) {
                    console.warn('Could not parse annotation content', annotation.aid, error);
                }
            }
            let { html, array, current } = SelectElement.showAnnotationList(annotations, this.annotation_id_toload);
            this.annotation_current = current;
            this.annotationlist_html = html;
            this.annotationlist_array = array;

            if (current) {
                this.selectedAnnotation(current);
            } else {
                this.selectedAnnotation(SelectElement.getDummyAnnotation());
            }
        }).catch(error => {
            if (this.chip_content_current !== chipContent) return;
            SelectElement.warnNetwork('Could not load annotations from the server', error);
        });
    }

    //select annotation

    private uiSelectedAnnotation(index: number) {
        if (!this.canDiscardCurrent()) {
            this.restoreAnnotationSelect();
            return;
        }
        let annotation = this.annotationlist_array[index];
        if (!annotation) {
            this.restoreAnnotationSelect();
            return;
        }
        this.selectedAnnotation(annotation);
    }

    private clearAnnotationSelection() {
        if (!this.annotation_current || this.annotation_current.aid <= 0) return;
        if (!this.canDiscardCurrent()) return;
        const annotations = (this.annotationlist_array || []).filter((item): item is Annotation => !!item);
        const { html, array } = SelectElement.showAnnotationList(annotations, 0);
        this.annotationlist_html = html;
        this.annotationlist_array = array;
        this.selectedAnnotation(SelectElement.getDummyAnnotation());
        this.updateComplete.then(() => {
            const select = this.querySelector("#annotationSelect") as HTMLSelectElement;
            if (select) select.selectedIndex = 0;
        });
    }

    private requestNewAnnotation() {
        if (!this.canCreateAnnotation || !this.chip_content_current) return;
        window.dispatchEvent(new CustomEvent('chipannotation-new-annotation-requested'));
    }
    private selectedAnnotation(annotation: Annotation) {
        const selectionVersion = ++this.annotationSelectionVersion;
        this.annotation_id_toload = annotation ? annotation.aid : 0;
        this.annotation_current = annotation;
        this.annotationCommentTargetId = annotation && annotation.aid > 0 ? annotation.aid : 0;
        this.annotationCommentCount = null;
        commentsPanel.followAnnotation(this.chip_current ? this.chip_current.name : '', annotation ? annotation.aid : 0, 0);
        if (annotation.aid > 0) {
            let data = this.annotationContentCache.get(annotation.aid) || AnnotationData.dummy();
            if (this.onSelectAnnotation) this.onSelectAnnotation(annotation, data);
            this.loadAnnotationCommentCount(annotation, selectionVersion);
            this.replaceUrl();
            this.revalidateAnnotationContent(annotation, selectionVersion);
        } else {
            if (this.onSelectAnnotation) this.onSelectAnnotation(annotation, AnnotationData.dummy());
            this.replaceUrl();
        }
    }

    //fetch the latest content in the background: apply it only when it differs and there are no unsaved local changes
    private revalidateAnnotationContent(annotation: Annotation, selectionVersion: number) {
        ClientApi.getAnnotationContent(annotation.aid).then(content => {
            if (selectionVersion !== this.annotationSelectionVersion) return;
            if (this.annotation_current !== annotation) return; //chip or annotation switched while loading
            if (content && content.content === annotation.content) return;
            if (this.isCurrentAnnotationDirty && this.isCurrentAnnotationDirty()) return;
            let data: AnnotationData;
            try {
                data = upgradeAnnotationData(JSON.parse(content.content));
            } catch (error) {
                console.warn('Could not parse annotation content', annotation.aid, error);
                return;
            }
            annotation.content = content.content;
            annotation.version = content.version;
            this.annotationContentCache.set(annotation.aid, data);
            if (this.onSelectAnnotation) this.onSelectAnnotation(annotation, data);
        }).catch(error => {
            console.warn('Could not revalidate annotation content', annotation.aid, error);
        });
    }

    private static fetchChipDetail(chip: Chip): Promise<ChipContent> {
        return new Promise<ChipContent>((resolve, reject) => {
            NetUtil.get(chip.url + '/content.json', json => {
                try {
                    let chipContent: ChipContent = JSON.parse(json) as ChipContent;
                    chipContent.baseUrl = chip.url;
                    if (!chipContent.vendor) chipContent.vendor = chip.vendor;
                    if (!chipContent.type) chipContent.type = chip.type;
                    if (!chipContent.family) chipContent.family = chip.family;
                    resolve(chipContent);
                } catch (error) {
                    reject(error);
                }
            }, undefined, false, reject);
        });
    }

    private static warnNetwork(message: string, error: unknown) {
        console.warn(message, error);
        notifyToast(message, 'warning');
    }

    private canDiscardCurrent(): boolean {
        return !this.canDiscardCurrentAnnotation || this.canDiscardCurrentAnnotation();
    }

    private openRecentUpdates() {
        ClientApi.listRecentUpdates().then(days => {
            AppModal.open({
                title: 'Recent updates',
                ariaLabel: 'Recent updates',
                primaryText: 'Close',
                showCancel: false,
                body: this.renderRecentUpdates(days),
                onSubmit: () => true,
            });
        }).catch(error => {
            SelectElement.warnNetwork('Could not load recent updates', error);
        });
    }

    private mountRecentUpdatesFab() {
        const fab = document.createElement('button');
        fab.className = 'recentUpdatesFab';
        fab.title = 'Recent updates';
        fab.setAttribute('aria-label', 'Recent updates');
        fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3.5 2"/></svg>';
        fab.addEventListener('click', () => this.openRecentUpdates());
        document.body.appendChild(fab);
    }

    private renderRecentUpdates(days: RecentUpdateDay[]): TemplateResult {
        if (!days || days.length === 0) return html`<div class="recentUpdatesEmpty">No recent updates.</div>`;
        return html`<div class="recentUpdatesList">${days.map(day => html`
            <div class="recentUpdatesDay">${day.day}</div>
            ${day.events.map(event => this.renderRecentUpdateRow(event))}
        `)}</div>`;
    }

    private renderRecentUpdateRow(event: RecentUpdateEvent): TemplateResult {
        const isChip = event.kind === 'chip';
        const badge = isChip ? 'New chip' : event.kind === 'annotation-create' ? 'New annotation' : 'Updated';
        const badgeClass = isChip ? 'chip' : event.kind === 'annotation-create' ? 'create' : 'update';
        const text = isChip ? (event.chipDisplay || event.chip) : `${event.title || 'Untitled'} (${event.chipDisplay || event.chip})${event.userName ? ` by ${event.userName}` : ''}`;
        const href = `?chip=${encodeURIComponent(event.chip)}${!isChip && event.aid ? `&annotation=${event.aid}` : ''}`;
        const time = new Date(event.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        return html`
            <a class="recentUpdatesRow" href="${href}" @click=${(ev: MouseEvent) => this.onRecentUpdateClick(ev, event)}>
                <span class="recentUpdatesBadge recentUpdatesBadge-${badgeClass}">${badge}</span>
                <span class="recentUpdatesText">${text}</span>
                <span class="recentUpdatesTime">${time}</span>
            </a>`;
    }

    private onRecentUpdateClick(ev: MouseEvent, event: RecentUpdateEvent) {
        if (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
        ev.preventDefault();
        AppModal.close();
        this.openFromRecent(event.chip, event.kind === 'chip' ? 0 : (event.aid || 0));
    }

    private openFromRecent(chipName: string, aid: number) {
        if (!this.canDiscardCurrent()) return;
        if (this.chip_current && this.chip_current.name === chipName) {
            if (aid > 0) {
                this.annotation_id_toload = aid;
                this.refreshAnnotationList();
            }
            return;
        }
        this.chip_name_toload = chipName;
        this.annotation_id_toload = aid;
        this.refreshChipList();
    }

    private loadChipCommentCount(chipName: string, selectionVersion: number) {
        ClientApi.getCommentCount(chipName, 0).then(count => {
            if (selectionVersion !== this.chipSelectionVersion || this.chip_current.name !== chipName) return;
            this.chipCommentCount = count;
            commentsPanel.updateCount(this.commentsTarget(0, count));
        }).catch(error => {
            if (selectionVersion !== this.chipSelectionVersion) return;
            console.warn('Could not load chip comment count', error);
        });
    }

    private loadAnnotationCommentCount(annotation: Annotation, selectionVersion: number) {
        ClientApi.getCommentCount(annotation.chipName, annotation.aid).then(count => {
            if (selectionVersion !== this.annotationSelectionVersion || this.annotation_current !== annotation) return;
            this.annotationCommentCount = count;
            commentsPanel.updateCount(this.commentsTarget(annotation.aid, count));
        }).catch(error => {
            if (selectionVersion !== this.annotationSelectionVersion) return;
            console.warn('Could not load annotation comment count', error);
        });
    }

    private openComments(annotation: number) {
        const chip = this.chip_current;
        if (!chip) return;
        const count = annotation === 0 ? this.chipCommentCount : this.annotationCommentCount;
        commentsPanel.toggle(this.commentsTarget(annotation, count || 0));
    }

    private commentsTarget(annotation: number, count: number): CommentsTarget {
        return {
            chipName: this.chip_current ? this.chip_current.name : '',
            annotation,
            count: count || 0,
            label: annotation === 0 ? 'Chip comments' : 'Annotation comments',
        };
    }

    private refreshCommentsTarget(target: CommentsTarget) {
        if (!this.chip_current || target.chipName !== this.chip_current.name) return;
        if (target.annotation === 0) {
            this.loadChipCommentCount(target.chipName, this.chipSelectionVersion);
        } else if (this.annotation_current && this.annotation_current.aid === target.annotation) {
            this.loadAnnotationCommentCount(this.annotation_current, this.annotationSelectionVersion);
        }
    }

    private renderCommentButton(annotation: number, count: number, title: string, disabled: boolean) {
        const target = disabled ? null : this.commentsTarget(annotation, count || 0);
        const active = !!target && commentsPanel.isOpen(target);
        return html`
            <button class="topBarIconButton commentButton ${active ? 'commentButtonActive' : ''}" ?disabled=${disabled} aria-pressed=${active ? 'true' : 'false'} title=${title} aria-label=${title} @click=${() => this.openComments(annotation)}>
                ${commentIcon}
                ${count === null ? html`` : html`<span class="commentCount ${count === 0 ? 'commentCountEmpty' : ''}" aria-label=${`${count} comments`}>${count}</span>`}
            </button>`;
    }

    private restoreChipSelect() {
        const select = this.querySelector("#chipSelect") as HTMLSelectElement;
        if (!select || !this.chiplist_array) return;
        const index = this.chiplist_array.indexOf(this.chip_current);
        if (index >= 0) select.selectedIndex = index;
    }

    private restoreAnnotationSelect() {
        const select = this.querySelector("#annotationSelect") as HTMLSelectElement;
        if (!select || !this.annotationlist_array) return;
        const index = this.annotationlist_array.indexOf(this.annotation_current);
        if (index >= 0) select.selectedIndex = index;
    }
    private static showAnnotationList(annotations: Annotation[], annotation_current_id: number): { html: TemplateResult[], array: Annotation[], current: Annotation } {
        let options: TemplateResult[] = [];
        let array: Annotation[] = [];

        const annotationCount = annotations ? annotations.length : 0;
        let current: Annotation = null;
        for (let annotation of annotations) {
            if (!annotation.title) {
                annotation.title = 'untitled';
            }

            if (annotation_current_id === annotation.aid) {
                current = annotation;
                options.push(html`
                    <option selected>${annotation.title} @${annotation.userName}</option>`);
            } else {
                options.push(html`
                    <option>${annotation.title} @${annotation.userName}</option>`);
            }
            array.push(annotation);
        }

        options.unshift(html`<option disabled ?selected=${!current}>${annotationCount} ${annotationCount === 1 ? 'annotation' : 'annotations'}...</option>`);
        array.unshift(null);

        return { html: options, array: array, current: current }
    }

    // chip search: filter by the input value minus the selected text, so select-all means "show everything"

    private syncChipFilter(input: HTMLInputElement) {
        const value = input.value;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        this.chipFilter = value.slice(0, start) + value.slice(end);
    }

    private onChipSearchFocus(ev: FocusEvent) {
        this.chipPickerOpen = true;
        const input = ev.target as HTMLInputElement;
        input.select();
        this.syncChipFilter(input);
        // a mouse click collapses the selection on mouseup, after the focus event, so select all again
        window.setTimeout(() => {
            if (document.activeElement !== input) return;
            input.select();
            this.syncChipFilter(input);
        }, 0);
    }

    render() {
        const chip = this.chip_content_current;
        const query = this.chipFilter.trim().toLowerCase();
        const chips = (this.chiplist_array || []).filter((item): item is Chip => !!item);
        const filteredChips = chips.filter(item => {
            const searchText = `${item.name} ${item.listname || ''} ${item.vendor || ''} ${item.type || ''} ${item.family || ''}`.toLowerCase();
            return !query || searchText.includes(query);
        });
        const quickChips = filteredChips;
        const annotationOptionOffset = 0;
        const annotationOptions = this.annotationlist_html || [];
        const hasAnnotationOptions = annotationOptions.length > 0;

        return html`
            <div class="workspace-selectors">
                <label class="selector-field">
                    <span class="selector-field-label ui-section-label">Chip</span>
                    <span class="selector-control">
                        <span class="chip-picker">
                            <input id="chipSearch" type="search" aria-label="Search chip" autocomplete="off"
                                .value=${this.chipQuery}
                                @focus=${(ev: FocusEvent) => this.onChipSearchFocus(ev)}
                                @blur=${() => window.setTimeout(() => { this.chipPickerOpen = false; }, 0)}
                                @input=${(ev: Event) => { const input = ev.target as HTMLInputElement; this.chipQuery = input.value; this.syncChipFilter(input); this.chipPickerOpen = true; }}
                                @select=${(ev: Event) => this.syncChipFilter(ev.target as HTMLInputElement)}
                                @keydown=${(ev: KeyboardEvent) => {
                                    if (ev.key === 'Escape') this.chipPickerOpen = false;
                                    if (ev.key === 'Enter' && quickChips.length === 1) this.selectedChip(quickChips[0]);
                                }}>
                            ${this.chipQuery ? html`
                                <button type="button" class="chip-search-clear" title="Clear chip search" aria-label="Clear chip search"
                                    @mousedown=${(ev: Event) => ev.preventDefault()}
                                    @click=${() => { this.chipQuery = ''; this.chipFilter = ''; this.chipPickerOpen = true; }}>
                                    ${clearIcon}
                                </button>` : html``}
                            ${this.chipPickerOpen ? html`
                                <div class="chip-quick-list" @mousedown=${(ev: Event) => ev.preventDefault()}>
                                    ${quickChips.length ? quickChips.map(item => html`
                                        <button type="button" class="chip-quick-item" @click=${() => this.canDiscardCurrent() && this.selectedChip(item)}>
                                            <strong>${item.listname || item.name}</strong>
                                            <span>${[item.vendor, item.type, item.family].filter(Boolean).join(' · ')}</span>
                                        </button>`) : html`<div class="chip-quick-empty">No matching chips</div>`}
                                </div>` : html``}
                        </span>
                        ${chip
                            ? html`
                                <button class="topBarIconButton chipBrowseButton" title="Advanced chip browser" aria-label="Advanced chip browser" @click=${() => this.openAdvancedBrowser()}>${openChipIcon}</button>
                                ${this.renderCommentButton(0, this.chipCommentCount, 'Chip comments', false)}
                                <button class="topBarIconButton" title="Chip information" aria-label="Chip information" @click=${() => this.openGlobalChipInfoModal()}>${chipInfoIcon}</button>`
                            : html`
                                ${this.renderCommentButton(0, this.chipCommentCount, 'Chip comments', true)}
                                <span class="topBarIconButton topBarIconButtonDisabled" title="Chip information" aria-disabled="true">${chipInfoIcon}</span>`}
                    </span>
                </label>
                <label class="selector-field">
                    <span class="selector-field-label ui-section-label">Annotation</span>
                    <span class="selector-control">
                        <span class="annotation-picker">
                            <select id="annotationSelect" aria-label="Annotation" ?disabled=${!hasAnnotationOptions} @change=${(ev: Event) => this.uiSelectedAnnotation((<HTMLSelectElement>ev.target).selectedIndex + annotationOptionOffset)}>
                                ${hasAnnotationOptions ? annotationOptions : html`<option>No annotations</option>`}
                            </select>
                            ${this.annotation_current && this.annotation_current.aid > 0
                                ? html`<button type="button" class="chip-search-clear annotation-select-clear" title="Clear annotation selection" aria-label="Clear annotation selection" @click=${() => this.clearAnnotationSelection()}>${clearIcon}</button>`
                                : html``}
                        </span>
                        <button class="topBarIconButton" title="Refresh annotations" aria-label="Refresh annotations" @click="${() => this.refreshAnnotationList()}">${refreshIcon}</button>
                        ${this.renderCommentButton(this.annotationCommentTargetId, this.annotationCommentCount, 'Annotation comments', this.annotationCommentTargetId <= 0)}
                        ${this.canCreateAnnotation && this.chip_content_current
                            ? html`<button class="topBarIconButton" title="New annotation" aria-label="New annotation" @click=${() => this.requestNewAnnotation()}>${newAnnotationIcon}</button>`
                            : html``}
                    </span>
                </label>
                <div class="recentUpdatesCell">
                    <button class="topBarIconButton recentUpdatesButton" title="Recent updates" aria-label="Recent updates" @click=${() => this.openRecentUpdates()}>${recentUpdatesIcon}</button>
                </div>
            </div>
        `;
    }

    private renderAdvancedBrowser() {
        if (!this.advancedBrowserOpen) return html``;
        const chips = (this.chiplist_array || []).filter((item): item is Chip => !!item);
        const advancedName = this.advancedName.trim().toLowerCase();
        const matchesName = (item: Chip) => {
            const displayName = `${item.name} ${item.listname || ''}`.toLowerCase();
            return !advancedName || displayName.includes(advancedName);
        };
        const facetValues = (key: 'vendor' | 'type' | 'family') => Array.from(new Set(chips.filter(item => {
            return matchesName(item)
                && (key === 'vendor' || !this.advancedVendor || item.vendor === this.advancedVendor)
                && (key === 'type' || !this.advancedType || item.type === this.advancedType)
                && (key === 'family' || !this.advancedFamily || item.family === this.advancedFamily);
        }).map(item => item[key]).filter(Boolean))).sort();
        const advancedChips = chips.filter(item => {
            return matchesName(item)
                && (!this.advancedVendor || item.vendor === this.advancedVendor)
                && (!this.advancedType || item.type === this.advancedType)
                && (!this.advancedFamily || item.family === this.advancedFamily);
        }).sort((left, right) => {
            const leftValue = this.advancedSort === 'name' ? (left.listname || left.name || '') : this.advancedClassification(left);
            const rightValue = this.advancedSort === 'name' ? (right.listname || right.name || '') : this.advancedClassification(right);
            const result = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' });
            return this.advancedSortDirection === 'asc' ? result : -result;
        });
        const sortIndicator = (sort: 'name' | 'classification') => this.advancedSort === sort ? (this.advancedSortDirection === 'asc' ? ' ↑' : ' ↓') : '';

        return html`
                <div class="advanced-chip-overlay" role="presentation">
                    <button class="advanced-chip-backdrop" type="button" aria-label="Close advanced chip browser" @click=${() => this.closeAdvancedBrowser()}></button>
                    <section class="advanced-chip-modal" role="dialog" aria-modal="true" aria-labelledby="advanced-chip-title">
                        <header>
                            <div><h2 id="advanced-chip-title">Open Chip</h2><p>Filter the complete chip catalog, then click a row to open it.</p></div>
                            <button class="advanced-chip-close" type="button" aria-label="Close" @click=${() => this.closeAdvancedBrowser()}>×</button>
                        </header>
                        <div class="advanced-chip-filters">
                            <label><span>Name</span><input type="search" .value=${this.advancedName} @input=${(ev: Event) => { this.advancedName = (ev.target as HTMLInputElement).value; this.advancedSelectedChip = null; }} placeholder="Search chip name"></label>
                            <label><span>Vendor</span><select .value=${this.advancedVendor} @change=${(ev: Event) => this.setAdvancedFacet('vendor', (ev.target as HTMLSelectElement).value)}><option value="">All vendors</option>${facetValues('vendor').map(value => html`<option value=${value}>${value}</option>`)}</select></label>
                            <label><span>Type</span><select .value=${this.advancedType} @change=${(ev: Event) => this.setAdvancedFacet('type', (ev.target as HTMLSelectElement).value)}><option value="">All types</option>${facetValues('type').map(value => html`<option value=${value}>${value}</option>`)}</select></label>
                            <label><span>Family</span><select .value=${this.advancedFamily} @change=${(ev: Event) => this.setAdvancedFacet('family', (ev.target as HTMLSelectElement).value)}><option value="">All families</option>${facetValues('family').map(value => html`<option value=${value}>${value}</option>`)}</select></label>
                        </div>
                        <div class="advanced-chip-results" role="grid" aria-label="Chip results">
                            <div class="advanced-chip-row advanced-chip-head" role="row">
                                <button type="button" @click=${() => this.toggleAdvancedSort('name')}>Name${sortIndicator('name')}</button>
                                <button type="button" @click=${() => this.toggleAdvancedSort('classification')}>Vendor / Type / Family${sortIndicator('classification')}</button>
                            </div>
                            ${advancedChips.map(item => html`
                                <button type="button" role="row" class="advanced-chip-row ${this.advancedSelectedChip === item ? 'selected' : ''}"
                                    @click=${() => { this.advancedSelectedChip = item; this.confirmAdvancedChip(); }}>
                                    <strong>${item.listname || item.name}</strong><span>${this.advancedClassification(item) || '—'}</span>
                                </button>`)}
                            ${advancedChips.length ? html`` : html`<div class="advanced-chip-no-results">No chips match these filters.</div>`}
                        </div>
                        <footer><span>${advancedChips.length} results</span><button type="button" class="configButton" @click=${() => this.closeAdvancedBrowser()}>Cancel</button></footer>
                    </section>
                </div>`;
    }

    createRenderRoot() {
        return this;
    }

}

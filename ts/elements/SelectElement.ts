import { customElement, html, LitElement, property, TemplateResult } from 'lit-element';
import { Chip, ChipContent } from '../data/Chip';
import { NetUtil } from '../util/NetUtil';
import { Annotation, AnnotationContent, AnnotationData } from '../data/Annotation';
import { upgradeAnnotationData } from '../data/AnnotationDataUpgrade';
import { ClientApi } from '../data/ClientApi';
import { notifyToast } from '../util/Toast';
import { AppModal } from '../util/AppModal';

const commentIcon = html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4.5-1.1L3 20l1.3-4A8.3 8.3 0 0 1 3 11.5a8.4 8.4 0 0 1 9-8.5 8.4 8.4 0 0 1 9 8.5Z" />
    </svg>`;

const chipInfoIcon = html`
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5h.01" />
        <path d="M12 11v8" />
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

    @property({type: Number})
    chipCommentCount: number = null;
    @property({type: Number})
    annotationCommentCount: number = null;

    @property()
    annotation_current: Annotation;
    annotation_content_current: AnnotationContent;
    private annotationSelectionVersion = 0;
    private chipSelectionVersion = 0;
    @property()
    private chipQuery = '';
    @property({ type: Boolean })
    private chipPickerOpen = false;
    @property({ type: Boolean })
    private showAllChips = false;
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
        this.annotation_id_toload = parseInt(getUrlParam(url, '0', 'annotation', 'commentId'), 10);

        this.refreshChipList();

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
        this.chipPickerOpen = false;
        this.chipCommentCount = null;
        this.annotationCommentCount = null;
        if (this.onSelectChip) this.onSelectChip(chip);
        this.annotationlist_html = [];
        this.annotationlist_array = [];
        this.annotation_current = null;
        this.replaceUrl();

        if (chip) {
            this.loadChipCommentCount(chip.name, selectionVersion);
            SelectElement.fetchChipDetail(chip).then(chipDetail => {
                if (selectionVersion !== this.chipSelectionVersion) return;
                this.chip_content_current = chipDetail;
                if (this.onSelectChipContent) this.onSelectChipContent(chipDetail);
                let save = this.annotation_id_toload;
                this.selectedAnnotation(SelectElement.getDummyAnnotation());
                this.annotation_id_toload = save;
                this.replaceUrl();
                this.refreshAnnotationList();
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
    private refreshAnnotationList() {
        if (!this.canDiscardCurrent()) return;
        this.annotationlist_html = [];
        this.annotationlist_array = [];
        ClientApi.listAnnotationByChip(this.chip_content_current.name).then(annotations => {
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
        if (annotation && annotation.aid === 0) {
            (document.querySelector('.annotationCreateButton') as HTMLButtonElement)?.click();
            this.restoreAnnotationSelect();
            return;
        }
        this.selectedAnnotation(annotation);
    }
    private selectedAnnotation(annotation: Annotation) {
        const selectionVersion = ++this.annotationSelectionVersion;
        this.annotation_id_toload = annotation ? annotation.aid : 0;
        this.annotation_current = annotation;
        this.annotationCommentCount = null;
        if (annotation.aid > 0) {
            ClientApi.getAnnotationContent(annotation.aid).then(content => {
                if (selectionVersion !== this.annotationSelectionVersion) return;
                let data = upgradeAnnotationData(JSON.parse(content.content));
                if (this.onSelectAnnotation) this.onSelectAnnotation(annotation, data);
                this.loadAnnotationCommentCount(annotation, selectionVersion);
                this.replaceUrl();
            }).catch(error => {
                if (selectionVersion !== this.annotationSelectionVersion) return;
                SelectElement.warnNetwork('Could not load annotation content', error);
            });
        } else {
            if (this.onSelectAnnotation) this.onSelectAnnotation(annotation, AnnotationData.dummy());
            this.replaceUrl();
        }
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

    private loadChipCommentCount(chipName: string, selectionVersion: number) {
        ClientApi.getCommentCount(chipName, 0).then(count => {
            if (selectionVersion !== this.chipSelectionVersion || this.chip_current.name !== chipName) return;
            this.chipCommentCount = count;
        }).catch(error => {
            if (selectionVersion !== this.chipSelectionVersion) return;
            console.warn('Could not load chip comment count', error);
        });
    }

    private loadAnnotationCommentCount(annotation: Annotation, selectionVersion: number) {
        ClientApi.getCommentCount(annotation.chipName, annotation.aid).then(count => {
            if (selectionVersion !== this.annotationSelectionVersion || this.annotation_current !== annotation) return;
            this.annotationCommentCount = count;
        }).catch(error => {
            if (selectionVersion !== this.annotationSelectionVersion) return;
            console.warn('Could not load annotation comment count', error);
        });
    }

    private openComments(annotation: number) {
        const chip = this.chip_current;
        if (!chip) return;
        window.open(`comments.html?chip=${encodeURIComponent(chip.name)}&annotation=${annotation}`, '_blank', 'noopener');
    }

    private renderCommentButton(annotation: number, count: number, title: string, disabled: boolean) {
        return html`
            <button class="commentButton" ?disabled=${disabled} title=${title} aria-label=${title} @click=${() => this.openComments(annotation)}>
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

        options.push(html`<option>+ New Annotation</option>`);
        array.push(SelectElement.getDummyAnnotation());

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

        return { html: options, array: array, current: current }
    }

    render() {
        const chip = this.chip_content_current;
        const query = this.chipQuery.trim().toLowerCase();
        const chips = (this.chiplist_array || []).filter((item): item is Chip => !!item);
        const filteredChips = chips.filter(item => {
            const searchText = `${item.name} ${item.listname || ''} ${item.vendor || ''} ${item.type || ''} ${item.family || ''}`.toLowerCase();
            return !query || searchText.includes(query);
        });
        const quickChips = filteredChips.slice(0, this.showAllChips ? 80 : 8);
        const uniqueValues = (key: 'vendor' | 'type' | 'family') => Array.from(new Set(chips.map(item => item[key]).filter(Boolean))).sort();
        const advancedName = this.advancedName.trim().toLowerCase();
        const advancedChips = chips.filter(item => {
            const displayName = `${item.name} ${item.listname || ''}`.toLowerCase();
            return (!advancedName || displayName.includes(advancedName))
                && (!this.advancedVendor || item.vendor === this.advancedVendor)
                && (!this.advancedType || item.type === this.advancedType)
                && (!this.advancedFamily || item.family === this.advancedFamily);
        });

        return html`
            <div class="workspace-selectors">
                <label class="selector-field">
                    <span class="selector-field-label">Chip</span>
                    <span class="selector-control">
                        <span class="chip-picker">
                            <input id="chipSearch" type="search" aria-label="Search chip" autocomplete="off"
                                .value=${this.chipQuery || (this.chip_current ? this.chip_current.name : '')}
                                @focus=${() => { this.chipPickerOpen = true; }}
                                @blur=${() => window.setTimeout(() => { this.chipPickerOpen = false; }, 0)}
                                @input=${(ev: Event) => { this.chipQuery = (ev.target as HTMLInputElement).value; this.chipPickerOpen = true; this.showAllChips = false; }}
                                @keydown=${(ev: KeyboardEvent) => {
                                    if (ev.key === 'Escape') this.chipPickerOpen = false;
                                    if (ev.key === 'Enter' && quickChips.length === 1) this.selectedChip(quickChips[0]);
                                }}>
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
                                <button class="chipInfoButton chipBrowseButton" title="Advanced chip browser" aria-label="Advanced chip browser" @click=${() => this.openAdvancedBrowser()}>•••</button>
                                <button class="chipInfoButton" title="Chip information" aria-label="Chip information" @click=${() => this.openGlobalChipInfoModal()}>${chipInfoIcon}</button>`
                            : html`<span class="chipInfoButton chipInfoButtonDisabled" title="Chip information">${chipInfoIcon}</span>`}
                        ${this.renderCommentButton(0, this.chipCommentCount, 'Chip comments', !this.chip_current)}
                    </span>
                </label>
                <label class="selector-field">
                    <span class="selector-field-label">Annotation</span>
                    <span class="selector-control">
                        <select id="annotationSelect" aria-label="Annotation" @change=${(ev: Event) => this.uiSelectedAnnotation((<HTMLSelectElement>ev.target).selectedIndex)}>
                            ${this.annotationlist_html}
                        </select>
                        <button class="refreshButton" title="Refresh annotations" aria-label="Refresh annotations" @click="${() => this.refreshAnnotationList()}">\xA0</button>
                        ${this.renderCommentButton(this.annotation_current ? this.annotation_current.aid : 0, this.annotationCommentCount, 'Annotation comments', !this.annotation_current || this.annotation_current.aid <= 0)}
                    </span>
                </label>
            </div>
            ${this.advancedBrowserOpen ? html`
                <div class="advanced-chip-overlay" role="presentation">
                    <button class="advanced-chip-backdrop" type="button" aria-label="Close advanced chip browser" @click=${() => this.closeAdvancedBrowser()}></button>
                    <section class="advanced-chip-modal" role="dialog" aria-modal="true" aria-labelledby="advanced-chip-title">
                        <header>
                            <div><h2 id="advanced-chip-title">Open Chip</h2><p>Filter the complete chip catalog, select a row, then open it.</p></div>
                            <button class="advanced-chip-close" type="button" aria-label="Close" @click=${() => this.closeAdvancedBrowser()}>×</button>
                        </header>
                        <div class="advanced-chip-filters">
                            <label><span>Name</span><input type="search" .value=${this.advancedName} @input=${(ev: Event) => { this.advancedName = (ev.target as HTMLInputElement).value; this.advancedSelectedChip = null; }} placeholder="Search chip name"></label>
                            <label><span>Vendor</span><select .value=${this.advancedVendor} @change=${(ev: Event) => { this.advancedVendor = (ev.target as HTMLSelectElement).value; this.advancedSelectedChip = null; }}><option value="">All vendors</option>${uniqueValues('vendor').map(value => html`<option value=${value}>${value}</option>`)}</select></label>
                            <label><span>Type</span><select .value=${this.advancedType} @change=${(ev: Event) => { this.advancedType = (ev.target as HTMLSelectElement).value; this.advancedSelectedChip = null; }}><option value="">All types</option>${uniqueValues('type').map(value => html`<option value=${value}>${value}</option>`)}</select></label>
                            <label><span>Family</span><select .value=${this.advancedFamily} @change=${(ev: Event) => { this.advancedFamily = (ev.target as HTMLSelectElement).value; this.advancedSelectedChip = null; }}><option value="">All families</option>${uniqueValues('family').map(value => html`<option value=${value}>${value}</option>`)}</select></label>
                        </div>
                        <div class="advanced-chip-results" role="grid" aria-label="Chip results">
                            <div class="advanced-chip-row advanced-chip-head" role="row"><span>Name</span><span>Vendor</span><span>Type</span><span>Family</span></div>
                            ${advancedChips.map(item => html`
                                <button type="button" role="row" class="advanced-chip-row ${this.advancedSelectedChip === item ? 'selected' : ''}"
                                    @click=${() => { this.advancedSelectedChip = item; }} @dblclick=${() => { this.advancedSelectedChip = item; this.confirmAdvancedChip(); }}>
                                    <strong>${item.listname || item.name}</strong><span>${item.vendor || '—'}</span><span>${item.type || '—'}</span><span>${item.family || '—'}</span>
                                </button>`)}
                            ${advancedChips.length ? html`` : html`<div class="advanced-chip-no-results">No chips match these filters.</div>`}
                        </div>
                        <footer><span>${advancedChips.length} results</span><button type="button" class="configButton" @click=${() => this.closeAdvancedBrowser()}>Cancel</button><button type="button" class="configButton advanced-chip-open" ?disabled=${!this.advancedSelectedChip} @click=${() => this.confirmAdvancedChip()}>Open</button></footer>
                    </section>
                </div>` : html``}
        `;
    }

    createRenderRoot() {
        return this;
    }

}

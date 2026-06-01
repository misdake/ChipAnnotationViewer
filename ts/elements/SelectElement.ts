import { customElement, html, LitElement, property, TemplateResult } from 'lit-element';
import { Chip, ChipContent } from '../data/Chip';
import { NetUtil } from '../util/NetUtil';
import { Annotation, AnnotationContent, AnnotationData } from '../data/Annotation';
import { upgradeAnnotationData } from '../data/AnnotationDataUpgrade';
import { ClientApi } from '../data/ClientApi';

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
    private static readonly CHIP_INFO_MODAL_ID = "chip-info-modal-state";
    private static readonly CHIP_INFO_MODAL_ROOT_ID = "chip-info-modal-root";

    //↓↓↓↓↓ chip selection box ↓↓↓↓↓

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

    //↑↑↑↑↑ chip selection box ↑↑↑↑↑


    //↓↓↓↓↓ annotation selection box ↓↓↓↓↓

    annotation_id_toload: number;

    @property()
    annotationlist_html: TemplateResult[];
    annotationlist_array: Annotation[];

    @property()
    onSelectAnnotation: (annotation: Annotation, data: AnnotationData) => void;

    @property()
    annotation_current: Annotation;
    annotation_content_current: AnnotationContent;

    private static getDummyAnnotation: () => Annotation = () => ({ aid: 0, chipName: '', title: '', createTime: 0, updateTime: 0, userName: '', userId: 0 });

    //↑↑↑↑↑ annotation selection box ↑↑↑↑↑

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
        this.ensureGlobalChipInfoModal();

        window.addEventListener('chipannotation-annotation-created', (ev: Event) => {
            const custom = ev as CustomEvent<number>;
            if (!this.chip_content_current || !custom.detail) return;
            this.annotation_id_toload = custom.detail;
            this.refreshAnnotationList();
        });
    }

    private ensureGlobalChipInfoModal() {
        if (document.getElementById(SelectElement.CHIP_INFO_MODAL_ROOT_ID)) return;

        const root = document.createElement("div");
        root.id = SelectElement.CHIP_INFO_MODAL_ROOT_ID;
        root.innerHTML = `
            <input class="chipInfoModalState" id="${SelectElement.CHIP_INFO_MODAL_ID}" type="checkbox">
            <div class="chipInfoModalOverlay">
                <label class="chipInfoBackdrop" for="${SelectElement.CHIP_INFO_MODAL_ID}" aria-label="Close"></label>
                <div class="chipInfoModal" role="dialog" aria-modal="true" aria-label="Chip Information">
                    <div class="chipInfoModalHeader">
                        <h3>Chip Information</h3>
                        <label class="chipInfoCloseButton" for="${SelectElement.CHIP_INFO_MODAL_ID}" aria-label="Close">
                            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"></path>
                            </svg>
                        </label>
                    </div>
                    <div class="chipInfoModalBody">
                        <div class="chipInfoRow"><span class="chipInfoKey">Name</span><span id="chip-info-name" class="chipInfoValue"></span></div>
                        <div class="chipInfoRow"><span class="chipInfoKey">Type</span><span id="chip-info-vtf" class="chipInfoValue"></span></div>
                        <div class="chipInfoRow"><span class="chipInfoKey">Size (px)</span><span id="chip-info-size" class="chipInfoValue"></span></div>
                        <div id="chip-info-die-size-row" class="chipInfoRow" style="display:none;">
                            <span class="chipInfoKey">Die Size</span><span id="chip-info-die-size" class="chipInfoValue"></span>
                        </div>
                        <div id="chip-info-spec-row" class="chipInfoRow" style="display:none;">
                            <span class="chipInfoKey">Spec</span>
                            <a id="chip-info-spec" class="chipInfoValue chipInfoLink" target="_blank" href=""></a>
                        </div>
                        <div id="chip-info-author-row" class="chipInfoRow" style="display:none;">
                            <span class="chipInfoKey">Image Author</span>
                            <a id="chip-info-author" class="chipInfoValue chipInfoLink" target="_blank" href=""></a>
                        </div>
                        <div class="chipInfoRow">
                            <span class="chipInfoKey">Source</span>
                            <a id="chip-info-source" class="chipInfoValue chipInfoLink" target="_blank" href=""></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(root);
    }

    private openGlobalChipInfoModal() {
        const chip = this.chip_content_current;
        if (!chip) return;

        const nameElement = document.getElementById("chip-info-name");
        const vtfElement = document.getElementById("chip-info-vtf");
        const sizeElement = document.getElementById("chip-info-size");
        const sourceElement = document.getElementById("chip-info-source") as HTMLAnchorElement;
        const dieSizeRow = document.getElementById("chip-info-die-size-row");
        const dieSizeElement = document.getElementById("chip-info-die-size");
        const specRow = document.getElementById("chip-info-spec-row");
        const specElement = document.getElementById("chip-info-spec") as HTMLAnchorElement;
        const authorRow = document.getElementById("chip-info-author-row");
        const authorElement = document.getElementById("chip-info-author") as HTMLAnchorElement;
        const modalState = document.getElementById(SelectElement.CHIP_INFO_MODAL_ID) as HTMLInputElement;

        if (!nameElement || !vtfElement || !sizeElement || !sourceElement || !dieSizeRow || !dieSizeElement || !specRow || !specElement || !authorRow || !authorElement || !modalState) return;

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

        nameElement.textContent = chip.name || '';
        vtfElement.textContent = `${chip.vendor || ''} / ${chip.type || ''} / ${chip.family || ''}`;
        sizeElement.textContent = `${chip.width} x ${chip.height}`;
        sourceElement.textContent = sourceText;
        sourceElement.setAttribute("href", sourceText);
        sourceElement.setAttribute("title", sourceText);

        dieSizeRow.style.display = hasDieSize ? '' : 'none';
        if (hasDieSize) {
            dieSizeElement.textContent = `${fmt(dieAreaMm2)} mm², ${fmt(widthMm)} mm x ${fmt(heightMm)} mm`;
        } else {
            dieSizeElement.textContent = '';
        }

        specRow.style.display = specUrl ? '' : 'none';
        if (specUrl) {
            specElement.textContent = specUrl;
            specElement.setAttribute("href", specUrl);
            specElement.setAttribute("title", specUrl);
        } else {
            specElement.textContent = '';
            specElement.setAttribute("href", '');
            specElement.setAttribute("title", '');
        }

        authorRow.style.display = hasAuthor ? '' : 'none';
        if (hasAuthor) {
            authorElement.textContent = authorName;
            if (authorUrl) {
                authorElement.setAttribute("href", authorUrl);
                authorElement.setAttribute("title", authorUrl);
                authorElement.style.pointerEvents = '';
            } else {
                authorElement.setAttribute("href", '');
                authorElement.setAttribute("title", authorName);
                authorElement.style.pointerEvents = 'none';
            }
        } else {
            authorElement.textContent = '';
            authorElement.setAttribute("href", '');
            authorElement.setAttribute("title", '');
            authorElement.style.pointerEvents = '';
        }

        modalState.checked = true;
    }

    //load chip list

    private refreshChipList() {
        SelectElement.fetchChipList().then(chips => {
            let { html, array, current } = SelectElement.showChipList(chips, this.chip_name_toload);
            this.chip_current = current;
            this.chiplist_html = html;
            this.chiplist_array = array;
            if (current) this.selectedChip(current);
        });
    }
    private static fetchChipList(): Promise<Chip[]> {
        return new Promise<Chip[]>(resolve => {
            NetUtil.get('https://chip.rgbuv.xyz/list.json', text => {
                let chips = JSON.parse(text) as Chip[];
                resolve(chips);
            });
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
        let chip = this.chiplist_array[index];
        if (chip) {
            this.selectedChip(chip);
        }
    }
    private selectedChip(chip: Chip) {
        this.chip_name_toload = chip ? chip.name : '';
        this.chip_current = chip;
        if (this.onSelectChip) this.onSelectChip(chip);
        this.annotationlist_html = [];
        this.annotationlist_array = [];
        this.annotation_current = null;
        this.replaceUrl();

        if (chip) {
            SelectElement.fetchChipDetail(chip).then(chipDetail => {
                this.chip_content_current = chipDetail;
                if (this.onSelectChipContent) this.onSelectChipContent(chipDetail);
                let save = this.annotation_id_toload;
                this.selectedAnnotation(SelectElement.getDummyAnnotation());
                this.annotation_id_toload = save;
                this.replaceUrl();
                this.refreshAnnotationList();
            });
        }
    }
    private refreshAnnotationList() {
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
        });
    }

    //select annotation

    private uiSelectedAnnotation(index: number) {
        let annotation = this.annotationlist_array[index];
        this.selectedAnnotation(annotation);
    }
    private selectedAnnotation(annotation: Annotation) {
        this.annotation_id_toload = annotation ? annotation.aid : 0;
        this.annotation_current = annotation;
        if (annotation.aid > 0) {
            //TODO solve async
            ClientApi.getAnnotationContent(annotation.aid).then(content => {
                let data = upgradeAnnotationData(JSON.parse(content.content));
                if (this.onSelectAnnotation) this.onSelectAnnotation(annotation, data);
                this.replaceUrl();
            });
        } else {
            if (this.onSelectAnnotation) this.onSelectAnnotation(annotation, AnnotationData.dummy());
            this.replaceUrl();
        }
    }

    private static fetchChipDetail(chip: Chip): Promise<ChipContent> {
        return new Promise<ChipContent>(resolve => {
            NetUtil.get(chip.url + '/content.json', json => {
                let chipContent: ChipContent = JSON.parse(json) as ChipContent;
                chipContent.baseUrl = chip.url;
                resolve(chipContent);
            });
        });
    }
    private static showAnnotationList(annotations: Annotation[], annotation_current_id: number): { html: TemplateResult[], array: Annotation[], current: Annotation } {
        let options: TemplateResult[] = [];
        let array: Annotation[] = [];

        options.push(html`
            <option>(annotation count: ${annotations.length})</option>`);
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

        return html`
            <div style="display:flex; align-items:center; width:100%; max-width:100%; min-width:0; white-space:nowrap; overflow:hidden;">
                <select @change=${(ev: Event) => this.uiSelectedChip((<HTMLSelectElement>ev.target).selectedIndex)}>
                    ${this.chiplist_html}
                </select>
                ${chip
                ? html`<button class="chipInfoButton" style="margin-left:1px;" title="Chip Information" @click=${() => this.openGlobalChipInfoModal()}>i</button>`
                : html`<span class="chipInfoButton chipInfoButtonDisabled" style="margin-left:1px;" title="Chip Information">i</span>`
            }
                <select style="margin-left:8px;" @change=${(ev: Event) => this.uiSelectedAnnotation((<HTMLSelectElement>ev.target).selectedIndex)}>
                    ${this.annotationlist_html}
                </select>
                <button class="refreshButton" style="margin-left:1px;" @click="${() => this.refreshAnnotationList()}">\xA0</button>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

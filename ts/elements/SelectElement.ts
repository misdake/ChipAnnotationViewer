import {customElement, html, LitElement, property, TemplateResult} from "lit-element";
import {Chip, Map} from "../data/Map";
import {NetUtil} from "../util/NetUtil";
import {Annotation, Data} from "../data/Data";
import {Github} from "../util/GithubUtil";

@customElement('select-element')
export class SelectElement extends LitElement {

    //↓↓↓↓↓ chip selection box ↓↓↓↓↓

    chip_name_toload: string;

    @property()
    chiplist_html: TemplateResult[];
    chiplist_array: Chip[];

    chip_current: Chip;
    @property()
    onSelectChip: (chip: Chip) => void;

    @property()
    map_current: Map;

    @property()
    onSelectMap: (map: Map) => void;

    //↑↑↑↑↑ chip selection box ↑↑↑↑↑


    //↓↓↓↓↓ annotation selection box ↓↓↓↓↓

    annotation_id_toload: number;

    @property()
    annotationlist_html: TemplateResult[];
    annotationlist_array: Annotation[];

    @property()
    onSelectAnnotation: (annotation: Annotation) => void;

    @property()
    annotation_current: Annotation;

    private static dummyAnnotation: Annotation = {id: 0, user: "", content: {title: "", polylines: [], texts: []}};

    //↑↑↑↑↑ annotation selection box ↑↑↑↑↑

    private replaceUrl() {
        let url = window.location.pathname + '?map=' + encodeURIComponent(this.chip_current.name);
        if (this.annotation_current && this.annotation_current.id > 0) url += '&commentId=' + this.annotation_current.id;
        history.replaceState(null, "", url);
    }

    protected firstUpdated(): void {
        let url_string = window.location.href;
        let url = new URL(url_string);
        this.chip_name_toload = (url.searchParams.get("map") && decodeURIComponent(url.searchParams.get("map")) )|| "Fiji";
        this.annotation_id_toload = parseInt(url.searchParams.get("commentId") || "0");

        this.refreshChipList();
    }

    private selectedChip(chip: Chip) {
        this.chip_name_toload = chip ? chip.name : "";
        this.chip_current = chip;
        if (this.onSelectChip) this.onSelectChip(chip);
        this.annotationlist_html = [];
        this.annotationlist_array = [];
        this.annotation_current = null;
        this.replaceUrl();

        if (chip) {
            SelectElement.fetchMap(chip).then(map => {
                this.map_current = map;
                if (this.onSelectMap) this.onSelectMap(map);
                let save = this.annotation_id_toload;
                this.selectedAnnotation(SelectElement.dummyAnnotation);
                this.annotation_id_toload = save;
                this.replaceUrl();
                this.refreshAnnotationList();
            })
        }
    }
    private selectedAnnotation(annotation: Annotation) {
        this.annotation_id_toload = annotation ? annotation.id : 0;
        this.annotation_current = annotation;
        if (this.onSelectAnnotation) this.onSelectAnnotation(annotation);
        this.replaceUrl();
    }

    private uiSelectedChip(index: number) {
        let chip = this.chiplist_array[index];
        if (chip) {
            this.selectedChip(chip);
        }
    }
    private refreshChipList() {
        SelectElement.fetchChipList().then(chips => {
            let {html, array, current} = SelectElement.showChipList(chips, this.chip_name_toload);
            this.chip_current = current;
            this.chiplist_html = html;
            this.chiplist_array = array;
            if (current) this.selectedChip(current);
        });
    }

    private uiSelectedAnnotation(index: number) {
        let annotation = this.annotationlist_array[index];
        this.selectedAnnotation(annotation);
        NetUtil.count(this.chip_current.name, annotation.id);
    }
    private refreshAnnotationList() {
        this.annotationlist_html = [];
        this.annotationlist_array = [];
        SelectElement.fetchAnnotationList(this.map_current).then(annotations => {
            let {html, array, current} = SelectElement.showAnnotationList(annotations, this.annotation_id_toload);
            this.annotation_current = current;
            this.annotationlist_html = html;
            this.annotationlist_array = array;

            if (current) {
                this.selectedAnnotation(current);
                NetUtil.count(this.chip_current.name, current.id);
            } else {
                this.selectedAnnotation(SelectElement.dummyAnnotation);
                NetUtil.count(this.chip_current.name, 0);
            }
        });
    }


    private static async fetchChipList(): Promise<Chip[]> {
        return new Promise<Chip[]>(resolve => {
            NetUtil.get("https://misdake.github.io/ChipAnnotationList/list.json", text => {
                let chips = JSON.parse(text) as Chip[];
                resolve(chips);
            });
        });
    }
    private static showChipList(chips: Chip[], chip_current_name: string): { html: TemplateResult[], array: Chip[], current: Chip } {
        let name_chip: { [key: string]: Chip } = {};

        let selections: TemplateResult[] = [];
        let selection_chip: Chip[] = [];

        let sortMap: { [key: string]: Chip } = {};
        let sortKeys: string[] = [];

        if (chips && chips.length) {
            for (let chip of chips) {
                let id = `${chip.vendor} ${chip.type} ${chip.family} ${chip.name}`;
                sortKeys.push(id);
                sortMap[id] = chip;

                name_chip[chip.name] = chip;
            }
        }

        let current: Chip = null;
        sortKeys.sort();
        let last_VenderType = "";
        let last_Family = "";
        for (let key of sortKeys) {
            let chip = sortMap[key];
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

        return {html: selections, array: selection_chip, current: current};
    }

    private static fetchMap(chip: Chip): Promise<Map> {
        return new Promise<Map>(resolve => {
            NetUtil.get(chip.url + "/content.json", mapDesc => {
                let map: Map = JSON.parse(mapDesc) as Map;
                resolve(map);
            });
        });
    }

    private static fetchAnnotationList(map: Map): Promise<Annotation[]> {
        return new Promise<Annotation[]>((resolve, reject) => {
            if (map && map.githubRepo && map.githubIssueId) {
                Github.getComments(map.githubRepo, map.githubIssueId, comments => {
                    let result: Annotation[] = [];
                    for (let comment of comments) {
                        try {
                            let data: Data = JSON.parse(comment.body);
                            if (data.polylines != null && data.texts != null) {
                                if (data.title == null || data.title == "") {
                                    data.title = "untitled";
                                }
                                result.push({id: comment.id, user: comment.user.login, content: data});
                            }
                        } catch (e) {
                        }
                    }
                    resolve(result);
                });
            } else {
                reject();
            }
        });
    }
    private static showAnnotationList(annotations: Annotation[], annotation_current_id: number): { html: TemplateResult[], array: Annotation[], current: Annotation } {
        let options: TemplateResult[] = [];
        let array: Annotation[] = [];

        options.push(html`<option>(annotation count: ${annotations.length})</option>`);
        array.push(SelectElement.dummyAnnotation);

        let current: Annotation = null;
        for (let annotation of annotations) {
            let data = annotation.content;
            if (data.polylines != null && data.texts != null) {
                if (data.title == null || data.title == "") {
                    data.title = "untitled";
                }

                if (annotation_current_id === annotation.id) {
                    current = annotation;
                    options.push(html`<option selected>${data.title} @${annotation.user}</option>`);
                } else {
                    options.push(html`<option>${data.title} @${annotation.user}</option>`);
                }
                array.push(annotation);
            }
        }

        return {html: options, array: array, current: current}
    }

    render() {
        let source = this.map_current ? html`<a id="imageSource" target="_blank" href="${this.map_current.source}">${this.map_current.source}</a>` : html``;

        return html`
            <div style="max-width: 100%">
                <select @change=${(ev: Event) => this.uiSelectedChip((<HTMLSelectElement>ev.target).selectedIndex)}>
                    ${this.chiplist_html}
                </select>
                <select @change=${(ev: Event) => this.uiSelectedAnnotation((<HTMLSelectElement>ev.target).selectedIndex)}>
                    ${this.annotationlist_html}
                </select>
                <button class="refreshButton" @click="${() => this.refreshAnnotationList()}">\xA0</button>
            </div>
            <div style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
                ${source}
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}

import {customElement, html, LitElement, property, TemplateResult} from "lit-element";
import {Chip, Map} from "../data/Map";
import {NetUtil} from "../util/NetUtil";
import {Data} from "../data/Data";

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

    //↑↑↑↑↑ chip selection box ↑↑↑↑↑

    //TODO annotation related
    //↓↓↓↓↓ annotation selection box ↓↓↓↓↓

    @property()
    annotationlist_html: TemplateResult[];
    annotationlist_array: Data[];

    @property()
    onSelectAnnotation: (annotation: Data) => void;

    annotation_current: Data;

    //↑↑↑↑↑ annotation selection box ↑↑↑↑↑

    protected firstUpdated(): void {
        let url_string = window.location.href;
        let url = new URL(url_string);
        let mapName = url.searchParams.get("map") || "Fiji";
        this.chip_name_toload = mapName;
        // let commentIdString = url.searchParams.get("commentId") || "0";
        // this.currentCommentId = parseInt(commentIdString);

        this.refreshChipList().then(chip_current => {
            this.selectedChip(chip_current);
        });
    }

    private selectedChip(chip: Chip) {
        this.onSelectChip(chip);
        this.chip_current = chip;

        this.map_current = null;
        if (chip) {
            SelectElement.fetchChip(chip).then(map => {
                this.map_current = map;
            })
        }

        //TODO this.annotation_array ... = null;
    }

    private uiSelectedChip(index: number) {
        this.selectedChip(this.chiplist_array[index]);
    }
    private refreshChipList(): Promise<Chip> {
        return SelectElement.fetchChipList().then(chips => {
            let {html, array, current} = SelectElement.showChipList(chips, this.chip_name_toload);
            this.chip_current = current;
            this.chiplist_html = html;
            this.chiplist_array = array;
            return current;
        });
    }

    private static async fetchChipList(): Promise<Chip[]> {
        return new Promise<Chip[]>(resolve => {
            NetUtil.get("https://misdake.github.io/ChipAnnotationData/list.json", text => {
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
                selections.push(html`<option selected>\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0${chip.name}</option>`);
            } else {
                selections.push(html`<option>\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0${chip.name}</option>`);
            }
            selection_chip.push(chip);

            last_VenderType = curr_VenderType;
            last_Family = curr_Family;
        }

        return {html: selections, array: selection_chip, current: current};
    }

    private static fetchChip(chip: Chip): Promise<Map> {
        return new Promise<Map>(resolve => {
            NetUtil.get(chip.url + "/content.json", mapDesc => {
                let map: Map = JSON.parse(mapDesc) as Map;
                resolve(map);
            });
        });
    }

    fetchAnnotationList() {

    }
    showAnnotationList() {

    }

    selectedAnnotation() {

    }

    render() {
        let source = this.map_current ? html`<a id="imageSource" target="_blank" href="${this.map_current.source}" style="overflow:hidden">${this.map_current.source}</a>` : html``;

        return html`
            <select @change=${(ev: Event) => this.uiSelectedChip((<HTMLSelectElement>ev.target).selectedIndex)}>
                ${this.chiplist_html}
            </select>
            ${source}
            <br>
<!--            <select id="dataSelect"></select>-->
        `;
    }

    createRenderRoot() {
        return this;
    }

}
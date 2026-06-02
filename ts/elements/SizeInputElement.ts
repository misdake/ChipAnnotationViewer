import { css, customElement, html, LitElement, property } from "lit-element";
import "./NumberInputElement";

@customElement("size-input")
export class SizeInputElement extends LitElement {
    @property()
    screen: number | undefined;

    @property()
    image: number | undefined;

    @property()
    setScreen: (value: number) => void;

    @property()
    setImage: (value: number) => void;

    static override styles = css`
        :host {
            display: block;
        }

        .sizeRow {
            display: flex;
            align-items: center;
            flex-wrap: nowrap;
            gap: 5px;
            margin: 6px 0;
        }

        label {
            color: #94a3b8;
            font-size: 12px;
            white-space: nowrap;
        }

        .separator {
            width: 1px;
            height: 18px;
            margin: 0 2px;
            background: #475569;
        }
    `;

    render() {
        return html`
            <div class="sizeRow">
                <label>Screen</label>
                <number-input
                    .value=${this.screen}
                    .min=${0}
                    .compact=${true}
                    .onChange=${(value: number) => this.setScreen(value)}
                ></number-input>
                <label>px</label>
                <span class="separator"></span>
                <label>Image</label>
                <number-input
                    .value=${this.image}
                    .min=${0}
                    .compact=${true}
                    .onChange=${(value: number) => this.setImage(value)}
                ></number-input>
                <label>px</label>
            </div>
        `;
    }
}

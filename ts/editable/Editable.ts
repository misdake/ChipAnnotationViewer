import {Drawable} from "../drawable/Drawable";
import {TemplateResult} from "lit-html/lib/template-result";

export abstract class Editable extends Drawable {

    

    abstract renderEditor() : TemplateResult;

}
import {Canvas} from "../Canvas";
import {Camera} from "../Camera";
import {Renderer} from "../Renderer";

export interface Drawable {

    render(canvas: Canvas, renderer: Renderer, camera: Camera): void;

}
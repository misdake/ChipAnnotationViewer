import {Editor, Usage} from "./Editor";
import {MouseIn, MouseListener} from "../MouseListener";
import {EditorName} from "./Editors";
import {Canvas} from "../Canvas";
import {DrawablePolyline} from "../editable/DrawablePolyline";
import {Selection, SelectType} from "../layers/Selection";
import {Env} from "../Env";
import {Renderer} from "../Renderer";
import {DrawableText} from "../editable/DrawableText";
import {Drawable} from "../drawable/Drawable";
import {EditablePick} from "../editable/Editable";
import {Camera} from "../Camera";

export class EditorSelect extends Editor {

    constructor(canvas: Canvas) {
        super(EditorName.SELECT, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("left click polygon/text to select"),
            Editor.usage("hold ctrl and left click to select another"),
            Editor.usage("hold ctrl and drag to select along"),
        ];
    }

    enter(env: Env): void {
        let self = this;

        this._mouseListener = new class extends MouseListener {
            private moved = false;
            onmousedown(event: MouseIn): boolean {
                this.moved = false;
                return false;
            }
            onmouseup(event: MouseIn): boolean {
                if (event.button == 0 && !this.moved) {
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;

                    let {item, type} = self.pickAny(x, y, env);
                    if (item) {
                        if (!event.ctrlKey) {
                            Selection.select(type, item);
                            return true;
                        } else {
                            let current = Selection.getSelected();
                            let currentType = current.type;

                            if (!currentType) { //nothing selected
                                Selection.select(type, item);
                                return true;

                            } else if (currentType === SelectType.MULTIPLE) { //multiple selected
                                let array = <(Drawable & EditablePick)[]>current.item;
                                let index = array.indexOf(item);
                                if (index >= 0) { //deselecting existing
                                    array.splice(index, 1); //remove this
                                    if (array.length === 0) { //deselected everything
                                        Selection.deselectAny();
                                        return true;
                                    } else if (array.length === 1) { //only one left
                                        Selection.select(array[0].pickType, array[0]);
                                        return true;
                                    } else { //update current array
                                        Selection.select(SelectType.MULTIPLE, array);
                                        return true;
                                    }
                                } else { //select new
                                    array.push(item);
                                    Selection.select(SelectType.MULTIPLE, array);
                                    return true;
                                }

                            } else {
                                if (current.item !== item) { //selected a second
                                    Selection.select(SelectType.MULTIPLE, [<Drawable>current.item, item]);
                                    return true;
                                } else { //deselected that
                                    Selection.deselectAny();
                                    return true;
                                }
                            }
                        }
                    }

                    Selection.deselectAny();
                    return false;
                } else {
                    return false;
                }
            }
            onmousemove(event: MouseIn): boolean {
                if (event.buttons & 1) {
                    this.moved = true;

                    if (event.ctrlKey) {
                        let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        let x = canvasXY.x, y = canvasXY.y;

                        let current = Selection.getSelected();
                        let currentType = current.type;

                        let exclude: (Drawable & EditablePick)[] = [];
                        switch (currentType) {
                            case SelectType.POLYLINE:
                            case SelectType.TEXT:
                                exclude = [<(Drawable & EditablePick)>current.item];
                                break;
                            case SelectType.MULTIPLE:
                                exclude = <(Drawable & EditablePick)[]>current.item;
                                break;
                        }

                        let picked = self.pickAll(x, y, env, undefined, exclude);

                        if (picked.length) {
                            if(exclude.length === 0 && picked.length === 1) {
                                let item = picked[0];
                                Selection.select(item.pickType, item);
                            } else {
                                exclude.push(...picked); //try to change the original array for MULTIPLE, so EditorMultiple will continue to work.
                                Selection.select(SelectType.MULTIPLE, exclude);
                            }
                        }

                        return true;
                    }
                }
                return false;
            }
            ondblclick(event: MouseIn): boolean {
                if (event.button == 0) {
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;
                    let {item, type} = self.pickAny(x, y, env);
                    if (type === SelectType.TEXT) { //double click a text with link to open link
                        let text = <DrawableText>item;
                        if (text.link) {
                            window.open(text.link, "_blank");
                            return false;
                        }
                    }
                }
                return true;
            }
        };
    }

    exit(env: Env): void {
    }


    //pick

    private static pickPolyline(x: number, y: number, camera: Camera, polylines: DrawablePolyline[]): DrawablePolyline {
        let radius = camera.screenSizeToCanvas(5);
        let picked: DrawablePolyline = null;
        for (let polyline of polylines) {
            let pickPointIndex = polyline.picker.pickPoint(x, y, radius);
            let pickLine = polyline.picker.pickLine(x, y, radius);
            let pickShape = polyline.picker.pickShape(x, y, radius);
            if (pickPointIndex != null || pickLine || pickShape) {
                picked = polyline;
            }
        }
        return picked;
    }

    private static pickText(x: number, y: number, camera: Camera, texts: DrawableText[]): DrawableText {
        let radius = camera.screenSizeToCanvas(5);
        let picked: DrawableText = null;
        for (let text of texts) {
            let pick = text.pick(x, y, radius);
            if (pick) picked = text;
        }
        return picked;
    }

    public pickAll(x: number, y: number, env: Env, candidates?: EditablePick[], exclude?: EditablePick[]): (Drawable & EditablePick)[] {
        let texts = env.texts;
        let polylines = env.polylines;
        if (candidates) {
            polylines = [];
            texts = [];
            for (let d of candidates) {
                if (d.pickType === SelectType.POLYLINE) {
                    polylines.push(<DrawablePolyline>d);
                }
                if (d.pickType === SelectType.TEXT) {
                    texts.push(<DrawableText>d);
                }
            }
        }

        let result = [];
        let radius = env.camera.screenSizeToCanvas(5);

        for (let text of texts) if (text.pick(x, y, radius)) result.push(text);
        for (let polyline of polylines) if (polyline.pick(x, y, radius)) result.push(polyline);

        if (exclude) {
            result = result.filter(value => exclude.indexOf(value) < 0);
        }

        return result;
    };

    public pickAny(x: number, y: number, env: Env, candidates?: EditablePick[]): { item: Drawable & EditablePick, type: SelectType } {
        let texts = env.texts;
        let polylines = env.polylines;
        if (candidates) {
            polylines = [];
            texts = [];
            for (let d of candidates) {
                if (d.pickType === SelectType.POLYLINE) {
                    polylines.push(<DrawablePolyline>d);
                }
                if (d.pickType === SelectType.TEXT) {
                    texts.push(<DrawableText>d);
                }
            }
        }

        //text first
        let text = EditorSelect.pickText(x, y, env.camera, texts);
        if (text) {
            return {item: text, type: SelectType.TEXT};
        }

        //polyline next
        let polyline = EditorSelect.pickPolyline(x, y, env.camera, polylines);
        if (polyline) {
            return {item: polyline, type: SelectType.POLYLINE};
        }

        return {item: undefined, type: undefined};
    };


    //render

    render(env: Env): void {
        let {item: item, type: type} = Selection.getSelected();
        switch (type) {
            case SelectType.POLYLINE:
            case SelectType.POLYLINE_CREATE:
                this.drawSelectedPolyline(<DrawablePolyline>item, env.renderer);
                break;
            case SelectType.TEXT:
                this.drawSelectedText(<DrawableText>item, env.renderer);
                break;
            case SelectType.MULTIPLE:
                for (let drawable of (<EditablePick[]><unknown>item)) {
                    switch (drawable.pickType) {
                        case SelectType.POLYLINE:
                            this.drawSelectedPolyline(<DrawablePolyline>drawable, env.renderer);
                            break;
                        case SelectType.TEXT:
                            this.drawSelectedText(<DrawableText>drawable, env.renderer);
                            break;
                    }
                }
                break;
        }
    }

    private drawSelectedPolyline(polyline: DrawablePolyline, renderer: Renderer) {
        let drawPointCircle = (x: number, y: number, renderer: Renderer) => {
            let position = this.camera.canvasToScreen(x, y);
            renderer.setColor("rgba(255,255,255,1)");
            renderer.drawCircle(position.x, position.y, 5, false, true, 1);
            renderer.setColor("rgba(0,0,0,0.5)");
            renderer.drawCircle(position.x, position.y, 4, true, false);
        };
        polyline.editor.forEachPoint((x, y) => {
            drawPointCircle(x, y, renderer);
        });
    }

    private drawSelectedText(text: DrawableText, renderer: Renderer) {
        renderer.setColor(text.colorString);
        let aabb = text.validateCanvasAABB(this.camera, renderer);
        let p1 = this.camera.canvasToScreen(aabb.x1, aabb.y1);
        let p2 = this.camera.canvasToScreen(aabb.x2, aabb.y2);
        renderer.drawRect(
            p1.x - 5, p1.y - 5, p2.x + 5, p2.y + 5,
            false, true, 2
        );
    }

}

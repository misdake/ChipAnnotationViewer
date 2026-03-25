import { Editor, Usage } from "./Editor";
import { MouseIn, MouseListener } from "../MouseListener";
import { EditorName } from "./Editors";
import { Canvas } from "../Canvas";
import { DrawablePolyline } from "../editable/DrawablePolyline";
import { Selection, SelectType } from "../layers/Selection";
import { Env } from "../Env";
import { Renderer } from "../Renderer";
import { DrawableText } from "../editable/DrawableText";
import { Drawable } from "../drawable/Drawable";
import { EditablePick } from "../editable/Editable";
import { Camera } from "../Camera";

export class EditorSelect extends Editor {

    private dragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private dragCurrentX = 0;
    private dragCurrentY = 0;
    private previewSelection: (Drawable & EditablePick)[] = [];

    constructor(canvas: Canvas) {
        super(EditorName.SELECT, canvas);
    }

    usages(): Usage[] {
        return [
            Editor.usage("left click to select"),
            Editor.usage("hold ctrl and left click to select another"),
            Editor.usage("left click and drag to select multiple"),
        ];
    }

    enter(env: Env): void {
        let self = this;

        this._mouseListener = new class extends MouseListener {
            onmousedown(event: MouseIn): boolean {
                if (event.button == 0) {
                    self.dragging = false;
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    self.dragStartX = canvasXY.x;
                    self.dragStartY = canvasXY.y;
                    self.dragCurrentX = canvasXY.x;
                    self.dragCurrentY = canvasXY.y;
                    return true;
                }
                return false;
            }
            onmouseup(event: MouseIn): boolean {
                if (event.button == 0) {
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;

                    if (self.dragging) {
                        let selected = self.previewSelection;

                        if (selected.length > 0) {
                            if (!event.ctrlKey) {
                                if (selected.length === 1) {
                                    Selection.select(selected[0].pickType, selected[0]);
                                } else {
                                    Selection.select(SelectType.MULTIPLE, selected);
                                }
                            } else {
                                let current = Selection.getSelected();
                                let currentType = current.type;
                                if (!currentType) {
                                    if (selected.length === 1) {
                                        Selection.select(selected[0].pickType, selected[0]);
                                    } else {
                                        Selection.select(SelectType.MULTIPLE, selected);
                                    }
                                } else if (currentType === SelectType.MULTIPLE) {
                                    let array = <(Drawable & EditablePick)[]>current.item;
                                    for (let item of selected) {
                                        if (array.indexOf(item) < 0) {
                                            array.push(item);
                                        }
                                    }
                                    Selection.select(SelectType.MULTIPLE, array);
                                } else {
                                    let newArray: (Drawable & EditablePick)[] = [<Drawable & EditablePick>current.item];
                                    for (let item of selected) {
                                        if (newArray.indexOf(item) < 0) {
                                            newArray.push(item);
                                        }
                                    }
                                    Selection.select(SelectType.MULTIPLE, newArray);
                                }
                            }
                        }

                        self.dragging = false;
                        self.previewSelection = [];
                        return true;
                    } else {
                        let { item, type } = self.pickAny(x, y, env);
                        if (item) {
                            if (!event.ctrlKey) {
                                Selection.select(type, item);
                                return true;
                            } else {
                                let current = Selection.getSelected();
                                let currentType = current.type;

                                if (!currentType) {
                                    Selection.select(type, item);
                                    return true;

                                } else if (currentType === SelectType.MULTIPLE) {
                                    let array = <(Drawable & EditablePick)[]>current.item;
                                    let index = array.indexOf(item);
                                    if (index >= 0) {
                                        array.splice(index, 1);
                                        if (array.length === 0) {
                                            Selection.deselectAny();
                                            return true;
                                        } else if (array.length === 1) {
                                            Selection.select(array[0].pickType, array[0]);
                                            return true;
                                        } else {
                                            Selection.select(SelectType.MULTIPLE, array);
                                            return true;
                                        }
                                    } else {
                                        array.push(item);
                                        Selection.select(SelectType.MULTIPLE, array);
                                        return true;
                                    }

                                } else {
                                    if (current.item !== item) {
                                        Selection.select(SelectType.MULTIPLE, [<Drawable>current.item, item]);
                                        return true;
                                    } else {
                                        Selection.deselectAny();
                                        return true;
                                    }
                                }
                            }
                        }

                        Selection.deselectAny();
                        return false;
                    }
                }
                return false;
            }
            onmousemove(event: MouseIn): boolean {
                if (event.buttons & 1) {
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;

                    if (Math.abs(x - self.dragStartX) > 3 || Math.abs(y - self.dragStartY) > 3) {
                        self.dragging = true;
                    }

                    if (self.dragging) {
                        self.dragCurrentX = x;
                        self.dragCurrentY = y;

                        let startX = self.dragStartX;
                        let startY = self.dragStartY;
                        let endX = self.dragCurrentX;
                        let endY = self.dragCurrentY;

                        let minX = Math.min(startX, endX);
                        let maxX = Math.max(startX, endX);
                        let minY = Math.min(startY, endY);
                        let maxY = Math.max(startY, endY);

                        self.previewSelection = [];

                        for (let text of env.texts) {
                            let aabb = self.getAABB(text);
                            if (aabb) {
                                let partiallyContained = !(aabb.x2 < minX || aabb.x1 > maxX || aabb.y2 < minY || aabb.y1 > maxY);
                                if (partiallyContained) {
                                    self.previewSelection.push(text);
                                }
                            }
                        }

                        for (let polyline of env.polylines) {
                            let aabb = self.getAABB(polyline);
                            if (aabb) {
                                let partiallyContained = !(aabb.x2 < minX || aabb.x1 > maxX || aabb.y2 < minY || aabb.y1 > maxY);
                                if (partiallyContained) {
                                    self.previewSelection.push(polyline);
                                }
                            }
                        }

                        self.canvas.requestRender();
                        return true;
                    }
                }
                return false;
            }
            ondblclick(event: MouseIn): boolean {
                if (event.button == 0) {
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;
                    let { item, type } = self.pickAny(x, y, env);
                    if (type === SelectType.TEXT) {
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
            return { item: text, type: SelectType.TEXT };
        }

        //polyline next
        let polyline = EditorSelect.pickPolyline(x, y, env.camera, polylines);
        if (polyline) {
            return { item: polyline, type: SelectType.POLYLINE };
        }

        return { item: undefined, type: undefined };
    };

    public getAABB(item: Drawable & EditablePick): { x1: number, y1: number, x2: number, y2: number } {
        switch (item.pickType) {
            case SelectType.TEXT:
                let text = <DrawableText>item;
                return text.validateCanvasAABB(this.camera, null);
            case SelectType.POLYLINE:
                let polyline = <DrawablePolyline>item;
                let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
                polyline.editor.forEachPoint((x: number, y: number) => {
                    if (x < x1) x1 = x;
                    if (y < y1) y1 = y;
                    if (x > x2) x2 = x;
                    if (y > y2) y2 = y;
                });
                return { x1, y1, x2, y2 };
        }
        return null;
    }


    //render

    render(env: Env): void {
        let { item: item, type: type } = Selection.getSelected();
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

        if (this.dragging) {
            let p1 = this.camera.canvasToScreen(this.dragStartX, this.dragStartY);
            let p2 = this.camera.canvasToScreen(this.dragCurrentX, this.dragCurrentY);
            let x1 = Math.min(p1.x, p2.x);
            let y1 = Math.min(p1.y, p2.y);
            let x2 = Math.max(p1.x, p2.x);
            let y2 = Math.max(p1.y, p2.y);
            env.renderer.setColor("rgba(100, 149, 237, 0.2)");
            env.renderer.drawRect(x1, y1, x2, y2, true, false);
            env.renderer.setColor("rgba(100, 149, 237, 1)");
            env.renderer.drawRect(x1, y1, x2, y2, false, true);

            for (let drawable of this.previewSelection) {
                switch (drawable.pickType) {
                    case SelectType.POLYLINE:
                        this.drawPreviewPolyline(<DrawablePolyline>drawable, env.renderer);
                        break;
                    case SelectType.TEXT:
                        this.drawPreviewText(<DrawableText>drawable, env.renderer);
                        break;
                }
            }
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

    private drawPreviewPolyline(polyline: DrawablePolyline, renderer: Renderer) {
        let drawPointCircle = (x: number, y: number, renderer: Renderer) => {
            let position = this.camera.canvasToScreen(x, y);
            renderer.setColor("rgba(255,255,255,1)");
            renderer.drawCircle(position.x, position.y, 5, false, true, 1);
            renderer.setColor("rgba(0,0,0,0.5)");
            renderer.drawCircle(position.x, position.y, 4, true, false);
        };
        polyline.editor.forEachPoint((x: number, y: number) => {
            drawPointCircle(x, y, renderer);
        });
    }

    private drawPreviewText(text: DrawableText, renderer: Renderer) {
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

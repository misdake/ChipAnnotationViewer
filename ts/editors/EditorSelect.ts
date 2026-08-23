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
import { EditablePick, EditableMove, EditableDeleteClone, EditableColor, editableMultiple } from "../editable/Editable";
import { Camera } from "../Camera";
import { annotationHistory, HistoryTransaction } from "../history/AnnotationHistory";

export class EditorSelect extends Editor {

    public measurementOnly = false;

    private dragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private dragStartScreenX = 0;
    private dragStartScreenY = 0;
    private dragCurrentX = 0;
    private dragCurrentY = 0;
    private previewSelection: (Drawable & EditablePick)[] = [];
    private isDraggingSelected = false;
    private isBoxSelecting = false;
    private dragMoveStartX = 0;
    private dragMoveStartY = 0;
    private selectedEditable: EditableMove & EditableDeleteClone & EditableColor;
    private moveTransaction: HistoryTransaction = null;
    private rightClickStartX = 0;
    private rightClickStartY = 0;
    private isRightClickDragging = false;
    private static readonly BOX_SELECT_MIN_DRAG_PX = 6;

    constructor(canvas: Canvas) {
        super(EditorName.SELECT, canvas);
    }

    usages(): Usage[] {
        if (this.measurementOnly) {
            return [
                Editor.usage("left click to select a polygon"),
                Editor.usage("hold ctrl to add to the measurement"),
                Editor.usage("drag on empty area to box select polygons"),
                Editor.usage("right click to deselect all"),
            ];
        }
        return [
            Editor.usage("left click to select"),
            Editor.usage("left click on selected to drag and move"),
            Editor.usage("hold ctrl to add to selection or merge selections"),
            Editor.usage("right click to deselect all"),
            Editor.usage("drag on empty area to box select"),
            Editor.usage("hold ctrl while box selecting to merge with current selection"),
        ];
    }

    private isPointOnSelectedDrawable(x: number, y: number): boolean {
        let selected = Selection.getSelected();
        if (!selected.type) return false;
        let radius = this.camera.screenSizeToCanvas(5);
        if (selected.type === SelectType.MULTIPLE) {
            let items = <(Drawable & EditablePick)[]>selected.item;
            for (let item of items) {
                if (item.pick(x, y, radius)) return true;
            }
        } else {
            let item = <Drawable & EditablePick>selected.item;
            if (item.pick(x, y, radius)) return true;
        }
        return false;
    }

    private getSelectedDrawables(): (Drawable & EditablePick)[] {
        let selected = Selection.getSelected();
        if (!selected.type) return [];
        if (selected.type === SelectType.MULTIPLE) {
            return <(Drawable & EditablePick)[]>selected.item;
        }
        return [<Drawable & EditablePick>selected.item];
    }

    enter(env: Env): void {
        let self = this;

        this._mouseListener = new class extends MouseListener {
            onmousedown(event: MouseIn): boolean {
                if (event.button === 0) {
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;

                    if (!self.measurementOnly && self.isPointOnSelectedDrawable(x, y)) {
                        self.isDraggingSelected = true;
                        self.isBoxSelecting = false;
                        self.dragMoveStartX = x;
                        self.dragMoveStartY = y;
                        let selected = self.getSelectedDrawables();
                        self.selectedEditable = editableMultiple(selected);
                        self.moveTransaction = annotationHistory.begin(self.canvas, selected, event.ctrlKey ? "selection.clone.drag" : "selection.move");

                        if (event.ctrlKey) {
                            const clones = self.selectedEditable.cloneOnCanvas(self.canvas, 0, 0);
                            if (Array.isArray(clones)) annotationHistory.trackAdded(self.moveTransaction, clones);
                            let newSelected = self.getSelectedDrawables();
                            self.selectedEditable = editableMultiple(newSelected);
                        }

                        self.canvas.getElement().style.cursor = "grabbing";
                    } else {
                        self.isDraggingSelected = false;
                        self.isBoxSelecting = true;
                        self.dragging = false;
                        self.dragStartX = x;
                        self.dragStartY = y;
                        self.dragStartScreenX = event.offsetX;
                        self.dragStartScreenY = event.offsetY;
                        self.dragCurrentX = x;
                        self.dragCurrentY = y;
                    }
                    return true;
                }
                if (event.button === 2) {
                    self.rightClickStartX = event.offsetX;
                    self.rightClickStartY = event.offsetY;
                    return false;
                }
                return false;
            }
            onmouseup(event: MouseIn): boolean {
                if (event.button === 2) {
                    if (!self.isRightClickDragging && Selection.getSelected().type) {
                        Selection.deselectAny();
                    }
                    self.isRightClickDragging = false;
                    return false;
                }
                if (event.button === 0) {
                    let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let x = canvasXY.x, y = canvasXY.y;

                    if (self.isDraggingSelected) {
                        self.isDraggingSelected = false;
                        self.selectedEditable = null;
                        if (annotationHistory.isActive(self.moveTransaction)) {
                            annotationHistory.commit(self.canvas, self.moveTransaction);
                        }
                        self.moveTransaction = null;
                        self.canvas.getElement().style.cursor = "";
                        self.canvas.requestRender();
                        return true;
                    }

                    if (self.isBoxSelecting) {
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
                            } else if (!event.ctrlKey) {
                                Selection.deselectAny();
                            }
                        } else {
                            let candidates = self.measurementOnly ? env.polylines : undefined;
                            let { item, type } = self.pickAny(x, y, env, candidates);
                            if (item) {
                                if (!event.ctrlKey) {
                                    Selection.select(type, item);
                                } else {
                                    let current = Selection.getSelected();
                                    let currentType = current.type;
                                    if (!currentType) {
                                        Selection.select(type, item);
                                    } else if (currentType === SelectType.MULTIPLE) {
                                        let array = <(Drawable & EditablePick)[]>current.item;
                                        let index = array.indexOf(item);
                                        if (index >= 0) {
                                            array.splice(index, 1);
                                            if (array.length === 0) {
                                                Selection.deselectAny();
                                            } else if (array.length === 1) {
                                                Selection.select(array[0].pickType, array[0]);
                                            } else {
                                                Selection.select(SelectType.MULTIPLE, array);
                                            }
                                        } else {
                                            array.push(item);
                                            Selection.select(SelectType.MULTIPLE, array);
                                        }
                                    } else {
                                        if (current.item !== item) {
                                            Selection.select(SelectType.MULTIPLE, [<Drawable>current.item, item]);
                                        } else {
                                            Selection.deselectAny();
                                        }
                                    }
                                }
                            } else if (!event.ctrlKey) {
                                Selection.deselectAny();
                            }
                        }
                        self.isBoxSelecting = false;
                        self.dragging = false;
                        self.previewSelection = [];
                        self.canvas.requestRender();
                        if (!self.measurementOnly && self.getSelectedDrawables().length > 0 && self.isPointOnSelectedDrawable(x, y)) {
                            self.canvas.getElement().style.cursor = "grab";
                        } else {
                            self.canvas.getElement().style.cursor = "";
                        }
                        return true;
                    }
                }
                return false;
            }
            onmousemove(event: MouseIn): boolean {
                let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                let x = canvasXY.x, y = canvasXY.y;

                if ((event.buttons & 2) && !self.isRightClickDragging) {
                    let dx = Math.abs(event.offsetX - self.rightClickStartX);
                    let dy = Math.abs(event.offsetY - self.rightClickStartY);
                    if (dx > 5 || dy > 5) {
                        self.isRightClickDragging = true;
                    }
                }

                if (self.isDraggingSelected && (event.buttons & 1)) {
                    if (!annotationHistory.isActive(self.moveTransaction)) {
                        self.isDraggingSelected = false;
                        self.selectedEditable = null;
                        self.moveTransaction = null;
                        self.canvas.getElement().style.cursor = "";
                        return false;
                    }
                    let dx = x - self.dragMoveStartX;
                    let dy = y - self.dragMoveStartY;
                    self.selectedEditable.move(dx, dy);
                    self.canvas.requestRender();
                    self.dragMoveStartX = x;
                    self.dragMoveStartY = y;
                    return true;
                }

                if (self.isBoxSelecting && (event.buttons & 1)) {
                    let dx = event.offsetX - self.dragStartScreenX;
                    let dy = event.offsetY - self.dragStartScreenY;
                    if (Math.hypot(dx, dy) >= EditorSelect.BOX_SELECT_MIN_DRAG_PX) {
                        if (!self.dragging && !event.ctrlKey) Selection.deselectAny();
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

                        if (!self.measurementOnly) {
                            for (let text of env.texts) {
                                let aabb = self.getAABB(text);
                                if (aabb) {
                                    let partiallyContained = !(aabb.x2 < minX || aabb.x1 > maxX || aabb.y2 < minY || aabb.y1 > maxY);
                                    if (partiallyContained) {
                                        self.previewSelection.push(text);
                                    }
                                }
                            }
                        }

                        for (let polyline of env.polylines) {
                            if (polyline.calculator.intersectsAABB(minX, minY, maxX, maxY)) {
                                self.previewSelection.push(polyline);
                            }
                        }

                        self.canvas.requestRender();
                        return true;
                    }
                }

                if (!self.isBoxSelecting) {
                    let selected = self.getSelectedDrawables();
                    if (!self.measurementOnly && selected.length > 0 && self.isPointOnSelectedDrawable(x, y)) {
                        self.canvas.getElement().style.cursor = "grab";
                    } else {
                        self.canvas.getElement().style.cursor = "";
                    }
                }

                return false;
            }
            ondblclick(event: MouseIn): boolean {
                if (event.button === 0) {
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
        annotationHistory.commitActive(env.canvas);
    }


    //pick

    private static pickPolyline(x: number, y: number, camera: Camera, polylines: DrawablePolyline[]): DrawablePolyline {
        let radius = camera.screenSizeToCanvas(5);
        let picked: DrawablePolyline = null;
        for (let polyline of polylines) {
            let pickPointIndex = polyline.picker.pickPoint(x, y, radius);
            let pickLine = polyline.picker.pickLine(x, y, radius);
            let pickShape = polyline.picker.pickShape(x, y, radius);
            if ((pickPointIndex !== null && pickPointIndex !== undefined) || pickLine || pickShape) {
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

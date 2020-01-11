import {Layer} from "./Layer";
import {Map} from "../data/Map";
import {DrawablePolyline} from "../editable/DrawablePolyline";
import {Canvas} from "../Canvas";
import {MouseIn, MouseListener} from "../MouseListener";
import {Renderer} from "../Renderer";
import {LayerPolylineView} from "./LayerPolylineView";
import {Ui} from "../util/Ui";
import {Data} from "../data/Data";
import {Selection} from "./Selection";
import {LayerName} from "./Layers";

export class LayerPolylineEdit extends Layer {
    private static readonly HINT_ELEMENT_ID = "hint";
    private static readonly HINT_EDIT_POLYLINE =
        "1. hold left button to drag points<br>" +
        "2. hold ctrl to help with horizontal/vertical line<br>" +
        "3. hold alt to drag polyline<br>" +
        "4. hold ctrl+alt to copy and drag polyline<br>" +
        "5. double click on line to create point<br>" +
        "6. right-click / double left-click point to delete it<br>" +
        "7. WSAD ↑↓←→ to move, hold shift to speed up<br>" +
        "8. press del to delete<br>";

    private static readonly MAG_RADIUS = 10;

    private map: Map;
    private polylineEdit: DrawablePolyline = null;
    private layerView: LayerPolylineView;

    public constructor(canvas: Canvas) {
        super(LayerName.POLYLINE_EDIT, canvas);
        let self = this;
        // Selection.register(Layers.POLYLINE_EDIT, (item: Drawable) => {
        //     this.startEditingPolyline(item as DrawablePolyline);
        // }, () => {
        //     self.finishEditing();
        // });
    }

    public loadMap(map: Map): void {
        this.map = map;
    }

    public loadData(data: Data): void {
        this.layerView = this.canvas.findLayer(LayerName.POLYLINE_VIEW) as LayerPolylineView;
        this.polylineEdit = null;
        this.finishEditing();
        // Ui.setVisibility("panelPolylineSelected", false);
    }

    public startEditingPolyline(polyline: DrawablePolyline): void {
        this.finishEditing();

        //show polyline and its point indicators
        this.polylineEdit = polyline;
        this.bindPolylineConfigUi(this.polylineEdit);

        Ui.setContent(LayerPolylineEdit.HINT_ELEMENT_ID, LayerPolylineEdit.HINT_EDIT_POLYLINE);

        //start listening to mouse events: drag point, remove point on double click, add point on double click
        let self = this;
        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;
            private moved: boolean = false;

            private dragPointIndex: number = null;

            private dragShape: boolean = false;
            private dragShapeX: number = -1;
            private dragShapeY: number = -1;

            onmousedown(event: MouseIn): boolean {
                this.dragPointIndex = null;

                if (event.button == 0) { //left button down => test drag point
                    this.down = true;

                    //test point
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (pointIndex != null) { //start dragging this point
                        this.dragPointIndex = pointIndex;
                        return true;
                    }

                    let shape = polyline.picker.pickShape(position.x, position.y);
                    if (pointIndex == null && shape && event.altKey) {
                        if (event.ctrlKey) {
                            let copied = new DrawablePolyline(polyline.clone());
                            self.layerView.addPolyline(copied);
                        }
                        this.dragShape = true;
                        this.dragShapeX = position.x;
                        this.dragShapeY = position.y;
                    }
                } else if (event.button == 2) {
                    this.moved = false;
                }
                return false;
            }
            onmouseup(event: MouseIn): boolean {
                let wasDragging: boolean = this.dragPointIndex != null || !!this.dragShape; //pass event if not dragging, so that LayerPolylineView will deselect this polyline

                this.dragPointIndex = null;

                this.dragShape = false;
                this.dragShapeX = -1;
                this.dragShapeY = -1;

                if (event.button == 0) { //left button up => nothing
                    this.down = false;
                    return wasDragging;
                } else if (event.button == 2) {
                    let hit = false;
                    if (!this.moved) {
                        let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        //test points
                        let pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (pointIndex != null) { //delete point
                            if (polyline.editor.pointCount() > 3) { //so it will be at least a triangle
                                polyline.editor.removePoint(pointIndex);
                                self.canvas.requestRender();
                            }
                            hit = true;
                        }
                    }
                    this.moved = false;
                    return hit;
                }
                return false;
            }
            ondblclick(event: MouseIn): boolean { //double click => remove point on selection or add point on segment
                if (event.button == 0) {
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);

                    //test points
                    let pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (pointIndex != null) { //delete point
                        if (polyline.editor.pointCount() > 3) { //so it will be at least a triangle
                            polyline.editor.removePoint(pointIndex);
                            self.canvas.requestRender();
                        }
                        return true;
                    }

                    //test segments
                    let segment = polyline.picker.pickLine(position.x, position.y, self.camera.screenSizeToCanvas(5));
                    if (segment) { //add point
                        let newIndex = segment.p1Index; //insert point after p1
                        polyline.editor.insertPoint(segment.position.x, segment.position.y, newIndex);
                        self.canvas.requestRender();
                        return true;
                    }
                }

                return false;
            }
            onmousemove(event: MouseIn): boolean {
                if (this.down) { //left button is down => drag
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);

                    if (this.dragPointIndex != null) {
                        polyline.editor.setPoint(this.dragPointIndex, position.x, position.y);
                        if (event.ctrlKey) {
                            let radius = self.camera.screenSizeToCanvas(LayerPolylineEdit.MAG_RADIUS);
                            let result = polyline.calculator.alignPoint(this.dragPointIndex, radius);
                            polyline.editor.setPoint(this.dragPointIndex, result.x, result.y);
                        }

                        self.canvas.requestRender();
                        return true;

                    } else if (this.dragShape) {
                        polyline.editor.move(position.x - this.dragShapeX, position.y - this.dragShapeY);
                        this.dragShapeX = position.x;
                        this.dragShapeY = position.y;

                        self.canvas.requestRender();
                        return true;
                    }
                } else if (event.buttons & 2) {
                    this.moved = true;
                }
                return false;
            }
        };
        this._keyboardListener = Ui.createPolylineKeyboardListener(self.canvas, self.camera, self.polylineEdit, () => {
            this.deleteEditing();
            Selection.deselect(LayerName.POLYLINE_EDIT);
        });

        this.canvas.requestRender();
    }

    public finishEditing(): void {
        // Ui.setVisibility("panelPolylineSelected", false);
        Selection.deselectAny();

        if (this.polylineEdit) {
            this.polylineEdit = null;
            this.canvas.requestRender();
        }
        this._mouseListener = null;
        this._keyboardListener = null;
    }

    public render(renderer: Renderer): void {
        if (this.polylineEdit) {
            //draw all points
            this.polylineEdit.editor.forEachPoint((x, y) => {
                this.drawPointCircle(x, y, renderer);
            });
        }
    }

    private drawPointCircle(x: number, y: number, renderer: Renderer) {
        let position = this.camera.canvasToScreen(x, y);
        renderer.setColor("rgba(255,255,255,1)");
        renderer.drawCircle(position.x, position.y, 5, false, true, 1);
        renderer.setColor("rgba(0,0,0,0.5)");
        renderer.drawCircle(position.x, position.y, 4, true, false);
    }

    public deleteEditing() {
        if (this.polylineEdit) {
            this.layerView.deletePolyline(this.polylineEdit);
            this.finishEditing();
        }
    }

    private bindPolylineConfigUi(polyline: DrawablePolyline) {
        // Ui.setVisibility("panelPolylineSelected", true);

        Ui.bindButtonOnClick("polylineButtonCopy", () => {
            let offset = this.canvas.getCamera().screenSizeToCanvas(20);
            let newPolyline = new DrawablePolyline(polyline.clone(offset, offset));

            this.finishEditing();
            this.layerView.addPolyline(newPolyline);
            this.startEditingPolyline(newPolyline);

            this.canvas.requestRender();
        });

        // Ui.setVisibility("polylineAreaContainer", this.map.widthMillimeter > 0 && this.map.heightMillimeter > 0);
        Ui.bindButtonOnClick("polylineButtonArea", () => {
            Ui.setContent("polylineTextArea", "");
            if (polyline.style.fill) {
                let width = this.map.widthMillimeter;
                let height = this.map.heightMillimeter;
                let unit = "mm^2";
                if (!(this.map.widthMillimeter > 0 && this.map.heightMillimeter > 0)) {
                    width = this.map.width;
                    height = this.map.height;
                    unit = "pixels"
                }

                let area = polyline.calculator.area();
                let areaMM2 = area / this.map.width / this.map.height * width * height;
                areaMM2 = Math.round(areaMM2 * 100) / 100;
                Ui.setContent("polylineTextArea", areaMM2 + unit);
            } else {
                let width = this.map.widthMillimeter;
                let height = this.map.heightMillimeter;
                let unit = "mm";
                if (!(this.map.widthMillimeter > 0 && this.map.heightMillimeter > 0)) {
                    width = this.map.width;
                    height = this.map.height;
                    unit = "pixels"
                }

                let length = polyline.calculator.length();
                let lengthMM = length * Math.sqrt(width * height / this.map.width / this.map.height);
                lengthMM = Math.round(lengthMM * 100) / 100;
                Ui.setContent("polylineTextArea", lengthMM + unit);
            }
        });
        Ui.setContent("polylineTextArea", "");

        Ui.bindButtonOnClick("polylineButtonRotateCCW", () => {
            polyline.editor.rotateCCW();
            this.canvas.requestRender();
        });
        Ui.bindButtonOnClick("polylineButtonRotateCW", () => {
            polyline.editor.rotateCW();
            this.canvas.requestRender();
        });
        Ui.bindButtonOnClick("polylineButtonFlipX", () => {
            polyline.editor.flipX();
            this.canvas.requestRender();
        });
        Ui.bindButtonOnClick("polylineButtonFlipY", () => {
            polyline.editor.flipY();
            this.canvas.requestRender();
        });


        Ui.bindCheckbox("polylineCheckboxFill", polyline.style.fill, newValue => {
            polyline.style.fill = newValue;
            this.canvas.requestRender();
        });
        Ui.bindCheckbox("polylineCheckboxStroke", polyline.style.stroke, newValue => {
            polyline.style.stroke = newValue;
            this.canvas.requestRender();
        });
        Ui.bindCheckbox("polylineCheckboxClosed", polyline.style.closed, newValue => {
            polyline.style.closed = newValue;
            this.canvas.requestRender();
        });

        Ui.bindNumber("polylineTextSizeOnScreen", polyline.style.onScreen, newValue => {
            polyline.style.onScreen = newValue;
            this.canvas.requestRender();
        });
        Ui.bindNumber("polylineTextSizeOnCanvas", polyline.style.onCanvas, newValue => {
            polyline.style.onCanvas = newValue;
            this.canvas.requestRender();
        });

        Ui.bindColor("polylineContainerStrokeColor", "polylineContainerStrokeAlpha", polyline.style.strokeColor, polyline.style.strokeAlpha, (newColor, newAlpha) => {
            polyline.style.setStrokeColor(newColor, newAlpha);
            this.canvas.requestRender();
        });
        Ui.bindColor("polylineContainerFillColor", "polylineContainerFillAlpha", polyline.style.fillColor, polyline.style.fillAlpha, (newColor, newAlpha) => {
            polyline.style.setFillColor(newColor, newAlpha);
            this.canvas.requestRender();
        });
    }
}

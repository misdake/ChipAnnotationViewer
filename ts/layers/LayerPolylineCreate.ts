import {Layer} from "../Layer";
import {Map} from "../data/Map";
import {DrawablePolyline, DrawablePolylinePack} from "../drawable/DrawablePolyline";
import {Canvas} from "../Canvas";
import {Size} from "../util/Size";
import {MouseListener} from "../MouseListener";
import {Renderer} from "../Renderer";
import {Position} from "../util/Transform";
import {LayerPolylineView} from "./LayerPolylineView";
import {Ui} from "../util/Ui";
import {Data} from "../data/Data";
import {Selection} from "./Selection";
import {Names} from "./Names";

export class LayerPolylineCreate extends Layer {

    private static readonly HINT_ELEMENT_ID = "hint";
    private static readonly HINT_NEW_POLYLINE =
        "1. left click to create point<br>" +
        "2. hold left button to preview point<br>" +
        "3. right click to finish creating<br>" +
        "4. hold ctrl to help with horizontal/vertical line<br>";

    private static readonly MAG_RADIUS = 10;

    private map: Map;
    private polylineNew: DrawablePolyline = null;
    private layerView: LayerPolylineView;

    public constructor(canvas: Canvas) {
        super(Names.POLYLINE_CREATE, canvas);
        Selection.register(Names.POLYLINE_CREATE, () => {
            this.startCreatingPolyline();
        }, () => {
            this.finishEditing();
        });
    }

    public loadMap(map: Map): void {
        this.map = map;
    }

    public loadData(data: Data): void {
        this.layerView = this.canvas.findLayer(Names.POLYLINE_VIEW) as LayerPolylineView;
        this.polylineNew = null;
        this.finishEditing();
        Ui.setVisibility("panelPolylineSelected", false);
    }

    public createPolylineAndEdit() {
        this.polylineNew = new DrawablePolyline(new DrawablePolylinePack(
            [], true, new Size(2),
            true, "white", "25",
            true, "white", "75",
        ));

        Selection.select(Names.POLYLINE_CREATE, this.polylineNew);
    }

    private startCreatingPolyline() {
        let self = this;
        this.bindPolylineConfigUi(this.polylineNew);

        Ui.setContent(LayerPolylineCreate.HINT_ELEMENT_ID, LayerPolylineCreate.HINT_NEW_POLYLINE);

        this._mouseListener = new class extends MouseListener {
            private down: boolean = false;
            private moved: boolean = false;

            private preview(position: Position, magnetic: boolean): void {
                self.polylineNew.editor.setPoint(-1, position.x, position.y);
                if (magnetic) {
                    let radius = self.camera.screenSizeToCanvas(LayerPolylineCreate.MAG_RADIUS);
                    let result = self.polylineNew.calculator.alignPoint(-1, radius);
                    self.polylineNew.editor.setPoint(-1, result.x, result.y);
                }
            }
            onmousedown(event: MouseEvent): boolean {
                if (event.button == 0 && !this.down) { //left button down => add point
                    this.down = true;
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    self.polylineNew.editor.addPoint(position.x, position.y);
                    self.canvas.requestRender();
                    return true;
                } else if (event.button == 2) {
                    this.moved = false;
                }
                return false;
            }
            onmouseup(event: MouseEvent): boolean {
                if (event.button == 0) { //left button up => update last point
                    this.down = false;
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    this.preview(position, event.ctrlKey);
                    self.canvas.requestRender();
                    return true;
                } else if (event.button == 2) {
                    if (!this.moved) {
                        let newPolyline = self.polylineNew;
                        self.finishEditing();
                        if (self.layerView.containPolyline(newPolyline)) {
                            //pass it to polyline edit
                            Selection.select(Names.POLYLINE_EDIT, newPolyline);
                        }
                    }
                    this.moved = false;
                    return true;
                }
                return false;
            }
            onmousemove(event: MouseEvent): boolean {
                if (this.down) { //left button is down => show modification
                    let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    this.preview(position, event.ctrlKey);
                    self.canvas.requestRender();
                    return true;
                } else if (event.buttons & 2) {
                    this.moved = true;
                }
                return false;
            }
        };
        this._keyboardListener = Ui.createPolylineKeyboardListener(self.canvas, self.camera, self.polylineNew, () => {
            this.deleteCreating();
        });

        return this.polylineNew;
    }

    public deleteCreating() {
        this.polylineNew = null;
        this.finishEditing();
        this.canvas.requestRender();
    }

    public finishEditing(): void {
        Ui.setVisibility("panelPolylineSelected", false);

        if (this.polylineNew) {
            if (this.polylineNew.editor.pointCount() > 2) {
                this.layerView.addPolyline(this.polylineNew);
            }
            this.polylineNew = null;
            this.canvas.requestRender();
        }
        this._mouseListener = null;
        this._keyboardListener = null;
    }

    public render(renderer: Renderer): void {
        if (this.polylineNew) {
            this.polylineNew.render(this.canvas, renderer, this.camera);
            //draw two points
            let pointCount = this.polylineNew.editor.pointCount();
            if (pointCount > 0) {
                let p = this.polylineNew.editor.getPoint(0);
                this.drawPointCircle(p.x, p.y, renderer);
            }
            if (pointCount > 1) {
                let p = this.polylineNew.editor.getPoint(-1);
                this.drawPointCircle(p.x, p.y, renderer);
            }
        }
    }

    private drawPointCircle(x: number, y: number, renderer: Renderer) {
        let position = this.camera.canvasToScreen(x, y);
        renderer.setColor("rgba(255,255,255,1)");
        renderer.drawCircle(position.x, position.y, 5, false, true, 1);
        renderer.setColor("rgba(0,0,0,0.5)");
        renderer.drawCircle(position.x, position.y, 4, true, false);
    }

    private bindPolylineConfigUi(polyline: DrawablePolyline) {
        Ui.setVisibility("panelPolylineSelected", true);

        Ui.bindButtonOnClick("polylineButtonCopy", () => {
            let offset = this.canvas.getCamera().screenSizeToCanvas(20);
            let newPolyline = new DrawablePolyline(polyline.clone(offset, offset));

            this.finishEditing();
            this.layerView.addPolyline(newPolyline);
            Selection.select("polylinecreate", newPolyline);

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
        Ui.bindNumber("polylineTextSizeOfScreen", polyline.style.ofScreen * 1000, newValue => {
            polyline.style.ofScreen = newValue * 0.001;
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

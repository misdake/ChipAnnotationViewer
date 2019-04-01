define('util/ScreenRect',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ScreenRect {
        constructor(left, top, width, height) {
            this.left = left;
            this.top = top;
            this.width = width;
            this.height = height;
        }
    }
    exports.ScreenRect = ScreenRect;
});
//# sourceMappingURL=ScreenRect.js.map;
define('Renderer',["require", "exports", "./util/ScreenRect"], function (require, exports, ScreenRect_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Renderer {
        constructor(canvas, canvasElement, context) {
            this.canvas = canvas;
            this.canvasElement = canvasElement;
            this.context = context;
        }
        clear() {
            this.context.fillStyle = "#000000";
            this.context.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
        setColor(color) {
            this.context.fillStyle = color;
            this.context.strokeStyle = color;
        }
        setFillColor(color) {
            this.context.fillStyle = color;
        }
        setStrokeColor(color) {
            this.context.strokeStyle = color;
        }
        calculateLineWidth(camera, lineWidth) {
            if (!lineWidth)
                return 1;
            let onScreen = lineWidth.onScreen;
            let onCanvas = camera.canvasSizeToScreen(lineWidth.onCanvas);
            let ofScreenSize = lineWidth.ofScreen * Math.min(this.canvasElement.width, this.canvasElement.height);
            return onScreen + onCanvas + ofScreenSize;
        }
        //---------------------------------------------
        //polyline
        renderPolyline(camera, points, closed, fill, stroke, lineWidth) {
            if (points.length == 0)
                return;
            this.context.lineWidth = this.calculateLineWidth(camera, lineWidth);
            this.context.beginPath();
            this.context.lineCap = "round";
            this.context.lineJoin = "round";
            let start = camera.canvasToScreen(points[0].x, points[0].y);
            this.context.moveTo(start.x, start.y);
            for (let i = 1; i < points.length; i++) {
                let point = camera.canvasToScreen(points[i].x, points[i].y);
                this.context.lineTo(point.x, point.y);
            }
            if (closed) {
                this.context.closePath();
            }
            if (fill) {
                this.context.fill();
            }
            if (stroke) {
                this.context.stroke();
            }
        }
        //polyline
        //---------------------------------------------
        //---------------------------------------------
        //image
        testImageVisibility(camera, image, transform, width, height, range) {
            //transform to screen space
            let point = camera.canvasToScreen(transform.position.x, transform.position.y);
            let targetW = camera.canvasSizeToScreen(width);
            let targetH = camera.canvasSizeToScreen(height);
            //skip out-of-screen images
            if (point.x - range > this.canvas.getWidth() || point.y - range > this.canvas.getHeight())
                return null;
            if (point.x + targetW + range < 0 || point.y + targetH + range < 0)
                return null;
            return new ScreenRect_1.ScreenRect(point.x, point.y, targetW, targetH);
        }
        renderImage(camera, image, transform, width, height) {
            let rect = this.testImageVisibility(camera, image, transform, width, height, 0);
            this.drawImage(image, rect);
        }
        drawImage(image, rect) {
            if (rect) {
                //actually render image
                this.context.drawImage(image, rect.left, rect.top, rect.width, rect.height);
            }
        }
        //image
        //---------------------------------------------
        //---------------------------------------------
        //shape
        renderCircle(camera, x, y, radius, fill, stroke, lineWidth) {
            let position = camera.canvasToScreen(x, y);
            let size = camera.canvasSizeToScreen(radius);
            this.drawCircle(position.x, position.y, size, fill, stroke);
            this.context.lineWidth = this.calculateLineWidth(camera, lineWidth);
        }
        drawCircle(x, y, radius, fill, stroke, lineWidth) {
            if (lineWidth)
                this.context.lineWidth = lineWidth;
            this.context.beginPath();
            this.context.arc(x, y, radius, 0, Math.PI * 2);
            this.context.closePath();
            if (fill) {
                this.context.fill();
            }
            if (stroke) {
                this.context.stroke();
            }
        }
        drawRect(x1, y1, x2, y2, fill, stroke, lineWidth) {
            if (lineWidth)
                this.context.lineWidth = lineWidth;
            this.context.beginPath();
            this.context.moveTo(x1, y1);
            this.context.lineTo(x1, y2);
            this.context.lineTo(x2, y2);
            this.context.lineTo(x2, y1);
            this.context.closePath();
            if (fill) {
                this.context.fill();
            }
            if (stroke) {
                this.context.stroke();
            }
        }
        //shape
        //---------------------------------------------
        //---------------------------------------------
        //text
        measureText(camera, text, fontSize) {
            let size = this.calculateLineWidth(camera, fontSize);
            this.context.font = size + "px Arial";
            let textMetrics = this.context.measureText(text);
            return [textMetrics.width, size];
        }
        renderText(camera, text, fontSize, x, y, anchorX, anchorY) {
            let position = camera.canvasToScreen(x, y);
            this.drawText(text, fontSize, position.x, position.y, anchorX, anchorY);
        }
        drawText(text, fontSize, x, y, anchorX, anchorY) {
            this.context.textAlign = anchorX;
            this.context.textBaseline = anchorY;
            this.context.font = fontSize + "px Arial";
            this.context.fillText(text, x, y);
        }
    }
    exports.Renderer = Renderer;
});
//# sourceMappingURL=Renderer.js.map;
define('util/Transform',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Transform {
        constructor() {
            this.position = new Position(0, 0);
        }
    }
    exports.Transform = Transform;
    class Position {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }
    exports.Position = Position;
});
//# sourceMappingURL=Transform.js.map;
define('Camera',["require", "exports", "./util/Transform"], function (require, exports, Transform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Camera {
        constructor() {
            this.position = new Transform_1.Position(0, 0);
        }
        load(canvas, map) {
            this.canvas = canvas;
            this.zoomMin = 0;
            this.zoomMax = map.maxLevel;
            this.zoom = map.maxLevel;
            this.checkZoom();
            this.position.x = map.width / 2;
            this.position.y = map.height / 2;
            this.xMin = 0;
            this.xMax = map.width;
            this.yMin = 0;
            this.yMax = map.height;
        }
        moveXy(dx, dy) {
            this.position.x += dx;
            this.position.y += dy;
            this.checkXy();
        }
        checkXy() {
            this.position.x = Math.min(Math.max(this.position.x, this.xMin), this.xMax);
            this.position.y = Math.min(Math.max(this.position.y, this.yMin), this.yMax);
        }
        getZoom() {
            return this.zoom;
        }
        changeZoomBy(amount) {
            this.zoom += amount;
            this.checkZoom();
        }
        setZoomTo(zoom) {
            this.zoom = zoom;
            this.checkZoom();
        }
        checkZoom() {
            this.zoom = Math.min(Math.max(this.zoom, this.zoomMin), this.zoomMax);
        }
        action() {
            if (!this.canvas)
                return;
            this.checkXy();
            this.checkZoom();
            let scale = 1.0 / (1 << this.zoom);
            this.scale = scale;
            this.tx = this.canvas.getWidth() / 2 - this.position.x * scale;
            this.ty = this.canvas.getHeight() / 2 - this.position.y * scale;
        }
        screenXyToCanvas(x, y) {
            let targetX = (x - this.tx) / this.scale;
            let targetY = (y - this.ty) / this.scale;
            return new Transform_1.Position(targetX, targetY);
        }
        canvasToScreen(x, y) {
            let targetX = x * this.scale + this.tx;
            let targetY = y * this.scale + this.ty;
            return new Transform_1.Position(targetX, targetY);
        }
        screenSizeToCanvas(s) {
            return s / this.scale;
        }
        canvasSizeToScreen(s) {
            return s * this.scale;
        }
        canvasAABBInScreen(aabb) {
            let x1 = aabb.x1 * this.scale + this.tx;
            let y1 = aabb.y1 * this.scale + this.ty;
            let x2 = aabb.x2 * this.scale + this.tx;
            let y2 = aabb.y2 * this.scale + this.ty;
            let w = this.canvas.getWidth();
            let h = this.canvas.getHeight();
            return !(x2 < 0 || x1 > w || y2 < 0 || y1 > h);
        }
    }
    exports.Camera = Camera;
});
//# sourceMappingURL=Camera.js.map;
define('data/Data',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Data {
    }
    exports.Data = Data;
});
//# sourceMappingURL=Data.js.map;
define('Canvas',["require", "exports", "./Renderer", "./Camera", "./data/Data"], function (require, exports, Renderer_1, Camera_1, Data_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Canvas {
        constructor(domElement, id) {
            this.renderNext = false;
            this.map = null;
            this.data = null;
            this.domElement = domElement;
            this.domElement.innerHTML = "<canvas id=\"" + id + "\" style='width:100%;height:100%;overflow:hidden'></canvas>";
            this.domElement.oncontextmenu = function (ev) {
                return false; //disable context menu
            };
            this.canvasElement = document.getElementById(id);
            this.context = this.canvasElement.getContext("2d");
            this.camera = new Camera_1.Camera();
            this.renderer = new Renderer_1.Renderer(this, this.canvasElement, this.context);
            this.width = this.canvasElement.clientWidth;
            this.height = this.canvasElement.clientHeight;
            let self = this;
            window.addEventListener('resize', function () {
                self.requestRender();
            });
        }
        getCamera() {
            return this.camera;
        }
        init() {
            this.layers = [];
            this.canvasElement.onclick = event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onclick(event))
                        break;
                }
            };
            this.canvasElement.ondblclick = event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.ondblclick(event))
                        break;
                }
            };
            this.canvasElement.onwheel = event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onwheel(event))
                        break;
                }
            };
            this.canvasElement.onmousedown = event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onmousedown(event))
                        break;
                }
            };
            this.canvasElement.onmouseup = event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onmouseup(event))
                        break;
                }
            };
            this.canvasElement.onmousemove = event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onmousemove(event))
                        break;
                }
            };
            this.canvasElement.onmouseout = event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onmouseout(event))
                        break;
                }
            };
            this.canvasElement.onkeydown = event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.keyboardListener && layer.keyboardListener.onkeydown(event))
                        break;
                }
            };
            this.canvasElement.onkeyup = event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.keyboardListener && layer.keyboardListener.onkeyup(event))
                        break;
                }
            };
            this.canvasElement.onkeypress = event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                let length = this.layers.length;
                for (let i = length - 1; i >= 0; i--) {
                    let layer = this.layers[i];
                    if (layer.keyboardListener && layer.keyboardListener.onkeypress(event))
                        break;
                }
            };
        }
        addLayer(layer) {
            this.layers.push(layer);
        }
        findLayer(name) {
            for (const layer of this.layers) {
                if (layer.name == name) {
                    return layer;
                }
            }
            return null;
        }
        getWidth() {
            return this.width;
        }
        getHeight() {
            return this.height;
        }
        requestRender() {
            if (this.renderNext)
                return;
            this.renderNext = true;
            let self = this;
            requestAnimationFrame(function () {
                self.renderNext = false;
                self.render();
            });
        }
        loadMap(map) {
            if (!this.map || this.map.name != map.name) {
                this.camera.load(this, map);
                for (let layer of this.layers) {
                    layer.loadMap(map);
                }
            }
            this.map = map;
        }
        loadData(data) {
            if (this.data != data) {
                for (let layer of this.layers) {
                    layer.loadData(data);
                }
            }
            this.data = data;
        }
        save() {
            let data = new Data_1.Data();
            for (let layer of this.layers) {
                layer.saveData(data);
            }
            return data;
        }
        render() {
            this.width = this.canvasElement.clientWidth;
            this.height = this.canvasElement.clientHeight;
            if (this.canvasElement.width !== this.width)
                this.canvasElement.width = this.width;
            if (this.canvasElement.height !== this.height)
                this.canvasElement.height = this.height;
            this.camera.action();
            this.renderer.clear();
            for (let layer of this.layers) {
                layer.render(this.renderer);
            }
        }
    }
    exports.Canvas = Canvas;
});
//# sourceMappingURL=Canvas.js.map;
define('util/NetUtil',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NetUtil {
        static get(url, callback) {
            let request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState == 4 && request.status == 200) {
                    callback(request.responseText);
                }
            };
            request.open("GET", url, true);
            request.send();
        }
    }
    exports.NetUtil = NetUtil;
});
//# sourceMappingURL=NetUtil.js.map;
define('Layer',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Layer {
        constructor(name, canvas) {
            this._mouseListener = null;
            this._keyboardListener = null;
            this.name = name;
            this.canvas = canvas;
            this.camera = canvas.getCamera();
        }
        get mouseListener() {
            return this._mouseListener;
        }
        get keyboardListener() {
            return this._keyboardListener;
        }
        loadMap(map) {
        }
        loadData(data) {
        }
        saveData(data) {
        }
        render(renderer) {
        }
        unload() {
        }
    }
    exports.Layer = Layer;
});
//# sourceMappingURL=Layer.js.map;
define('drawable/Drawable',["require", "exports", "../util/Transform"], function (require, exports, Transform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Drawable {
        constructor() {
            this.transformation = new Transform_1.Transform();
        }
        render(canvas, renderer, camera) {
        }
    }
    exports.Drawable = Drawable;
});
//# sourceMappingURL=Drawable.js.map;
define('drawable/DrawableImage',["require", "exports", "./Drawable"], function (require, exports, Drawable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DrawableImage extends Drawable_1.Drawable {
        constructor(src, x, y, w, h, onload) {
            super();
            this.transformation.position.x = x;
            this.transformation.position.y = y;
            this.w = w;
            this.h = h;
            this.img = new Image();
            // img.src is not set, will be set and image will start loading once it is visible to camera.
            this.src = src;
            this.loaded = false;
            let self = this;
            this.img.onload = ev => {
                this.loaded = true;
                if (onload)
                    onload(self);
            };
        }
        loadIfNotLoaded() {
            if (!this.loading) {
                this.loading = true;
                this.img.src = this.src;
            }
        }
        render(canvas, renderer, camera) {
            let rect = renderer.testImageVisibility(camera, this.img, this.transformation, this.w, this.h, 100);
            if (rect) {
                this.loadIfNotLoaded();
                if (this.loaded) {
                    renderer.drawImage(this.img, rect);
                }
            }
        }
    }
    exports.DrawableImage = DrawableImage;
});
//# sourceMappingURL=DrawableImage.js.map;
define('MouseListener',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MouseListener {
        onclick(event) {
            return false;
        }
        ondblclick(event) {
            return false;
        }
        onwheel(event) {
            return false;
        }
        onmousedown(event) {
            return false;
        }
        onmouseup(event) {
            return false;
        }
        onmousemove(event) {
            return false;
        }
        onmouseout(event) {
            return false;
        }
    }
    exports.MouseListener = MouseListener;
});
//# sourceMappingURL=MouseListener.js.map;
define('util/Color',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ColorEntry {
        constructor(name, r, g, b) {
            this.name = name;
            this.r = r;
            this.g = g;
            this.b = b;
        }
        static findByName(name) {
            for (const colorValue of this.list) {
                if (name == colorValue.name) {
                    return colorValue;
                }
            }
            return this.list[0];
        }
    }
    ColorEntry.list = [
        new ColorEntry("red", 255, 0, 0),
        new ColorEntry("green", 0, 255, 0),
        new ColorEntry("blue", 0, 0, 255),
        new ColorEntry("cyan", 0, 255, 255),
        new ColorEntry("purple", 255, 0, 255),
        new ColorEntry("yellow", 255, 255, 0),
        new ColorEntry("gray", 127, 127, 127),
        new ColorEntry("white", 255, 255, 255),
    ];
    exports.ColorEntry = ColorEntry;
    class AlphaEntry {
        constructor(name, buttonColor, value) {
            this.name = name;
            this.buttonColor = buttonColor;
            this.value = value;
        }
        static findByName(name) {
            for (const alphaValue of this.list) {
                if (name == alphaValue.name) {
                    return alphaValue;
                }
            }
            return this.list[0];
        }
        static findByValue(value) {
            for (const alphaValue of this.list) {
                if (value == alphaValue.value) {
                    return alphaValue;
                }
            }
            return this.list[0];
        }
    }
    AlphaEntry.list = [
        new AlphaEntry("25", "rgb(191,191,191)", 0.25),
        new AlphaEntry("50", "rgb(127,127,127)", 0.50),
        new AlphaEntry("75", "rgb(63,63,63)", 0.75),
        new AlphaEntry("100", "rgb(0,0,0)", 1.00),
    ];
    exports.AlphaEntry = AlphaEntry;
    function combineColorAlpha(color, alpha) {
        return "rgba(" + color.r + "," + color.g + "," + color.b + "," + alpha.value + ")";
    }
    exports.combineColorAlpha = combineColorAlpha;
});
//# sourceMappingURL=Color.js.map;
define('util/Ui',["require", "exports", "./Color"], function (require, exports, Color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Ui {
        static copyToClipboard(inputId) {
            let input = document.getElementById(inputId);
            input.select();
            document.execCommand("Copy");
            input.blur();
        }
        static setContent(id, content) {
            let element = document.getElementById(id);
            element.innerHTML = content;
        }
        static bindButtonOnClick(id, onclick) {
            let button = document.getElementById(id);
            button.onclick = onclick;
        }
        static setVisibility(id, visible) {
            let element = document.getElementById(id);
            element.style.display = visible ? "block" : "none";
        }
        static bindCheckbox(id, initialValue, onchange) {
            let checkbox = document.getElementById(id);
            checkbox.checked = initialValue;
            checkbox.onchange = ev => {
                onchange(checkbox.checked);
            };
        }
        static bindSelect(id, options, initialValue, onchange) {
            let select = document.getElementById(id);
            select.options.length = 0;
            for (let map of options) {
                select.add(new Option(map, map));
            }
            let index = options.indexOf(initialValue);
            if (index > 0) {
                select.options[index].selected = true;
            }
            select.onchange = ev => {
                onchange(select.selectedIndex, select.options[select.selectedIndex].value);
            };
        }
        static bindValue(id, initialValue, onchange) {
            let element = document.getElementById(id);
            element.value = initialValue;
            element.oninput = element.onchange = ev => {
                onchange(element.value);
            };
        }
        static bindColor(colorContainerId, alphaContainerId, initialColor, initialAlpha, onchange) {
            let colorContainer = document.getElementById(colorContainerId);
            let alphaContainer = document.getElementById(alphaContainerId);
            colorContainer.innerHTML = "";
            alphaContainer.innerHTML = "";
            let thisColor = initialColor;
            let thisAlpha = initialAlpha;
            for (const colorValue of Color_1.ColorEntry.list) {
                let id = colorContainerId + "_" + colorValue.name;
                let style = "background:" + colorValue.name;
                colorContainer.innerHTML = colorContainer.innerHTML + "<button id=\"" + id + "\" class=\"configColorButton\" style=\"" + style + "\"></button>\n";
            }
            for (const alphaValue of Color_1.AlphaEntry.list) {
                let id = alphaContainerId + "_" + alphaValue.name;
                let style = "background:" + alphaValue.buttonColor;
                alphaContainer.innerHTML = alphaContainer.innerHTML + "<button id=\"" + id + "\" class=\"configAlphaButton\" style=\"" + style + "\"></button>\n";
            }
            for (const colorValue of Color_1.ColorEntry.list) {
                let id = colorContainerId + "_" + colorValue.name;
                let button = document.getElementById(id);
                button.onclick = ev => {
                    thisColor = colorValue;
                    onchange(thisColor, thisAlpha);
                };
            }
            for (const alphaValue of Color_1.AlphaEntry.list) {
                let id = alphaContainerId + "_" + alphaValue.name;
                let button = document.getElementById(id);
                button.onclick = ev => {
                    thisAlpha = alphaValue;
                    onchange(thisColor, thisAlpha);
                };
            }
        }
        static bindNumber(id, initialValue, onchange) {
            let input = document.getElementById(id);
            input.value = initialValue.toString();
            input.oninput = input.onchange = ev => {
                let result = parseFloat(input.value);
                if (result >= 0) {
                    onchange(result);
                }
                else {
                    input.value = "0";
                    onchange(0);
                }
            };
        }
    }
    exports.Ui = Ui;
});
//# sourceMappingURL=Ui.js.map;
define('layers/LayerImage',["require", "exports", "../Layer", "../drawable/DrawableImage", "../MouseListener", "../util/Ui"], function (require, exports, Layer_1, DrawableImage_1, MouseListener_1, Ui_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LayerImage extends Layer_1.Layer {
        constructor(canvas) {
            super("image", canvas);
        }
        loadMap(map) {
            this.map = map;
            this.maxLevel = map.maxLevel;
            let split = map.githubRepo.indexOf('/');
            let username = map.githubRepo.substring(0, split);
            let repo = map.githubRepo.substring(split + 1);
            this.baseFolder = `https://${username}.github.io/${repo}/` + this.map.name;
            this.currentZoom = -1;
            let imageSource = document.getElementById("imageSource");
            Ui_1.Ui.setVisibility("imageSource", !!map.source);
            if (map.source) {
                imageSource.href = map.source;
                imageSource.innerHTML = map.source;
            }
            let self = this;
            this._mouseListener = new class extends MouseListener_1.MouseListener {
                constructor() {
                    super(...arguments);
                    this.down = false;
                    this.lastX = -1;
                    this.lastY = -1;
                }
                onwheel(event) {
                    let camera = self.canvas.getCamera();
                    camera.action();
                    let point1 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    camera.changeZoomBy(event.deltaY > 0 ? 1 : -1);
                    camera.action();
                    let point2 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    let dx = point1.x - point2.x;
                    let dy = point1.y - point2.y;
                    camera.moveXy(dx, dy);
                    self.canvas.requestRender();
                    return true;
                }
                onmousedown(event) {
                    this.down = true;
                    this.lastX = event.offsetX;
                    this.lastY = event.offsetY;
                    return true;
                }
                onmouseup(event) {
                    this.down = false;
                    return true;
                }
                onmousemove(event) {
                    if (this.down && event.buttons > 0) {
                        let camera = self.canvas.getCamera();
                        camera.action();
                        let point1 = camera.screenXyToCanvas(this.lastX, this.lastY);
                        let point2 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        let dx = point1.x - point2.x;
                        let dy = point1.y - point2.y;
                        camera.moveXy(dx, dy);
                        this.lastX = event.offsetX;
                        this.lastY = event.offsetY;
                        self.canvas.requestRender();
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            };
        }
        prepare(camera, canvas) {
            let zoom = camera.getZoom();
            if (this.currentZoom === zoom)
                return;
            this.currentZoom = zoom;
            let targetSize = this.map.tileSize << zoom;
            let levelData = this.map.levels[zoom];
            this.xCount = levelData.xMax;
            this.yCount = levelData.yMax;
            this.imageMatrix = [];
            for (let i = 0; i < this.xCount; i++) {
                this.imageMatrix[i] = [];
                for (let j = 0; j < this.yCount; j++) {
                    this.imageMatrix[i][j] = new DrawableImage_1.DrawableImage(this.baseFolder + "/" + zoom + "/" + i + "_" + j + ".jpg", i * targetSize, j * targetSize, targetSize, targetSize, image => {
                        canvas.requestRender();
                    });
                }
            }
        }
        render(renderer) {
            this.prepare(this.camera, this.canvas);
            if (this.imageMatrix) {
                for (let i = 0; i < this.xCount; i++) {
                    for (let j = 0; j < this.yCount; j++) {
                        this.imageMatrix[i][j].render(this.canvas, renderer, this.camera);
                    }
                }
            }
        }
        unload() {
            super.unload();
        }
    }
    exports.LayerImage = LayerImage;
});
//# sourceMappingURL=LayerImage.js.map;
define('util/AABB',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AABB {
        constructor(x1 = Math.min(), y1 = Math.min(), x2 = Math.max(), y2 = Math.max()) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
        set(x1, y1, x2, y2) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
    }
    exports.AABB = AABB;
});
//# sourceMappingURL=AABB.js.map;
define('drawable/DrawablePolyline',["require", "exports", "./Drawable", "../util/Color", "../util/AABB"], function (require, exports, Drawable_1, Color_1, AABB_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }
    exports.Point = Point;
    class PointSegmentResult {
        constructor(position, p1Index, p2Index, distance) {
            this.position = position;
            this.p1Index = p1Index;
            this.p2Index = p2Index;
            this.distance = distance;
        }
    }
    exports.PointSegmentResult = PointSegmentResult;
    class DrawablePolylinePack {
        constructor(points, closed, lineWidth, fill, fillColorName, fillAlphaName, stroke, strokeColorName, strokeAlphaName) {
            this.points = points;
            this.closed = closed;
            this.lineWidth = lineWidth;
            this.fill = fill;
            this.fillColorName = fillColorName;
            this.fillAlphaName = fillAlphaName;
            this.stroke = stroke;
            this.strokeColorName = strokeColorName;
            this.strokeAlphaName = strokeAlphaName;
        }
    }
    exports.DrawablePolylinePack = DrawablePolylinePack;
    class DrawablePolylinePicker {
        constructor(polyline, points) {
            this.polyline = polyline;
            this.points = points;
        }
        static sqr(dx, dy) {
            return dx * dx + dy * dy;
        }
        static testPointSegment(points, i1, i2, x, y) {
            let p1 = points[i1];
            let p2 = points[i2];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let dd = DrawablePolylinePicker.sqr(dx, dy);
            if (dd < 0.0001)
                return null;
            let scalar = ((x - p1.x) * dx + (y - p1.y) * dy) / dd;
            if (scalar > 1)
                scalar = 1;
            if (scalar < 0)
                scalar = 0;
            let tx = p1.x + scalar * dx;
            let ty = p1.y + scalar * dy;
            let distance2 = DrawablePolylinePicker.sqr(x - tx, y - ty);
            return new PointSegmentResult(new Point(tx, ty), i1, i2, Math.sqrt(distance2));
        }
        static testPointPolygon(points, x, y) {
            let length = points.length;
            let r = false;
            for (let i = 0, j = length - 1; i < length; j = i++) {
                if (((points[i].y > y) != (points[j].y > y)) &&
                    (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x))
                    r = !r;
            }
            return r;
        }
        pickPoint(canvasX, canvasY, radius) {
            let radius2 = radius * radius;
            let points = this.points;
            for (const point of points) {
                if (DrawablePolylinePicker.sqr(point.x - canvasX, point.y - canvasY) <= radius2) {
                    return points.indexOf(point);
                }
            }
            return null;
        }
        pickLine(canvasX, canvasY, radius) {
            let minResult = null;
            let minDistance = Number.MAX_VALUE;
            let points = this.points;
            let length = points.length;
            for (let i = 0, j = length - 1; i < length; j = i++) {
                let result = DrawablePolylinePicker.testPointSegment(points, i, j, canvasX, canvasY);
                if (result && result.distance < radius) {
                    if (result.distance < minDistance) {
                        minDistance = result.distance;
                        minResult = result;
                    }
                }
            }
            return minResult;
        }
        pickShape(canvasX, canvasY) {
            return this.polyline.style.fill && DrawablePolylinePicker.testPointPolygon(this.points, canvasX, canvasY);
        }
    }
    exports.DrawablePolylinePicker = DrawablePolylinePicker;
    class DrawablePolylineEditor {
        constructor(polyline, points) {
            this.polyline = polyline;
            this.points = points;
        }
        forEachPoint(func) {
            this.points.forEach((point, index) => {
                func(point.x, point.y, index);
            });
        }
        pointCount() {
            return this.points.length;
        }
        getPoint(index) {
            let points = this.points;
            index = (index + points.length) % points.length;
            return points[index];
        }
        addPoint(x, y) {
            this.points.push(new Point(x, y));
            this.polyline.invalidate();
        }
        insertPoint(x, y, beforeIndex = -1) {
            let points = this.points;
            beforeIndex = (beforeIndex + points.length) % points.length;
            points.splice(beforeIndex, 0, new Point(x, y));
            this.polyline.invalidate();
        }
        removePoint(index) {
            let points = this.points;
            index = (index + points.length) % points.length;
            points.splice(index, 1);
            this.polyline.invalidate();
        }
        setPoint(index, x, y) {
            let points = this.points;
            index = (index + points.length) % points.length;
            let point = points[index];
            point.x = x;
            point.y = y;
            this.polyline.invalidate();
        }
        move(offsetX, offsetY) {
            for (const point of this.points) {
                point.x += offsetX;
                point.y += offsetY;
            }
            this.polyline.invalidate();
        }
        flipX() {
            let minX = Math.min();
            let maxX = Math.max();
            for (const point of this.points) {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
            }
            let xx = minX + maxX;
            for (const point of this.points) {
                point.x = xx - point.x;
            }
        }
        flipY() {
            let minY = Math.min();
            let maxY = Math.max();
            for (const point of this.points) {
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
            let yy = minY + maxY;
            for (const point of this.points) {
                point.y = yy - point.y;
            }
        }
        rotateCW() {
            let center = this.polyline.calculator.aabbCenter();
            for (const point of this.points) {
                let dx = point.x - center.x;
                let dy = point.y - center.y;
                point.x = center.x - dy;
                point.y = center.y + dx;
            }
        }
        rotateCCW() {
            let center = this.polyline.calculator.aabbCenter();
            for (const point of this.points) {
                let dx = point.x - center.x;
                let dy = point.y - center.y;
                point.x = center.x + dy;
                point.y = center.y - dx;
            }
        }
    }
    exports.DrawablePolylineEditor = DrawablePolylineEditor;
    class DrawablePolylineCalculator {
        constructor(polyline, points) {
            this.polyline = polyline;
            this.points = points;
        }
        centroid() {
            let area2 = 0;
            let accX = 0;
            let accY = 0;
            for (let i = 0; i < this.points.length; i++) {
                let p1 = this.points[i];
                let p2 = this.points[(i + 1) % this.points.length];
                let c = p1.x * p2.y - p2.x * p1.y;
                area2 += c;
                accX += (p1.x + p2.x) * c;
                accY += (p1.y + p2.y) * c;
            }
            let x = accX / 6 / (area2 / 2);
            let y = accY / 6 / (area2 / 2);
            return new Point(x, y);
        }
        aabb(aabb = new AABB_1.AABB()) {
            if (!aabb)
                aabb = new AABB_1.AABB();
            let minX = Math.min(), maxX = Math.max();
            let minY = Math.min(), maxY = Math.max();
            for (const point of this.points) {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
            aabb.set(minX, minY, maxX, maxY);
            return aabb;
        }
        aabbCenter() {
            let aabb = this.aabb();
            let center = new Point((aabb.x1 + aabb.x2) / 2, (aabb.y1 + aabb.y2) / 2);
            return center;
        }
        area() {
            if (this.points.length < 3)
                return 0;
            let s = this.points[0].y * (this.points[this.points.length - 1].x - this.points[1].x);
            for (let i = 1; i < this.points.length; i++) {
                s += this.points[i].y * (this.points[i - 1].x - this.points[(i + 1) % this.points.length].x);
            }
            return Math.abs(s * 0.5);
        }
        length() {
            if (this.points.length < 2)
                return 0;
            let s = 0;
            let p0 = this.points[0];
            let pn = this.points[this.points.length - 1];
            if (this.polyline.style.closed) {
                s = DrawablePolylineCalculator.hypot(p0.x - pn.x, p0.y - pn.y);
            }
            for (let i = 0; i < this.points.length - 1; i++) {
                let pi = this.points[i];
                let pj = this.points[i + 1];
                s += DrawablePolylineCalculator.hypot(pi.x - pj.x, pi.y - pj.y);
            }
            return s;
        }
        static hypot(x, y) {
            return Math.sqrt(x * x + y * y);
        }
        alignPoint(index, radius) {
            index = (index + this.points.length) % this.points.length;
            let xy = this.points[index];
            let newX = xy.x;
            let newY = xy.y;
            let first = this.points[(index + 1) % this.points.length];
            if (Math.abs(first.x - xy.x) <= radius)
                newX = first.x;
            if (Math.abs(first.y - xy.y) <= radius)
                newY = first.y;
            if (this.points.length > 2) {
                let last = this.points[(index - 1 + this.points.length) % this.points.length];
                if (Math.abs(last.x - xy.x) <= radius)
                    newX = last.x;
                if (Math.abs(last.y - xy.y) <= radius)
                    newY = last.y;
            }
            return new Point(newX, newY);
        }
    }
    exports.DrawablePolylineCalculator = DrawablePolylineCalculator;
    class DrawablePolylineStyle {
        constructor(pack) {
            this._closed = pack.closed;
            this._lineWidth = pack.lineWidth;
            this._fill = pack.fill;
            this._fillColor = Color_1.ColorEntry.findByName(pack.fillColorName);
            this._fillAlpha = Color_1.AlphaEntry.findByName(pack.fillAlphaName);
            this._fillString = Color_1.combineColorAlpha(this._fillColor, this._fillAlpha);
            this._stroke = pack.stroke;
            this._strokeColor = Color_1.ColorEntry.findByName(pack.strokeColorName);
            this._strokeAlpha = Color_1.AlphaEntry.findByName(pack.strokeAlphaName);
            this._strokeString = Color_1.combineColorAlpha(this._strokeColor, this._strokeAlpha);
        }
        get closed() {
            return this._closed;
        }
        get lineWidth() {
            return this._lineWidth;
        }
        get fill() {
            return this._fill;
        }
        get fillColor() {
            return this._fillColor;
        }
        get fillAlpha() {
            return this._fillAlpha;
        }
        get fillString() {
            return this._fillString;
        }
        get stroke() {
            return this._stroke;
        }
        get strokeColor() {
            return this._strokeColor;
        }
        get strokeAlpha() {
            return this._strokeAlpha;
        }
        get strokeString() {
            return this._strokeString;
        }
        get onScreen() {
            return this._lineWidth.onScreen;
        }
        get onCanvas() {
            return this._lineWidth.onCanvas;
        }
        get ofScreen() {
            return this._lineWidth.ofScreen;
        }
        pack() {
            return new DrawablePolylinePack(null, this._closed, this._lineWidth, this._fill, this._fillColor.name, this._fillAlpha.name, this._stroke, this._strokeColor.name, this._strokeAlpha.name);
        }
        set closed(value) {
            this._closed = value;
        }
        set fill(value) {
            this._fill = value;
        }
        set stroke(value) {
            this._stroke = value;
        }
        set onScreen(onScreen) {
            this._lineWidth.onScreen = onScreen;
        }
        set onCanvas(onCanvas) {
            this._lineWidth.onCanvas = onCanvas;
        }
        set ofScreen(ofScreen) {
            this._lineWidth.ofScreen = ofScreen;
        }
        setFillColor(fillColor, fillAlpha) {
            this._fillColor = fillColor;
            this._fillAlpha = fillAlpha;
            this._fillString = Color_1.combineColorAlpha(this._fillColor, this._fillAlpha);
        }
        setStrokeColor(strokeColor, strokeAlpha) {
            this._strokeColor = strokeColor;
            this._strokeAlpha = strokeAlpha;
            this._strokeString = Color_1.combineColorAlpha(this._strokeColor, this._strokeAlpha);
        }
    }
    exports.DrawablePolylineStyle = DrawablePolylineStyle;
    class DrawablePolyline extends Drawable_1.Drawable {
        constructor(pack) {
            super();
            this.canvasAABB = new AABB_1.AABB();
            this.valid = false;
            this.points = pack.points;
            this.style = new DrawablePolylineStyle(pack);
            this.picker = new DrawablePolylinePicker(this, this.points);
            this.editor = new DrawablePolylineEditor(this, this.points);
            this.calculator = new DrawablePolylineCalculator(this, this.points);
        }
        clone(offsetX = 0, offsetY = 0) {
            let points = [];
            for (const point of this.points) {
                points.push(new Point(point.x + offsetX, point.y + offsetY));
            }
            let pack = this.style.pack();
            pack.points = points;
            return pack;
        }
        pack() {
            let pack = this.style.pack();
            pack.points = this.points;
            return pack;
        }
        invalidate() {
            this.valid = false;
        }
        validate() {
            if (!this.valid) {
                this.calculator.aabb(this.canvasAABB);
            }
        }
        render(canvas, renderer, camera) {
            this.validate();
            let inScreen = camera.canvasAABBInScreen(this.canvasAABB);
            if (inScreen) {
                renderer.setFillColor(this.style.fillString);
                renderer.setStrokeColor(this.style.strokeString);
                renderer.renderPolyline(camera, this.points, this.style.closed, this.style.fill, this.style.stroke, this.style.lineWidth);
            }
        }
    }
    DrawablePolyline.typeName = "DrawablePolyline";
    exports.DrawablePolyline = DrawablePolyline;
});
//# sourceMappingURL=DrawablePolyline.js.map;
define('layers/Selection',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Selection {
        static register(typeName, onselect, ondeselect) {
            if (typeName) {
                if (onselect)
                    this.mapSelect[typeName] = onselect;
                if (ondeselect)
                    this.mapDeselect[typeName] = ondeselect;
            }
            this.listDeselect.push(ondeselect);
        }
        static deselectAll() {
            for (const ondeselect of this.listDeselect) {
                ondeselect();
            }
        }
        static deselect(typeName) {
            let ondeselect = this.mapDeselect[typeName];
            if (ondeselect) {
                ondeselect();
            }
        }
        static select(typeName, item) {
            this.deselectAll();
            let onselect = this.mapSelect[typeName];
            if (onselect) {
                onselect(item);
            }
        }
    }
    Selection.listDeselect = [];
    Selection.mapSelect = {};
    Selection.mapDeselect = {};
    exports.Selection = Selection;
});
//# sourceMappingURL=Selection.js.map;
define('layers/LayerPolylineView',["require", "exports", "../Layer", "../drawable/DrawablePolyline", "../MouseListener", "./Selection"], function (require, exports, Layer_1, DrawablePolyline_1, MouseListener_1, Selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LayerPolylineView extends Layer_1.Layer {
        constructor(canvas) {
            super(LayerPolylineView.layerName, canvas);
            this.polylines = [];
        }
        loadData(data) {
            this.polylines = [];
            if (data.polylines) {
                for (let pack of data.polylines) {
                    this.polylines.push(new DrawablePolyline_1.DrawablePolyline(pack));
                }
            }
            //listen to mouse click to select polyline
            let self = this;
            this._mouseListener = new class extends MouseListener_1.MouseListener {
                constructor() {
                    super(...arguments);
                    this.moved = false;
                }
                onmousedown(event) {
                    this.moved = false;
                    return false;
                }
                onmouseup(event) {
                    if (event.button == 0 && !this.moved) {
                        let radius = self.camera.screenSizeToCanvas(5);
                        let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        let x = canvasXY.x, y = canvasXY.y;
                        let selected = null;
                        for (let polyline of self.polylines) {
                            let pickPointIndex = polyline.picker.pickPoint(x, y, radius);
                            let pickLine = polyline.picker.pickLine(x, y, radius);
                            let pickShape = polyline.picker.pickShape(x, y);
                            if (pickPointIndex != null || pickLine || pickShape) {
                                selected = polyline;
                            }
                        }
                        if (selected) {
                            Selection_1.Selection.select(DrawablePolyline_1.DrawablePolyline.typeName, selected);
                            return true;
                        }
                        Selection_1.Selection.deselect(DrawablePolyline_1.DrawablePolyline.typeName);
                        return false;
                    }
                    else {
                        return false;
                    }
                }
                onmousemove(event) {
                    if ((event.buttons & 1) && (event.movementX != 0 && event.movementY != 0)) {
                        this.moved = true;
                    }
                    return false;
                }
            };
        }
        addPolyline(polyline) {
            this.polylines.push(polyline);
            this.canvas.requestRender();
        }
        deletePolyline(polyline) {
            let index = this.polylines.indexOf(polyline);
            if (index !== -1) {
                this.polylines.splice(index, 1);
                return true;
            }
            else {
                return false;
            }
        }
        containPolyline(polyline) {
            return this.polylines.indexOf(polyline) >= 0;
        }
        saveData(data) {
            data.polylines = [];
            for (const polyline of this.polylines) {
                data.polylines.push(polyline.pack());
            }
        }
        render(renderer) {
            super.render(renderer);
            for (const polyline of this.polylines) {
                polyline.render(this.canvas, renderer, this.camera);
            }
        }
        unload() {
            super.unload();
        }
    }
    LayerPolylineView.layerName = "polyline view";
    exports.LayerPolylineView = LayerPolylineView;
});
//# sourceMappingURL=LayerPolylineView.js.map;
define('util/Size',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Size {
        constructor(onScreen, onCanvas, ofScreen) {
            this.onScreen = onScreen;
            this.onCanvas = onCanvas ? onCanvas : 0;
            this.ofScreen = ofScreen ? ofScreen : 0;
        }
    }
    exports.Size = Size;
});
//# sourceMappingURL=Size.js.map;
define('layers/LayerPolylineEdit',["require", "exports", "../Layer", "../drawable/DrawablePolyline", "../util/Size", "../MouseListener", "./LayerPolylineView", "../util/Ui", "./Selection"], function (require, exports, Layer_1, DrawablePolyline_1, Size_1, MouseListener_1, LayerPolylineView_1, Ui_1, Selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LayerPolylineEdit extends Layer_1.Layer {
        constructor(canvas) {
            super(LayerPolylineEdit.layerName, canvas);
            this.polylineNew = null;
            this.polylineEdit = null;
            let self = this;
            Selection_1.Selection.register(DrawablePolyline_1.DrawablePolyline.typeName, (item) => {
                this.startEditingPolyline(item);
            }, () => {
                self.finishEditing();
            });
        }
        loadMap(map) {
            this.map = map;
        }
        loadData(data) {
            this.layerView = this.canvas.findLayer(LayerPolylineView_1.LayerPolylineView.layerName);
            this.polylineNew = null;
            this.polylineEdit = null;
            this.finishEditing();
            Ui_1.Ui.setVisibility("panelPolylineSelected", false);
        }
        startCreatingPolyline() {
            this.finishEditing();
            let self = this;
            this.polylineNew = new DrawablePolyline_1.DrawablePolyline(new DrawablePolyline_1.DrawablePolylinePack([], true, new Size_1.Size(2), true, "white", "25", true, "white", "75"));
            this.bindPolylineConfigUi(this.polylineNew);
            Ui_1.Ui.setContent(LayerPolylineEdit.HINT_ELEMENT_ID, LayerPolylineEdit.HINT_NEW_POLYLINE);
            this._mouseListener = new class extends MouseListener_1.MouseListener {
                constructor() {
                    super(...arguments);
                    this.down = false;
                    this.moved = false;
                }
                preview(position, magnetic) {
                    self.polylineNew.editor.setPoint(-1, position.x, position.y);
                    if (magnetic) {
                        let radius = self.camera.screenSizeToCanvas(LayerPolylineEdit.MAG_RADIUS);
                        let result = self.polylineNew.calculator.alignPoint(-1, radius);
                        self.polylineNew.editor.setPoint(-1, result.x, result.y);
                    }
                }
                onmousedown(event) {
                    if (event.button == 0 && !this.down) { //left button down => add point
                        this.down = true;
                        let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        self.polylineNew.editor.addPoint(position.x, position.y);
                        self.canvas.requestRender();
                        return true;
                    }
                    else if (event.button == 2) {
                        this.moved = false;
                    }
                    return false;
                }
                onmouseup(event) {
                    if (event.button == 0) { //left button up => update last point
                        this.down = false;
                        let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        this.preview(position, event.ctrlKey);
                        self.canvas.requestRender();
                        return true;
                    }
                    else if (event.button == 2) {
                        if (!this.moved) {
                            let newPolyline = self.polylineNew;
                            self.finishEditing();
                            if (self.layerView.containPolyline(newPolyline)) {
                                self.startEditingPolyline(newPolyline);
                            }
                        }
                        this.moved = false;
                        return true;
                    }
                    return false;
                }
                onmousemove(event) {
                    if (this.down) { //left button is down => show modification
                        let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        this.preview(position, event.ctrlKey);
                        self.canvas.requestRender();
                        return true;
                    }
                    else if (event.buttons & 2) {
                        this.moved = true;
                    }
                    return false;
                }
            };
            return this.polylineNew;
        }
        deleteCreating() {
            this.polylineNew = null;
            this.finishEditing();
            this.canvas.requestRender();
        }
        startEditingPolyline(polyline) {
            this.finishEditing();
            //show polyline and its point indicators
            this.polylineEdit = polyline;
            this.bindPolylineConfigUi(this.polylineEdit);
            Ui_1.Ui.setContent(LayerPolylineEdit.HINT_ELEMENT_ID, LayerPolylineEdit.HINT_EDIT_POLYLINE);
            //start listening to mouse events: drag point, remove point on double click, add point on double click
            let self = this;
            this._mouseListener = new class extends MouseListener_1.MouseListener {
                constructor() {
                    super(...arguments);
                    this.down = false;
                    this.moved = false;
                    this.dragPointIndex = null;
                    this.dragShape = false;
                    this.dragShapeX = -1;
                    this.dragShapeY = -1;
                }
                onmousedown(event) {
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
                                let copied = new DrawablePolyline_1.DrawablePolyline(polyline.clone());
                                self.layerView.addPolyline(copied);
                            }
                            this.dragShape = true;
                            this.dragShapeX = position.x;
                            this.dragShapeY = position.y;
                        }
                    }
                    else if (event.button == 2) {
                        this.moved = false;
                    }
                    return false;
                }
                onmouseup(event) {
                    let wasDragging = this.dragPointIndex != null || !!this.dragShape; //pass event if not dragging, so that LayerPolylineView will deselect this polyline
                    this.dragPointIndex = null;
                    this.dragShape = false;
                    this.dragShapeX = -1;
                    this.dragShapeY = -1;
                    if (event.button == 0) { //left button up => nothing
                        this.down = false;
                        return wasDragging;
                    }
                    else if (event.button == 2) {
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
                ondblclick(event) {
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
                onmousemove(event) {
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
                        }
                        else if (this.dragShape) {
                            polyline.editor.move(position.x - this.dragShapeX, position.y - this.dragShapeY);
                            this.dragShapeX = position.x;
                            this.dragShapeY = position.y;
                            self.canvas.requestRender();
                            return true;
                        }
                    }
                    else if (event.buttons & 2) {
                        this.moved = true;
                    }
                    return false;
                }
            };
            this.canvas.requestRender();
        }
        finishEditing() {
            Ui_1.Ui.setVisibility("panelPolylineSelected", false);
            if (this.polylineNew) {
                if (this.polylineNew.editor.pointCount() > 2) {
                    this.layerView.addPolyline(this.polylineNew);
                }
                this.polylineNew = null;
                this.canvas.requestRender();
            }
            if (this.polylineEdit) {
                this.polylineEdit = null;
                this.canvas.requestRender();
            }
            this._mouseListener = null;
        }
        render(renderer) {
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
            if (this.polylineEdit) {
                //draw all points
                this.polylineEdit.editor.forEachPoint((x, y) => {
                    this.drawPointCircle(x, y, renderer);
                });
            }
        }
        drawPointCircle(x, y, renderer) {
            let position = this.camera.canvasToScreen(x, y);
            renderer.setColor("rgba(255,255,255,1)");
            renderer.drawCircle(position.x, position.y, 5, false, true, 1);
            renderer.setColor("rgba(0,0,0,0.5)");
            renderer.drawCircle(position.x, position.y, 4, true, false);
        }
        deleteEditing() {
            if (this.polylineEdit) {
                this.layerView.deletePolyline(this.polylineEdit);
                this.finishEditing();
            }
        }
        bindPolylineConfigUi(polyline) {
            Ui_1.Ui.setVisibility("panelPolylineSelected", true);
            Ui_1.Ui.bindButtonOnClick("polylineButtonCopy", () => {
                let offset = this.canvas.getCamera().screenSizeToCanvas(20);
                let newPolyline = new DrawablePolyline_1.DrawablePolyline(polyline.clone(offset, offset));
                this.finishEditing();
                this.layerView.addPolyline(newPolyline);
                this.startEditingPolyline(newPolyline);
                this.canvas.requestRender();
            });
            Ui_1.Ui.setVisibility("polylineAreaContainer", this.map.widthMillimeter > 0 && this.map.heightMillimeter > 0);
            Ui_1.Ui.bindButtonOnClick("polylineButtonArea", () => {
                if (this.map.widthMillimeter > 0 && this.map.heightMillimeter > 0) {
                    Ui_1.Ui.setContent("poylineTextArea", "");
                    if (polyline.style.fill) {
                        let area = polyline.calculator.area();
                        let areaMM2 = area / this.map.width / this.map.height * this.map.widthMillimeter * this.map.heightMillimeter;
                        areaMM2 = Math.round(areaMM2 * 100) / 100;
                        Ui_1.Ui.setContent("poylineTextArea", areaMM2 + "mm^2");
                    }
                    else {
                        let length = polyline.calculator.length();
                        let lengthMM = length * Math.sqrt(this.map.widthMillimeter * this.map.heightMillimeter / this.map.width / this.map.height);
                        lengthMM = Math.round(lengthMM * 100) / 100;
                        Ui_1.Ui.setContent("poylineTextArea", lengthMM + "mm");
                    }
                }
            });
            Ui_1.Ui.setContent("poylineTextArea", "");
            Ui_1.Ui.bindButtonOnClick("polylineButtonRotateCCW", () => {
                polyline.editor.rotateCCW();
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindButtonOnClick("polylineButtonRotateCW", () => {
                polyline.editor.rotateCW();
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindButtonOnClick("polylineButtonFlipX", () => {
                polyline.editor.flipX();
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindButtonOnClick("polylineButtonFlipY", () => {
                polyline.editor.flipY();
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindCheckbox("polylineCheckboxFill", polyline.style.fill, newValue => {
                polyline.style.fill = newValue;
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindCheckbox("polylineCheckboxStroke", polyline.style.stroke, newValue => {
                polyline.style.stroke = newValue;
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindCheckbox("polylineCheckboxClosed", polyline.style.closed, newValue => {
                polyline.style.closed = newValue;
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindNumber("polylineTextSizeOnScreen", polyline.style.onScreen, newValue => {
                polyline.style.onScreen = newValue;
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindNumber("polylineTextSizeOnCanvas", polyline.style.onCanvas, newValue => {
                polyline.style.onCanvas = newValue;
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindNumber("polylineTextSizeOfScreen", polyline.style.ofScreen * 1000, newValue => {
                polyline.style.ofScreen = newValue * 0.001;
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindColor("polylineContainerStrokeColor", "polylineContainerStrokeAlpha", polyline.style.strokeColor, polyline.style.strokeAlpha, (newColor, newAlpha) => {
                polyline.style.setStrokeColor(newColor, newAlpha);
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindColor("polylineContainerFillColor", "polylineContainerFillAlpha", polyline.style.fillColor, polyline.style.fillAlpha, (newColor, newAlpha) => {
                polyline.style.setFillColor(newColor, newAlpha);
                this.canvas.requestRender();
            });
        }
    }
    LayerPolylineEdit.layerName = "polyline edit";
    LayerPolylineEdit.HINT_ELEMENT_ID = "polylineHint";
    LayerPolylineEdit.HINT_NEW_POLYLINE = "1. left click to create point<br>" +
        "2. hold left button to preview point<br>" +
        "3. right click to finish creating<br>" +
        "4. hold ctrl to help with horizontal/vertical line<br>";
    LayerPolylineEdit.HINT_EDIT_POLYLINE = "1. hold left button to drag points<br>" +
        "2. hold ctrl to help with horizontal/vertical line<br>" +
        "3. hold alt to drag polyline<br>" +
        "4. hold ctrl+alt to copy and drag polyline<br>" +
        "5. double click on line to create point<br>" +
        "6. right-click / double left-click point to delete it<br>";
    LayerPolylineEdit.MAG_RADIUS = 10;
    exports.LayerPolylineEdit = LayerPolylineEdit;
});
//# sourceMappingURL=LayerPolylineEdit.js.map;
define('drawable/DrawableText',["require", "exports", "./Drawable", "../util/Color", "../util/AABB"], function (require, exports, Drawable_1, Color_1, AABB_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DrawableTextPack {
        constructor(text, colorName, alphaName, 
        // anchorX: CanvasTextAlign, anchorY: CanvasTextBaseline,
        fontSize, x, y) {
            this.text = "";
            this.text = text;
            this.colorName = colorName;
            this.alphaName = alphaName;
            this.fontSize = fontSize;
            this.x = x;
            this.y = y;
        }
    }
    exports.DrawableTextPack = DrawableTextPack;
    class DrawableText extends Drawable_1.Drawable {
        constructor(pack) {
            super();
            this._text = "";
            this._canvasAABB = new AABB_1.AABB();
            this.sizeValid = false;
            this.canvasZoom = -1;
            this.canvasWidth = 0;
            this.canvasHeight = 0;
            this.screenWidth = 0;
            this.screenHeight = 0;
            this._text = pack.text;
            this.color = Color_1.ColorEntry.findByName(pack.colorName);
            this.alpha = Color_1.AlphaEntry.findByName(pack.alphaName);
            this.colorString = Color_1.combineColorAlpha(this.color, this.alpha);
            this.fontSize = pack.fontSize;
            this._x = pack.x;
            this._y = pack.y;
        }
        invalidate() {
            this.sizeValid = false;
        }
        get text() {
            return this._text;
        }
        get x() {
            return this._x;
        }
        get y() {
            return this._y;
        }
        validateCanvasAABB(camera, renderer) {
            this.validate(camera, renderer);
            return this._canvasAABB;
        }
        get onScreen() {
            return this.fontSize.onScreen;
        }
        get onCanvas() {
            return this.fontSize.onCanvas;
        }
        get ofScreen() {
            return this.fontSize.ofScreen;
        }
        set onScreen(onScreen) {
            this.fontSize.onScreen = onScreen;
            this.invalidate();
        }
        set onCanvas(onCanvas) {
            this.fontSize.onCanvas = onCanvas;
            this.invalidate();
        }
        set ofScreen(ofScreen) {
            this.fontSize.ofScreen = ofScreen;
            this.invalidate();
        }
        setPosition(x, y) {
            this._x = x;
            this._y = y;
            this.invalidate();
        }
        set text(value) {
            this._text = value;
            this.invalidate();
        }
        setColorAlpha(color, alpha) {
            this.color = color;
            this.alpha = alpha;
            this.colorString = Color_1.combineColorAlpha(this.color, this.alpha);
        }
        clone(offsetX, offsetY) {
            return new DrawableTextPack(this._text, this.color.name, this.alpha.name, this.fontSize, this._x + offsetX, this._y + offsetY);
        }
        pack() {
            return new DrawableTextPack(this._text, this.color.name, this.alpha.name, this.fontSize, this._x, this._y);
        }
        render(canvas, renderer, camera) {
            renderer.setColor(this.colorString);
            this.validate(camera, renderer);
            let inScreen = camera.canvasAABBInScreen(this._canvasAABB);
            if (inScreen) {
                renderer.renderText(camera, this._text, this.screenHeight, this._x, this._y, "center", "middle");
            }
        }
        validate(camera, renderer) {
            if (!this.sizeValid || this.canvasZoom != camera.getZoom()) {
                this.sizeValid = true;
                let wh = renderer.measureText(camera, this._text, this.fontSize);
                let ratio = camera.screenSizeToCanvas(1);
                this.canvasZoom = camera.getZoom();
                this.canvasWidth = wh[0] * ratio / 2;
                this.canvasHeight = wh[1] * ratio / 2;
                this.screenWidth = wh[0];
                this.screenHeight = wh[1];
                this.calcCanvasAABB();
            }
        }
        pick(x, y, radius) {
            let h = (this._x - this.canvasWidth - radius <= x) && (x <= this._x + this.canvasWidth + radius);
            let v = (this._y - this.canvasHeight - radius <= y) && (y <= this._y + this.canvasHeight + radius);
            return h && v;
        }
        calcCanvasAABB() {
            this._canvasAABB.x1 = this.x - this.canvasWidth;
            this._canvasAABB.y1 = this.y - this.canvasHeight;
            this._canvasAABB.x2 = this.x + this.canvasWidth;
            this._canvasAABB.y2 = this.y + this.canvasHeight;
            return this._canvasAABB;
        }
    }
    DrawableText.typeName = "DrawableText";
    exports.DrawableText = DrawableText;
});
//# sourceMappingURL=DrawableText.js.map;
define('layers/LayerTextView',["require", "exports", "../Layer", "../MouseListener", "../drawable/DrawableText", "./Selection"], function (require, exports, Layer_1, MouseListener_1, DrawableText_1, Selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LayerTextView extends Layer_1.Layer {
        constructor(canvas) {
            super(LayerTextView.layerName, canvas);
            this.texts = [];
        }
        loadData(data) {
            this.texts = [];
            if (data.texts) {
                for (let pack of data.texts) {
                    this.texts.push(new DrawableText_1.DrawableText(pack));
                }
            }
            //listen to mouse click to select text
            let self = this;
            this._mouseListener = new class extends MouseListener_1.MouseListener {
                constructor() {
                    super(...arguments);
                    this.moved = false;
                }
                onmousedown(event) {
                    this.moved = false;
                    return false;
                }
                onmouseup(event) {
                    if (event.button == 0 && !this.moved) {
                        let canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        let x = canvasXY.x, y = canvasXY.y;
                        let selected = null;
                        for (let text of self.texts) {
                            let pick = text.pick(x, y, self.camera.screenSizeToCanvas(5));
                            if (pick)
                                selected = text;
                        }
                        if (selected) {
                            Selection_1.Selection.select(DrawableText_1.DrawableText.typeName, selected);
                            return true;
                        }
                        Selection_1.Selection.deselect(DrawableText_1.DrawableText.typeName);
                        return false;
                    }
                    else {
                        return false;
                    }
                }
                onmousemove(event) {
                    if ((event.buttons & 1) && (event.movementX != 0 && event.movementY != 0)) {
                        this.moved = true;
                    }
                    return false;
                }
            };
        }
        addText(text) {
            this.texts.push(text);
            this.canvas.requestRender();
        }
        deleteText(text) {
            let index = this.texts.indexOf(text);
            if (index !== -1) {
                this.texts.splice(index, 1);
                return true;
            }
            else {
                return false;
            }
        }
        saveData(data) {
            data.texts = [];
            for (const text of this.texts) {
                data.texts.push(text.pack());
            }
        }
        render(renderer) {
            super.render(renderer);
            for (const text of this.texts) {
                text.render(this.canvas, renderer, this.camera);
            }
        }
        unload() {
            super.unload();
        }
    }
    LayerTextView.layerName = "text view";
    exports.LayerTextView = LayerTextView;
});
//# sourceMappingURL=LayerTextView.js.map;
define('layers/LayerTextEdit',["require", "exports", "../Layer", "../drawable/DrawableText", "../util/Size", "../MouseListener", "./LayerTextView", "../util/Ui", "./Selection"], function (require, exports, Layer_1, DrawableText_1, Size_1, MouseListener_1, LayerTextView_1, Ui_1, Selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LayerTextEdit extends Layer_1.Layer {
        constructor(canvas) {
            super(LayerTextEdit.layerName, canvas);
            this.textEdit = null;
            let self = this;
            Selection_1.Selection.register(DrawableText_1.DrawableText.typeName, (item) => {
                self.startEditingText(item);
            }, () => {
                self.finishEditing();
            });
        }
        loadData(data) {
            this.layerView = this.canvas.findLayer(LayerTextView_1.LayerTextView.layerName);
            this.finishEditing();
            Ui_1.Ui.setVisibility("panelTextSelected", false);
        }
        startCreatingText() {
            this.finishEditing();
            let self = this;
            //show text and its point indicators
            let textNew = new DrawableText_1.DrawableText(new DrawableText_1.DrawableTextPack("text", "white", "100", new Size_1.Size(20, 50), 0, 0));
            this.bindTextConfigUi(textNew);
            Ui_1.Ui.setContent(LayerTextEdit.HINT_ELEMENT_ID, LayerTextEdit.HINT_NEW_TEXT);
            this._mouseListener = new class extends MouseListener_1.MouseListener {
                constructor() {
                    super(...arguments);
                    this.down = false;
                }
                onmousedown(event) {
                    if (event.button == 0) {
                        this.down = true;
                        return true;
                    }
                    return false;
                }
                onmouseup(event) {
                    if (event.button == 0) { //left button up => update last point
                        this.down = false;
                        let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        textNew.setPosition(position.x, position.y);
                        self.layerView.addText(textNew);
                        Selection_1.Selection.select(DrawableText_1.DrawableText.typeName, textNew);
                        self.canvas.requestRender();
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                onmousemove(event) {
                    return (event.buttons & 1) && this.down;
                }
            };
        }
        startEditingText(text) {
            this.finishEditing();
            //show text and its point indicators
            this.textEdit = text;
            this.bindTextConfigUi(this.textEdit);
            Ui_1.Ui.setContent(LayerTextEdit.HINT_ELEMENT_ID, LayerTextEdit.HINT_EDIT_TEXT);
            //start listening to mouse events: drag point, remove point on double click, add point on double click
            let self = this;
            this._mouseListener = new class extends MouseListener_1.MouseListener {
                constructor() {
                    super(...arguments);
                    this.down = false;
                    this.drag = false;
                    this.dragX = 0;
                    this.dragY = 0;
                }
                onmousedown(event) {
                    if (event.button == 0) { //left button down => test drag point
                        this.down = true;
                        this.drag = false;
                        //test
                        let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        let pick = text.pick(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (pick && event.altKey) { //start dragging
                            if (event.ctrlKey) {
                                let copied = new DrawableText_1.DrawableText(text.clone(0, 0));
                                self.layerView.addText(copied);
                            }
                            this.drag = true;
                            this.dragX = position.x - text.x;
                            this.dragY = position.y - text.y;
                            return event.altKey;
                        }
                    }
                    return false;
                }
                onmouseup(event) {
                    let passEvent = !this.drag; //pass event if not moving point, so that LayerTextView will deselect this text
                    this.drag = false;
                    if (event.button == 0) { //left button up => nothing
                        this.down = false;
                        return !passEvent;
                    }
                    return false;
                }
                onmousemove(event) {
                    if (this.down && this.drag) {
                        let position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        self.textEdit.setPosition(position.x - this.dragX, position.y - this.dragY);
                        self.canvas.requestRender();
                        return true;
                    }
                    return false;
                }
            };
            this.canvas.requestRender();
        }
        finishEditing() {
            Ui_1.Ui.setVisibility("panelTextSelected", false);
            if (this.textEdit) {
                if (this.textEdit.text.length == 0) {
                    this.layerView.deleteText(this.textEdit);
                }
                this.textEdit = null;
                this.canvas.requestRender();
            }
            this._mouseListener = null;
        }
        render(renderer) {
            if (this.textEdit) {
                //draw rect
                renderer.setColor(this.textEdit.colorString);
                let aabb = this.textEdit.validateCanvasAABB(this.camera, renderer);
                let p1 = this.camera.canvasToScreen(aabb.x1, aabb.y1);
                let p2 = this.camera.canvasToScreen(aabb.x2, aabb.y2);
                renderer.drawRect(p1.x - 5, p1.y - 5, p2.x + 5, p2.y + 5, false, true, 2);
            }
        }
        deleteEditing() {
            if (this.textEdit) {
                this.layerView.deleteText(this.textEdit);
                this.finishEditing();
            }
        }
        bindTextConfigUi(text) {
            Ui_1.Ui.setVisibility("panelTextSelected", true);
            Ui_1.Ui.bindButtonOnClick("textButtonCopy", () => {
                let offset = this.canvas.getCamera().screenSizeToCanvas(10);
                let newText = new DrawableText_1.DrawableText(text.clone(offset, offset));
                this.finishEditing();
                this.layerView.addText(newText);
                this.startEditingText(newText);
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindValue("textTextContent", text.text, newValue => {
                text.text = newValue;
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindNumber("textTextSizeOnScreen", text.onScreen, newValue => {
                text.onScreen = newValue;
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindNumber("textTextSizeOnCanvas", text.onCanvas, newValue => {
                text.onCanvas = newValue;
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindNumber("textTextSizeOfScreen", text.ofScreen * 1000, newValue => {
                text.ofScreen = newValue * 0.001;
                this.canvas.requestRender();
            });
            Ui_1.Ui.bindColor("textContainerColor", "textContainerAlpha", text.color, text.alpha, (newColor, newAlpha) => {
                text.setColorAlpha(newColor, newAlpha);
                this.canvas.requestRender();
            });
        }
    }
    LayerTextEdit.layerName = "text edit";
    LayerTextEdit.HINT_ELEMENT_ID = "textHint";
    LayerTextEdit.HINT_NEW_TEXT = "1. left click to create text<br>";
    LayerTextEdit.HINT_EDIT_TEXT = "1. hold alt to drag<br>" +
        "2. hold ctrl+alt to copy and drag <br>";
    exports.LayerTextEdit = LayerTextEdit;
});
//# sourceMappingURL=LayerTextEdit.js.map;
define('util/GithubUtil',["require", "exports", "./NetUtil"], function (require, exports, NetUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Github {
        static getComments(repo, issueId, callback) {
            NetUtil_1.NetUtil.get("https://api.github.com/repos/" + repo + "/issues/" + issueId + "/comments", json => {
                try {
                    let array = JSON.parse(json);
                    callback(array);
                }
                catch (e) {
                }
            });
        }
        static getIssueLink(repo, issueId) {
            return "https://github.com/" + repo + "/issues/" + issueId;
        }
        static getCommentLink(repo, issueId, commentId) {
            return "https://github.com/" + repo + "/issues/" + issueId + "#issuecomment-" + commentId;
        }
    }
    exports.Github = Github;
    class GithubUser {
    }
    exports.GithubUser = GithubUser;
    class GithubComment {
    }
    exports.GithubComment = GithubComment;
});
//# sourceMappingURL=GithubUtil.js.map;
define('App',["require", "exports", "./Canvas", "./util/NetUtil", "./layers/LayerImage", "./layers/LayerPolylineView", "./layers/LayerPolylineEdit", "./data/Data", "./util/Ui", "./layers/LayerTextEdit", "./layers/LayerTextView", "./util/GithubUtil"], function (require, exports, Canvas_1, NetUtil_1, LayerImage_1, LayerPolylineView_1, LayerPolylineEdit_1, Data_1, Ui_1, LayerTextEdit_1, LayerTextView_1, GithubUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let canvas = new Canvas_1.Canvas(document.getElementById("container"), 'canvas2d');
    canvas.init();
    let layerImage = new LayerImage_1.LayerImage(canvas);
    let layerPolylineView = new LayerPolylineView_1.LayerPolylineView(canvas);
    let layerPolylineEdit = new LayerPolylineEdit_1.LayerPolylineEdit(canvas);
    let layerTextView = new LayerTextView_1.LayerTextView(canvas);
    let layerTextEdit = new LayerTextEdit_1.LayerTextEdit(canvas);
    canvas.addLayer(layerImage);
    canvas.addLayer(layerPolylineView);
    canvas.addLayer(layerPolylineEdit);
    canvas.addLayer(layerTextView);
    canvas.addLayer(layerTextEdit);
    Ui_1.Ui.bindButtonOnClick("buttonNewPolyline", () => {
        layerTextEdit.finishEditing();
        layerPolylineEdit.startCreatingPolyline();
    });
    Ui_1.Ui.bindButtonOnClick("polylineButtonDelete", () => {
        layerPolylineEdit.deleteEditing();
        layerPolylineEdit.deleteCreating();
        layerTextEdit.finishEditing();
        layerPolylineEdit.finishEditing();
    });
    Ui_1.Ui.bindButtonOnClick("buttonNewText", () => {
        layerPolylineEdit.finishEditing();
        layerTextEdit.startCreatingText();
    });
    Ui_1.Ui.bindButtonOnClick("textButtonDelete", () => {
        layerPolylineEdit.finishEditing();
        layerTextEdit.deleteEditing();
        layerTextEdit.finishEditing();
    });
    class App {
        constructor() {
            this.currentMapName = null;
            this.issueLink = "";
            this.currentCommentId = 0;
            this.dummyData = null;
        }
        start() {
            NetUtil_1.NetUtil.get("https://misdake.github.io/ChipAnnotationData/list.txt", text => {
                let defaultMap = null;
                let lines = [];
                let maps = {};
                let names = [];
                if (text && text.length) {
                    lines = text.split("\n").filter(value => value.length > 0).map(value => value.trim());
                    for (let line of lines) {
                        let name = line.substring(line.lastIndexOf('/') + 1);
                        names.push(name);
                        maps[name] = line;
                    }
                    if (lines.length > 0) {
                        defaultMap = names[0];
                    }
                }
                if (!defaultMap)
                    defaultMap = "Fiji";
                let url_string = window.location.href;
                let url = new URL(url_string);
                let mapName = url.searchParams.get("map") || defaultMap;
                let commentIdString = url.searchParams.get("commentId") || "0";
                this.currentCommentId = parseInt(commentIdString);
                Ui_1.Ui.bindSelect("mapSelect", names, mapName, (index, newMap) => {
                    this.currentCommentId = 0;
                    this.loadMap(newMap, maps[newMap]);
                    this.replaceUrl();
                });
                this.loadMap(mapName, maps[mapName]);
            });
        }
        loadMap(mapName, mapString) {
            this.currentMapName = mapName;
            NetUtil_1.NetUtil.get(mapString + "/content.json", mapDesc => {
                let map = JSON.parse(mapDesc);
                canvas.loadMap(map);
                canvas.requestRender();
                this.issueLink = GithubUtil_1.Github.getIssueLink(map.githubRepo, map.githubIssueId);
                Ui_1.Ui.bindButtonOnClick("buttonSave", () => {
                    layerTextEdit.finishEditing();
                    layerPolylineEdit.finishEditing();
                    let data = canvas.save();
                    data.title = document.getElementById("dataTitle").value;
                    if (data.title == null || data.title == "") {
                        data.title = "untitled";
                    }
                    let dataString = JSON.stringify(data);
                    Ui_1.Ui.bindValue("dataOutput", dataString, newValue => {
                    });
                    Ui_1.Ui.copyToClipboard("dataOutput");
                    Ui_1.Ui.bindValue("dataOutput", "", newValue => {
                    });
                    if (this.issueLink) {
                        window.open(this.issueLink, '_blank');
                    }
                });
                Ui_1.Ui.bindValue("dataOutput", "", newValue => {
                });
                Ui_1.Ui.bindValue("dataTitle", "", newValue => {
                });
                Ui_1.Ui.bindSelect("dataSelect", [], null, index => {
                });
                this.dummyData = new Data_1.Data();
                this.dummyData.title = "";
                canvas.loadData(this.dummyData);
                Ui_1.Ui.bindValue("dataOutput", "", newValue => {
                });
                this.loadGithubComment(map, this.currentCommentId);
                Ui_1.Ui.bindButtonOnClick("buttonRefreshData", () => {
                    this.loadGithubComment(map, this.currentCommentId);
                });
            });
        }
        loadGithubComment(map, commentId) {
            if (map.githubRepo && map.githubIssueId) {
                GithubUtil_1.Github.getComments(map.githubRepo, map.githubIssueId, comments => {
                    let list = [];
                    let entries = [];
                    let items = [];
                    list.push(null);
                    entries.push(this.dummyData);
                    items.push("(empty)");
                    let startIndex = 0;
                    let startData = this.dummyData;
                    let startCommentId = 0;
                    for (let comment of comments) {
                        try {
                            let data = JSON.parse(comment.body);
                            if (data.polylines != null && data.texts != null) {
                                if (data.title == null || data.title == "") {
                                    data.title = "untitled";
                                }
                                list.push(comment);
                                entries.push(data);
                                items.push(data.title + " @" + comment.user.login);
                                if (commentId == comment.id) {
                                    startIndex = list.length - 1;
                                    startData = data;
                                    startCommentId = comment.id;
                                }
                            }
                        }
                        catch (e) {
                        }
                    }
                    Ui_1.Ui.bindSelect("dataSelect", items, items[startIndex], index => {
                        let comment = list[index];
                        let data = entries[index];
                        this.loadData(map, data, comment ? comment.id : 0);
                    });
                    this.loadData(map, startData, startCommentId);
                });
            }
        }
        loadData(map, data, commentId) {
            Ui_1.Ui.bindValue("dataTitle", data.title, newValue => {
            });
            this.currentCommentId = commentId;
            if (commentId > 0) {
                this.issueLink = GithubUtil_1.Github.getCommentLink(map.githubRepo, map.githubIssueId, commentId);
            }
            else {
                this.issueLink = GithubUtil_1.Github.getIssueLink(map.githubRepo, map.githubIssueId);
            }
            Ui_1.Ui.bindValue("dataOutput", "", newValue => {
            });
            canvas.loadData(data);
            this.replaceUrl();
            canvas.requestRender();
        }
        replaceUrl() {
            let url = location.pathname + '?map=' + this.currentMapName;
            if (this.currentCommentId > 0)
                url += '&commentId=' + this.currentCommentId;
            history.replaceState(null, "", url);
        }
    }
    new App().start();
});
//# sourceMappingURL=App.js.map;

define('Renderer',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Renderer = /** @class */ (function () {
        function Renderer(canvas, canvasElement, context) {
            this.canvas = canvas;
            this.canvasElement = canvasElement;
            this.context = context;
        }
        Renderer.prototype.clear = function () {
            this.context.fillStyle = "#000000";
            this.context.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        };
        Renderer.prototype.setColor = function (color) {
            this.context.fillStyle = color;
            this.context.strokeStyle = color;
        };
        Renderer.prototype.image = function (camera, image, x, y, width, height) {
            //transform to screen space
            var point = camera.canvasXyToScreen(x, y);
            var targetW = camera.canvasSizeToScreen(width);
            var targetH = camera.canvasSizeToScreen(height);
            //skip out-of-screen images
            if (point.x > this.canvas.getWidth() || point.y > this.canvas.getHeight())
                return;
            if (point.x + targetW < 0 || point.y + targetH < 0)
                return;
            this.context.drawImage(image, point.x, point.y, targetW, targetH);
        };
        return Renderer;
    }());
    exports.Renderer = Renderer;
});
//# sourceMappingURL=Renderer.js.map;
define('Point',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Point = /** @class */ (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    }());
    exports.Point = Point;
});
//# sourceMappingURL=Point.js.map;
define('Camera',["require", "exports", "./Point"], function (require, exports, Point_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Camera = /** @class */ (function () {
        function Camera() {
        }
        Camera.prototype.load = function (canvas, content) {
            this.canvas = canvas;
            this.zoomMin = 0;
            this.zoomMax = content.maxLevel;
            this.zoom = content.maxLevel;
            this.checkZoom();
            this.x = content.width / 2;
            this.y = content.height / 2;
            this.xMin = 0;
            this.xMax = content.width;
            this.yMin = 0;
            this.yMax = content.height;
        };
        Camera.prototype.setXy = function (x, y) {
            this.x = x;
            this.y = y;
            this.checkXy();
        };
        Camera.prototype.moveXy = function (dx, dy) {
            this.x += dx;
            this.y += dy;
            this.checkXy();
        };
        Camera.prototype.getX = function () {
            return this.x;
        };
        Camera.prototype.getY = function () {
            return this.y;
        };
        Camera.prototype.checkXy = function () {
            this.x = Math.min(Math.max(this.x, this.xMin), this.xMax);
            this.y = Math.min(Math.max(this.y, this.yMin), this.yMax);
        };
        Camera.prototype.getZoom = function () {
            return this.zoom;
        };
        Camera.prototype.changeZoomBy = function (amount) {
            this.zoom += amount;
            this.checkZoom();
        };
        Camera.prototype.setZoomTo = function (zoom) {
            this.zoom = zoom;
            this.checkZoom();
        };
        Camera.prototype.checkZoom = function () {
            this.zoom = Math.min(Math.max(this.zoom, this.zoomMin), this.zoomMax);
        };
        Camera.prototype.action = function () {
            this.checkXy();
            this.checkZoom();
            var scale = 1.0 / (1 << this.zoom);
            this.scale = scale;
            this.tx = this.canvas.getWidth() / 2 - this.x * scale;
            this.ty = this.canvas.getHeight() / 2 - this.y * scale;
        };
        Camera.prototype.screenPointToCanvas = function (point) {
            return this.screenXyToCanvas(point.x, point.y);
        };
        Camera.prototype.screenXyToCanvas = function (x, y) {
            var targetX = (x - this.tx) / this.scale;
            var targetY = (y - this.ty) / this.scale;
            return new Point_1.Point(targetX, targetY);
        };
        Camera.prototype.canvasPointToScreen = function (point) {
            return this.canvasXyToScreen(point.x, point.y);
        };
        Camera.prototype.canvasXyToScreen = function (x, y) {
            var targetX = x * this.scale + this.tx;
            var targetY = y * this.scale + this.ty;
            return new Point_1.Point(targetX, targetY);
        };
        Camera.prototype.screenSizeToCanvas = function (s) {
            return s / this.scale;
        };
        Camera.prototype.canvasSizeToScreen = function (s) {
            return s * this.scale;
        };
        return Camera;
    }());
    exports.Camera = Camera;
});
//# sourceMappingURL=Camera.js.map;
define('Canvas',["require", "exports", "./Renderer", "./Camera"], function (require, exports, Renderer_1, Camera_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Canvas = /** @class */ (function () {
        function Canvas(domElement, id) {
            this.renderNext = false;
            this.domElement = domElement;
            this.domElement.innerHTML = "<canvas id=\"" + id + "\" style='width:100%;height:100%;overflow:hidden;position:absolute'></canvas>";
            this.canvasElement = document.getElementById(id);
            this.context = this.canvasElement.getContext("2d");
            this.camera = new Camera_1.Camera();
            this.renderer = new Renderer_1.Renderer(this, this.canvasElement, this.context);
            this.width = this.canvasElement.clientWidth;
            this.height = this.canvasElement.clientHeight;
            var self = this;
            window.addEventListener('resize', function () {
                self.requestRender();
            });
        }
        Canvas.prototype.init = function () {
            this.layers = [];
            var self = this;
            this.canvasElement.onmousewheel = function (event) {
                self.camera.action();
                var point1 = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                self.camera.changeZoomBy(event.wheelDelta > 0 ? -1 : 1);
                self.camera.action();
                var point2 = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                var dx = point1.x - point2.x;
                var dy = point1.y - point2.y;
                self.camera.moveXy(dx, dy);
                self.requestRender();
            };
            var lastX = -1;
            var lastY = -1;
            this.canvasElement.onmousedown = function (event) {
                lastX = event.offsetX;
                lastY = event.offsetY;
            };
            this.canvasElement.onmousemove = function (event) {
                if (event.buttons > 0) {
                    self.camera.action();
                    var point1 = self.camera.screenXyToCanvas(lastX, lastY);
                    var point2 = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    var dx = point1.x - point2.x;
                    var dy = point1.y - point2.y;
                    self.camera.moveXy(dx, dy);
                    lastX = event.offsetX;
                    lastY = event.offsetY;
                    self.requestRender();
                }
            };
        };
        Canvas.prototype.addLayer = function (layer) {
            this.layers.push(layer);
        };
        Canvas.prototype.getLayer = function () {
            //TODO
        };
        Canvas.prototype.getWidth = function () {
            return this.width;
        };
        Canvas.prototype.getHeight = function () {
            return this.height;
        };
        Canvas.prototype.requestRender = function () {
            if (this.renderNext)
                return;
            this.renderNext = true;
            var self = this;
            requestAnimationFrame(function () {
                self.renderNext = false;
                self.render();
            });
        };
        Canvas.prototype.load = function (content, folder) {
            this.camera.load(this, content);
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.load(this, content, folder);
            }
        };
        Canvas.prototype.render = function () {
            this.width = this.canvasElement.clientWidth;
            this.height = this.canvasElement.clientHeight;
            if (this.canvasElement.width !== this.width)
                this.canvasElement.width = this.width;
            if (this.canvasElement.height !== this.height)
                this.canvasElement.height = this.height;
            this.camera.action();
            this.renderer.clear();
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.render(this, this.renderer, this.camera);
            }
        };
        return Canvas;
    }());
    exports.Canvas = Canvas;
});
//# sourceMappingURL=Canvas.js.map;
define('util/NetUtil',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NetUtil = /** @class */ (function () {
        function NetUtil() {
        }
        NetUtil.get = function (url, callback) {
            var request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState == 4 && request.status == 200) {
                    callback(request.responseText);
                }
            };
            request.open("GET", url, true);
            request.send();
        };
        return NetUtil;
    }());
    exports.NetUtil = NetUtil;
});
//# sourceMappingURL=NetUtil.js.map;
define('Layer',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Layer = /** @class */ (function () {
        function Layer(name, renderOrder) {
            this.name = name;
            this.renderOrder = renderOrder;
        }
        Layer.prototype.load = function (canvas, content, folder) {
        };
        Layer.prototype.render = function (canvas, renderer, camera) {
        };
        Layer.prototype.unload = function () {
        };
        return Layer;
    }());
    exports.Layer = Layer;
});
//# sourceMappingURL=Layer.js.map;
define('drawable/Drawable',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Drawable = /** @class */ (function () {
        function Drawable() {
            //TODO
            // x, y, scaleX, scaleY, rotate
            this.color = null;
        }
        Drawable.prototype.setColor = function (color) {
            this.color = color;
        };
        Drawable.prototype.getColor = function () {
            return this.color;
        };
        Drawable.prototype.render = function (canvas, renderer, camera) {
            if (this.color)
                renderer.setColor(this.color);
        };
        return Drawable;
    }());
    exports.Drawable = Drawable;
});
//# sourceMappingURL=Drawable.js.map;
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('drawable/Img',["require", "exports", "./Drawable"], function (require, exports, Drawable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Img = /** @class */ (function (_super) {
        __extends(Img, _super);
        function Img(src, x, y, w, h, onload) {
            var _this = _super.call(this) || this;
            _this.x = x;
            _this.y = y;
            _this.w = w;
            _this.h = h;
            _this.img = new Image();
            _this.img.src = src;
            var self = _this;
            _this.img.onload = function (ev) {
                if (onload)
                    onload(self);
            };
            return _this;
        }
        Img.prototype.render = function (canvas, renderer, camera) {
            renderer.image(camera, this.img, this.x, this.y, this.w, this.h);
        };
        return Img;
    }(Drawable_1.Drawable));
    exports.Img = Img;
});
//# sourceMappingURL=Img.js.map;
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('layers/LayerImage',["require", "exports", "../Layer", "../drawable/Img"], function (require, exports, Layer_1, Img_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LayerImage = /** @class */ (function (_super) {
        __extends(LayerImage, _super);
        function LayerImage() {
            return _super.call(this, "image", 0) || this;
        }
        LayerImage.prototype.load = function (canvas, content, folder) {
            _super.prototype.load.call(this, canvas, content, folder);
            this.content = content;
            this.maxLevel = content.maxLevel;
            this.baseFolder = folder;
            this.currentZoom = -1;
        };
        LayerImage.prototype.prepare = function (camera, canvas) {
            var zoom = camera.getZoom();
            if (this.currentZoom === zoom)
                return;
            this.currentZoom = zoom;
            var targetSize = this.content.tileSize << zoom;
            var levelData = this.content.levels[zoom];
            this.xCount = levelData.xMax;
            this.yCount = levelData.yMax;
            this.imageMatrix = [];
            for (var i = 0; i < this.xCount; i++) {
                this.imageMatrix[i] = [];
                for (var j = 0; j < this.yCount; j++) {
                    this.imageMatrix[i][j] = new Img_1.Img(this.baseFolder + "/" + zoom + "/" + i + "_" + j + ".jpg", i * targetSize, j * targetSize, targetSize, targetSize, function (image) {
                        canvas.requestRender();
                    });
                }
            }
        };
        LayerImage.prototype.render = function (canvas, renderer, camera) {
            _super.prototype.render.call(this, canvas, renderer, camera);
            this.prepare(camera, canvas);
            if (this.imageMatrix) {
                for (var i = 0; i < this.xCount; i++) {
                    for (var j = 0; j < this.yCount; j++) {
                        this.imageMatrix[i][j].render(canvas, renderer, camera);
                    }
                }
            }
        };
        LayerImage.prototype.unload = function () {
            _super.prototype.unload.call(this);
        };
        return LayerImage;
    }(Layer_1.Layer));
    exports.LayerImage = LayerImage;
});
//# sourceMappingURL=LayerImage.js.map;
define('Main',["require", "exports", "./Canvas", "./util/NetUtil", "./layers/LayerImage"], function (require, exports, Canvas_1, NetUtil_1, LayerImage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var canvas = new Canvas_1.Canvas(document.getElementById("container"), 'canvas2d');
    canvas.init();
    var layerImage = new LayerImage_1.LayerImage();
    canvas.addLayer(layerImage);
    NetUtil_1.NetUtil.get("data/fiji/content.json", function (text) {
        var content = JSON.parse(text);
        canvas.load(content, "data/fiji");
        canvas.requestRender();
    });
});
//# sourceMappingURL=Main.js.map;

define('util/ScreenRect',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ScreenRect = /** @class */ (function () {
        function ScreenRect(left, top, width, height) {
            this.left = left;
            this.top = top;
            this.width = width;
            this.height = height;
        }
        return ScreenRect;
    }());
    exports.ScreenRect = ScreenRect;
});
//# sourceMappingURL=ScreenRect.js.map;
define('Renderer',["require", "exports", "./util/ScreenRect"], function (require, exports, ScreenRect_1) {
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
        Renderer.prototype.setFillColor = function (color) {
            this.context.fillStyle = color;
        };
        Renderer.prototype.setStrokeColor = function (color) {
            this.context.strokeStyle = color;
        };
        Renderer.prototype.calculateLineWidth = function (camera, lineWidth) {
            if (!lineWidth)
                return 1;
            var onScreen = lineWidth.onScreen;
            var onCanvas = camera.canvasSizeToScreen(lineWidth.onCanvas);
            var ofScreenSize = lineWidth.ofScreen * Math.min(this.canvasElement.width, this.canvasElement.height);
            return onScreen + onCanvas + ofScreenSize;
        };
        //---------------------------------------------
        //polyline
        Renderer.prototype.renderPolyline = function (camera, points, closed, fill, stroke, lineWidth) {
            if (points.length == 0)
                return;
            this.context.lineWidth = this.calculateLineWidth(camera, lineWidth);
            this.context.beginPath();
            var start = camera.canvasToScreen(points[0].x, points[0].y);
            this.context.moveTo(start.x, start.y);
            for (var i = 1; i < points.length; i++) {
                var point = camera.canvasToScreen(points[i].x, points[i].y);
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
        };
        //polyline
        //---------------------------------------------
        //---------------------------------------------
        //image
        Renderer.prototype.testImageVisibility = function (camera, image, transform, width, height, range) {
            //transform to screen space
            var point = camera.canvasToScreen(transform.position.x, transform.position.y);
            var targetW = camera.canvasSizeToScreen(width);
            var targetH = camera.canvasSizeToScreen(height);
            //skip out-of-screen images
            if (point.x - range > this.canvas.getWidth() || point.y - range > this.canvas.getHeight())
                return null;
            if (point.x + targetW + range < 0 || point.y + targetH + range < 0)
                return null;
            return new ScreenRect_1.ScreenRect(point.x, point.y, targetW, targetH);
        };
        Renderer.prototype.renderImage = function (camera, image, transform, width, height) {
            var rect = this.testImageVisibility(camera, image, transform, width, height, 0);
            this.drawImage(image, rect);
        };
        Renderer.prototype.drawImage = function (image, rect) {
            if (rect) {
                //actually render image
                this.context.drawImage(image, rect.left, rect.top, rect.width, rect.height);
            }
        };
        //image
        //---------------------------------------------
        //---------------------------------------------
        //circle
        Renderer.prototype.renderCircle = function (camera, x, y, radius, fill, stroke, lineWidth) {
            var position = camera.canvasToScreen(x, y);
            var size = camera.canvasSizeToScreen(radius);
            this.drawCircle(position.x, position.y, size, fill, stroke);
            this.context.lineWidth = this.calculateLineWidth(camera, lineWidth);
        };
        Renderer.prototype.drawCircle = function (x, y, radius, fill, stroke, lineWidth) {
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
        };
        //circle
        //---------------------------------------------
        //---------------------------------------------
        //text
        Renderer.prototype.renderText = function (camera, text, fontSize, x, y, anchorX, anchorY) {
            var position = camera.canvasToScreen(x, y);
            var size = this.calculateLineWidth(camera, fontSize);
            this.drawText(text, size, position.x, position.y, anchorX, anchorY);
        };
        Renderer.prototype.drawText = function (text, fontSize, x, y, anchorX, anchorY) {
            this.context.textAlign = anchorX;
            this.context.textBaseline = anchorY;
            this.context.font = fontSize + "px Arial";
            this.context.fillText(text, x, y);
        };
        return Renderer;
    }());
    exports.Renderer = Renderer;
});
//# sourceMappingURL=Renderer.js.map;
define('util/Transform',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Transform = /** @class */ (function () {
        function Transform() {
            this.position = new Position(0, 0);
        }
        return Transform;
    }());
    exports.Transform = Transform;
    var Position = /** @class */ (function () {
        function Position(x, y) {
            this.x = x;
            this.y = y;
        }
        return Position;
    }());
    exports.Position = Position;
});
//# sourceMappingURL=Transform.js.map;
define('Camera',["require", "exports", "./util/Transform"], function (require, exports, Transform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Camera = /** @class */ (function () {
        function Camera() {
            this.position = new Transform_1.Position(0, 0);
        }
        Camera.prototype.load = function (canvas, map) {
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
        };
        Camera.prototype.moveXy = function (dx, dy) {
            this.position.x += dx;
            this.position.y += dy;
            this.checkXy();
        };
        Camera.prototype.checkXy = function () {
            this.position.x = Math.min(Math.max(this.position.x, this.xMin), this.xMax);
            this.position.y = Math.min(Math.max(this.position.y, this.yMin), this.yMax);
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
            this.tx = this.canvas.getWidth() / 2 - this.position.x * scale;
            this.ty = this.canvas.getHeight() / 2 - this.position.y * scale;
        };
        Camera.prototype.screenXyToCanvas = function (x, y) {
            var targetX = (x - this.tx) / this.scale;
            var targetY = (y - this.ty) / this.scale;
            return new Transform_1.Position(targetX, targetY);
        };
        Camera.prototype.canvasToScreen = function (x, y) {
            var targetX = x * this.scale + this.tx;
            var targetY = y * this.scale + this.ty;
            return new Transform_1.Position(targetX, targetY);
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
define('data/Data',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Data = /** @class */ (function () {
        function Data() {
        }
        return Data;
    }());
    exports.Data = Data;
});
//# sourceMappingURL=Data.js.map;
define('Canvas',["require", "exports", "./Renderer", "./Camera", "./data/Data"], function (require, exports, Renderer_1, Camera_1, Data_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Canvas = /** @class */ (function () {
        function Canvas(domElement, id) {
            this.renderNext = false;
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
            var self = this;
            window.addEventListener('resize', function () {
                self.requestRender();
            });
        }
        Canvas.prototype.getCamera = function () {
            return this.camera;
        };
        Canvas.prototype.init = function () {
            var _this = this;
            this.layers = [];
            this.canvasElement.onclick = function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var length = _this.layers.length;
                for (var i = length - 1; i >= 0; i--) {
                    var layer = _this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onclick(event))
                        break;
                }
            };
            this.canvasElement.ondblclick = function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var length = _this.layers.length;
                for (var i = length - 1; i >= 0; i--) {
                    var layer = _this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.ondblclick(event))
                        break;
                }
            };
            this.canvasElement.onwheel = function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var length = _this.layers.length;
                for (var i = length - 1; i >= 0; i--) {
                    var layer = _this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onwheel(event))
                        break;
                }
            };
            this.canvasElement.onmousedown = function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var length = _this.layers.length;
                for (var i = length - 1; i >= 0; i--) {
                    var layer = _this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onmousedown(event))
                        break;
                }
            };
            this.canvasElement.onmouseup = function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var length = _this.layers.length;
                for (var i = length - 1; i >= 0; i--) {
                    var layer = _this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onmouseup(event))
                        break;
                }
            };
            this.canvasElement.onmousemove = function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var length = _this.layers.length;
                for (var i = length - 1; i >= 0; i--) {
                    var layer = _this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onmousemove(event))
                        break;
                }
            };
            this.canvasElement.onmouseout = function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var length = _this.layers.length;
                for (var i = length - 1; i >= 0; i--) {
                    var layer = _this.layers[i];
                    if (layer.mouseListener && layer.mouseListener.onmouseout(event))
                        break;
                }
            };
            this.canvasElement.onkeydown = function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var length = _this.layers.length;
                for (var i = length - 1; i >= 0; i--) {
                    var layer = _this.layers[i];
                    if (layer.keyboardListener && layer.keyboardListener.onkeydown(event))
                        break;
                }
            };
            this.canvasElement.onkeyup = function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var length = _this.layers.length;
                for (var i = length - 1; i >= 0; i--) {
                    var layer = _this.layers[i];
                    if (layer.keyboardListener && layer.keyboardListener.onkeyup(event))
                        break;
                }
            };
            this.canvasElement.onkeypress = function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var length = _this.layers.length;
                for (var i = length - 1; i >= 0; i--) {
                    var layer = _this.layers[i];
                    if (layer.keyboardListener && layer.keyboardListener.onkeypress(event))
                        break;
                }
            };
        };
        Canvas.prototype.addLayer = function (layer) {
            this.layers.push(layer);
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
        Canvas.prototype.load = function (map, data, folder) {
            this.camera.load(this, map);
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.load(map, data, folder);
            }
        };
        Canvas.prototype.save = function () {
            var data = new Data_1.Data();
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.save(data);
            }
            return data;
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
                layer.render(this.renderer);
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
        function Layer(name, canvas) {
            this._mouseListener = null;
            this._keyboardListener = null;
            this.name = name;
            this.canvas = canvas;
            this.camera = canvas.getCamera();
        }
        Object.defineProperty(Layer.prototype, "mouseListener", {
            get: function () {
                return this._mouseListener;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Layer.prototype, "keyboardListener", {
            get: function () {
                return this._keyboardListener;
            },
            enumerable: true,
            configurable: true
        });
        Layer.prototype.load = function (map, data, folder) {
        };
        Layer.prototype.save = function (data) {
        };
        Layer.prototype.render = function (renderer) {
        };
        Layer.prototype.unload = function () {
        };
        return Layer;
    }());
    exports.Layer = Layer;
});
//# sourceMappingURL=Layer.js.map;
define('drawable/Drawable',["require", "exports", "../util/Transform"], function (require, exports, Transform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Drawable = /** @class */ (function () {
        function Drawable() {
            this.transformation = new Transform_1.Transform();
        }
        Drawable.prototype.render = function (canvas, renderer, camera) {
        };
        return Drawable;
    }());
    exports.Drawable = Drawable;
});
//# sourceMappingURL=Drawable.js.map;
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('drawable/DrawableImage',["require", "exports", "./Drawable"], function (require, exports, Drawable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DrawableImage = /** @class */ (function (_super) {
        __extends(DrawableImage, _super);
        function DrawableImage(src, x, y, w, h, onload) {
            var _this = _super.call(this) || this;
            _this.transformation.position.x = x;
            _this.transformation.position.y = y;
            _this.w = w;
            _this.h = h;
            _this.img = new Image();
            // img.src is not set, will be set and image will start loading once it is visible to camera.
            _this.src = src;
            _this.loaded = false;
            var self = _this;
            _this.img.onload = function (ev) {
                _this.loaded = true;
                if (onload)
                    onload(self);
            };
            return _this;
        }
        DrawableImage.prototype.loadIfNotLoaded = function () {
            if (!this.loading) {
                this.loading = true;
                this.img.src = this.src;
            }
        };
        DrawableImage.prototype.render = function (canvas, renderer, camera) {
            var rect = renderer.testImageVisibility(camera, this.img, this.transformation, this.w, this.h, 100);
            if (rect) {
                this.loadIfNotLoaded();
                if (this.loaded) {
                    renderer.drawImage(this.img, rect);
                }
            }
        };
        return DrawableImage;
    }(Drawable_1.Drawable));
    exports.DrawableImage = DrawableImage;
});
//# sourceMappingURL=DrawableImage.js.map;
define('MouseListener',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MouseListener = /** @class */ (function () {
        function MouseListener() {
        }
        MouseListener.prototype.onclick = function (event) {
            return false;
        };
        MouseListener.prototype.ondblclick = function (event) {
            return false;
        };
        MouseListener.prototype.onwheel = function (event) {
            return false;
        };
        MouseListener.prototype.onmousedown = function (event) {
            return false;
        };
        MouseListener.prototype.onmouseup = function (event) {
            return false;
        };
        MouseListener.prototype.onmousemove = function (event) {
            return false;
        };
        MouseListener.prototype.onmouseout = function (event) {
            return false;
        };
        return MouseListener;
    }());
    exports.MouseListener = MouseListener;
});
//# sourceMappingURL=MouseListener.js.map;
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('layers/LayerImage',["require", "exports", "../Layer", "../drawable/DrawableImage", "../MouseListener"], function (require, exports, Layer_1, DrawableImage_1, MouseListener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LayerImage = /** @class */ (function (_super) {
        __extends(LayerImage, _super);
        function LayerImage(canvas) {
            return _super.call(this, "image", canvas) || this;
        }
        LayerImage.prototype.load = function (map, data, folder) {
            this.map = map;
            this.maxLevel = map.maxLevel;
            this.baseFolder = folder;
            this.currentZoom = -1;
            var self = this;
            this._mouseListener = new /** @class */ (function (_super) {
                __extends(class_1, _super);
                function class_1() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.lastX = -1;
                    _this.lastY = -1;
                    return _this;
                }
                class_1.prototype.onwheel = function (event) {
                    var camera = self.canvas.getCamera();
                    camera.action();
                    var point1 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    camera.changeZoomBy(event.wheelDelta > 0 ? -1 : 1);
                    camera.action();
                    var point2 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    var dx = point1.x - point2.x;
                    var dy = point1.y - point2.y;
                    camera.moveXy(dx, dy);
                    self.canvas.requestRender();
                    return true;
                };
                class_1.prototype.onmousedown = function (event) {
                    this.lastX = event.offsetX;
                    this.lastY = event.offsetY;
                    return true;
                };
                class_1.prototype.onmousemove = function (event) {
                    if (event.buttons > 0) {
                        var camera = self.canvas.getCamera();
                        camera.action();
                        var point1 = camera.screenXyToCanvas(this.lastX, this.lastY);
                        var point2 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        var dx = point1.x - point2.x;
                        var dy = point1.y - point2.y;
                        camera.moveXy(dx, dy);
                        this.lastX = event.offsetX;
                        this.lastY = event.offsetY;
                        self.canvas.requestRender();
                        return true;
                    }
                    else {
                        return false;
                    }
                };
                return class_1;
            }(MouseListener_1.MouseListener));
        };
        LayerImage.prototype.prepare = function (camera, canvas) {
            var zoom = camera.getZoom();
            if (this.currentZoom === zoom)
                return;
            this.currentZoom = zoom;
            var targetSize = this.map.tileSize << zoom;
            var levelData = this.map.levels[zoom];
            this.xCount = levelData.xMax;
            this.yCount = levelData.yMax;
            this.imageMatrix = [];
            for (var i = 0; i < this.xCount; i++) {
                this.imageMatrix[i] = [];
                for (var j = 0; j < this.yCount; j++) {
                    this.imageMatrix[i][j] = new DrawableImage_1.DrawableImage(this.baseFolder + "/" + zoom + "/" + i + "_" + j + ".jpg", i * targetSize, j * targetSize, targetSize, targetSize, function (image) {
                        canvas.requestRender();
                    });
                }
            }
        };
        LayerImage.prototype.render = function (renderer) {
            this.prepare(this.camera, this.canvas);
            if (this.imageMatrix) {
                for (var i = 0; i < this.xCount; i++) {
                    for (var j = 0; j < this.yCount; j++) {
                        this.imageMatrix[i][j].render(this.canvas, renderer, this.camera);
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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('drawable/DrawablePolyline',["require", "exports", "./Drawable"], function (require, exports, Drawable_1) {
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
    var PointSegmentResult = /** @class */ (function () {
        function PointSegmentResult(position, p1Index, p2Index, distance) {
            this.position = position;
            this.p1Index = p1Index;
            this.p2Index = p2Index;
            this.distance = distance;
        }
        return PointSegmentResult;
    }());
    exports.PointSegmentResult = PointSegmentResult;
    var DrawablePolylinePack = /** @class */ (function () {
        function DrawablePolylinePack(points, closed, fill, lineWidth) {
            this.points = points;
            this.closed = closed;
            this.fill = fill;
            this.stroke = true; //TODO add to parameter
            this.lineWidth = lineWidth;
        }
        return DrawablePolylinePack;
    }());
    exports.DrawablePolylinePack = DrawablePolylinePack;
    var DrawablePolyline = /** @class */ (function (_super) {
        __extends(DrawablePolyline, _super);
        function DrawablePolyline(pack) {
            var _this = _super.call(this) || this;
            //TODO for each field, copy
            _this.closed = pack.closed;
            _this.fill = pack.fill;
            _this.stroke = pack.stroke;
            _this.fillColor = pack.fillColor;
            _this.strokeColor = pack.strokeColor;
            _this.lineWidth = pack.lineWidth;
            _this.points = pack.points;
            return _this;
        }
        DrawablePolyline.prototype.render = function (canvas, renderer, camera) {
            if (this.fillColor)
                renderer.setFillColor(this.fillColor);
            if (this.strokeColor)
                renderer.setStrokeColor(this.strokeColor);
            renderer.renderPolyline(camera, this.points, this.closed, this.fill, this.stroke, this.lineWidth);
        };
        DrawablePolyline.sqr = function (dx, dy) {
            return dx * dx + dy * dy;
        };
        DrawablePolyline.testPointSegment = function (points, i1, i2, x, y) {
            var p1 = points[i1];
            var p2 = points[i2];
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            var dd = DrawablePolyline.sqr(dx, dy);
            if (dd < 0.0001)
                return null;
            var scalar = ((x - p1.x) * dx + (y - p1.y) * dy) / dd;
            if (scalar > 1)
                scalar = 1;
            if (scalar < 0)
                scalar = 0;
            var tx = p1.x + scalar * dx;
            var ty = p1.y + scalar * dy;
            var distance2 = DrawablePolyline.sqr(x - tx, y - ty);
            return new PointSegmentResult(new Point(tx, ty), i1, i2, Math.sqrt(distance2));
        };
        DrawablePolyline.testPointPolygon = function (points, x, y) {
            var length = points.length;
            var r = false;
            for (var i = 0, j = length - 1; i < length; j = i++) {
                if (((points[i].y > y) != (points[j].y > y)) &&
                    (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x))
                    r = !r;
            }
            return r;
        };
        DrawablePolyline.prototype.pickPoint = function (canvasX, canvasY, radius) {
            var radius2 = radius * radius;
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                if (DrawablePolyline.sqr(point.x - canvasX, point.y - canvasY) <= radius2) {
                    return point;
                }
            }
            return null;
        };
        DrawablePolyline.prototype.pickLine = function (canvasX, canvasY, radius) {
            var minResult = null;
            var minDistance = Number.MAX_VALUE;
            var length = this.points.length;
            for (var i = 0, j = length - 1; i < length; j = i++) {
                var result = DrawablePolyline.testPointSegment(this.points, i, j, canvasX, canvasY);
                if (result && result.distance < radius) {
                    if (result.distance < minDistance) {
                        minDistance = result.distance;
                        minResult = result;
                    }
                }
            }
            return minResult;
        };
        DrawablePolyline.prototype.pickShape = function (canvasX, canvasY) {
            return DrawablePolyline.testPointPolygon(this.points, canvasX, canvasY);
        };
        return DrawablePolyline;
    }(Drawable_1.Drawable));
    exports.DrawablePolyline = DrawablePolyline;
});
//# sourceMappingURL=DrawablePolyline.js.map;
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('drawable/DrawableText',["require", "exports", "./Drawable"], function (require, exports, Drawable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DrawableTextPack = /** @class */ (function () {
        function DrawableTextPack(text, color, anchorX, anchorY, fontSize, x, y) {
            this.text = "";
            this.text = text;
            this.color = color;
            this.anchorX = anchorX;
            this.anchorY = anchorY;
            this.fontSize = fontSize;
            this.x = x;
            this.y = y;
        }
        return DrawableTextPack;
    }());
    exports.DrawableTextPack = DrawableTextPack;
    var DrawableText = /** @class */ (function (_super) {
        __extends(DrawableText, _super);
        function DrawableText(pack) {
            var _this = _super.call(this) || this;
            _this.text = "";
            _this.text = pack.text;
            _this.color = pack.color;
            _this.anchorX = pack.anchorX;
            _this.anchorY = pack.anchorY;
            _this.fontSize = pack.fontSize;
            _this.x = pack.x;
            _this.y = pack.y;
            return _this;
        }
        DrawableText.prototype.render = function (canvas, renderer, camera) {
            renderer.setColor(this.color);
            renderer.renderText(camera, this.text, this.fontSize, this.x, this.y, this.anchorX, this.anchorY);
        };
        return DrawableText;
    }(Drawable_1.Drawable));
    exports.DrawableText = DrawableText;
});
//# sourceMappingURL=DrawableText.js.map;
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('layers/LayerPolylineView',["require", "exports", "../Layer", "../drawable/DrawablePolyline", "../MouseListener", "../drawable/DrawableText"], function (require, exports, Layer_1, DrawablePolyline_1, MouseListener_1, DrawableText_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LayerPolylineView = /** @class */ (function (_super) {
        __extends(LayerPolylineView, _super);
        function LayerPolylineView(canvas) {
            var _this = _super.call(this, "polyline_view", canvas) || this;
            _this.polylines = [];
            _this.texts = [];
            return _this;
        }
        LayerPolylineView.prototype.setLayer = function (layerPolylineEdit) {
            this.layerPolylineEdit = layerPolylineEdit;
        };
        LayerPolylineView.prepareRect = function (x1, y1, x2, y2) {
            return [
                new DrawablePolyline_1.Point(x1, y1),
                new DrawablePolyline_1.Point(x2, y1),
                new DrawablePolyline_1.Point(x2, y2),
                new DrawablePolyline_1.Point(x1, y2)
            ];
        };
        LayerPolylineView.prototype.load = function (map, data, folder) {
            this.map = map;
            if (data.polylines) {
                for (var _i = 0, _a = data.polylines; _i < _a.length; _i++) {
                    var pack = _a[_i];
                    this.polylines.push(new DrawablePolyline_1.DrawablePolyline(pack));
                }
            }
            if (data.texts) {
                for (var _b = 0, _c = data.texts; _b < _c.length; _b++) {
                    var pack = _c[_b];
                    this.texts.push(new DrawableText_1.DrawableText(pack));
                }
            }
            //listen to mouse click to select polyline
            var self = this;
            this._mouseListener = new /** @class */ (function (_super) {
                __extends(class_1, _super);
                function class_1() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.moved = false;
                    return _this;
                }
                class_1.prototype.onmousedown = function (event) {
                    this.moved = false;
                    return false;
                };
                class_1.prototype.onmouseup = function (event) {
                    if (event.button == 0 && !this.moved) {
                        var radius = self.camera.screenSizeToCanvas(5);
                        var canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        var x = canvasXY.x, y = canvasXY.y;
                        for (var _i = 0, _a = self.polylines; _i < _a.length; _i++) {
                            var polyline = _a[_i];
                            var pickPoint = polyline.pickPoint(x, y, radius);
                            var pickLine = polyline.pickLine(x, y, radius);
                            var pickShape = polyline.pickShape(x, y);
                            if (pickPoint || pickLine || pickShape) {
                                self.layerPolylineEdit.startEditingPolyline(polyline);
                                return true;
                            }
                        }
                        self.layerPolylineEdit.finishEditing();
                        return false;
                    }
                    else {
                        return false;
                    }
                };
                class_1.prototype.onmousemove = function (event) {
                    if ((event.buttons & 1) && (event.movementX != 0 && event.movementY != 0)) {
                        this.moved = true;
                    }
                    return false;
                };
                return class_1;
            }(MouseListener_1.MouseListener));
        };
        LayerPolylineView.prototype.addPolyline = function (polyline) {
            this.polylines.push(polyline);
            this.canvas.requestRender();
        };
        LayerPolylineView.prototype.deletePolyline = function (polyline) {
            var index = this.polylines.indexOf(polyline);
            if (index !== -1) {
                this.polylines.splice(index, 1);
                return true;
            }
            else {
                return false;
            }
        };
        LayerPolylineView.prototype.save = function (data) {
            data.polylines = this.polylines;
            data.texts = this.texts;
        };
        LayerPolylineView.prototype.render = function (renderer) {
            _super.prototype.render.call(this, renderer);
            for (var _i = 0, _a = this.polylines; _i < _a.length; _i++) {
                var polyline = _a[_i];
                polyline.render(this.canvas, renderer, this.camera);
            }
            for (var _b = 0, _c = this.texts; _b < _c.length; _b++) {
                var text = _c[_b];
                text.render(this.canvas, renderer, this.camera);
            }
        };
        LayerPolylineView.prototype.unload = function () {
            _super.prototype.unload.call(this);
        };
        return LayerPolylineView;
    }(Layer_1.Layer));
    exports.LayerPolylineView = LayerPolylineView;
});
//# sourceMappingURL=LayerPolylineView.js.map;
define('util/Size',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Size = /** @class */ (function () {
        function Size(onScreen, onCanvas, ofScreen) {
            this.onScreen = onScreen;
            this.onCanvas = onCanvas ? onCanvas : 0;
            this.ofScreen = ofScreen ? ofScreen : 0;
        }
        return Size;
    }());
    exports.Size = Size;
});
//# sourceMappingURL=Size.js.map;
define('util/Ui',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ColorEntry = /** @class */ (function () {
        function ColorEntry(name, r, g, b) {
            this.name = name;
            this.r = r;
            this.g = g;
            this.b = b;
        }
        return ColorEntry;
    }());
    var AlphaEntry = /** @class */ (function () {
        function AlphaEntry(name, buttonColor, value) {
            this.name = name;
            this.buttonColor = buttonColor;
            this.value = value;
        }
        return AlphaEntry;
    }());
    var Ui = /** @class */ (function () {
        function Ui() {
        }
        Ui.bindButtonOnClick = function (id, onclick) {
            var button = document.getElementById(id);
            button.onclick = onclick;
        };
        Ui.setVisibility = function (id, visible) {
            var element = document.getElementById(id);
            element.style.visibility = visible ? "visible" : "hidden";
        };
        Ui.bindCheckbox = function (id, initialValue, onchange) {
            var checkbox = document.getElementById(id);
            checkbox.checked = initialValue;
            checkbox.onchange = function (ev) {
                onchange(checkbox.checked);
            };
        };
        Ui.bindValue = function (id, initialValue, onchange) {
            var colorPicker = document.getElementById(id);
            colorPicker.value = initialValue;
            colorPicker.onchange = function (ev) {
                onchange(colorPicker.value);
            };
        };
        Ui.bindColor = function (colorContainerId, alphaContainerId, initialColor, initialAlpha, onchange) {
            var colorContainer = document.getElementById(colorContainerId);
            var alphaContainer = document.getElementById(alphaContainerId);
            colorContainer.innerHTML = "";
            alphaContainer.innerHTML = "";
            var thisColor = this.colorValues[0];
            var thisAlpha = this.alphaValues[0];
            for (var _i = 0, _a = Ui.colorValues; _i < _a.length; _i++) {
                var colorValue = _a[_i];
                if (initialColor == colorValue.name) {
                    thisColor = colorValue;
                }
            }
            for (var _b = 0, _c = Ui.alphaValues; _b < _c.length; _b++) {
                var alphaValue = _c[_b];
                if (initialAlpha == alphaValue.name) {
                    thisAlpha = alphaValue;
                }
            }
            for (var _d = 0, _e = Ui.colorValues; _d < _e.length; _d++) {
                var colorValue = _e[_d];
                var id = colorContainerId + "_" + colorValue.name;
                var style = "background:" + colorValue.name;
                colorContainer.innerHTML = colorContainer.innerHTML + "<button id=\"" + id + "\" class=\"configColorButton\" style=\"" + style + "\"></button>\n";
            }
            for (var _f = 0, _g = Ui.alphaValues; _f < _g.length; _f++) {
                var alphaValue = _g[_f];
                var id = alphaContainerId + "_" + alphaValue.name;
                var style = "background:" + alphaValue.buttonColor;
                alphaContainer.innerHTML = alphaContainer.innerHTML + "<button id=\"" + id + "\" class=\"configAlphaButton\" style=\"" + style + "\"></button>\n";
            }
            var _loop_1 = function (colorValue) {
                var id = colorContainerId + "_" + colorValue.name;
                var button = document.getElementById(id);
                button.onclick = function (ev) {
                    thisColor = colorValue;
                    var colorString = "rgba(" + thisColor.r + "," + thisColor.g + "," + thisColor.b + "," + thisAlpha.value + ")";
                    onchange(thisColor.name, thisAlpha.name, colorString);
                };
            };
            for (var _h = 0, _j = Ui.colorValues; _h < _j.length; _h++) {
                var colorValue = _j[_h];
                _loop_1(colorValue);
            }
            var _loop_2 = function (alphaValue) {
                var id = alphaContainerId + "_" + alphaValue.name;
                var button = document.getElementById(id);
                button.onclick = function (ev) {
                    thisAlpha = alphaValue;
                    var colorString = "rgba(" + thisColor.r + "," + thisColor.g + "," + thisColor.b + "," + thisAlpha.value + ")";
                    onchange(thisColor.name, thisAlpha.name, colorString);
                };
            };
            for (var _k = 0, _l = Ui.alphaValues; _k < _l.length; _k++) {
                var alphaValue = _l[_k];
                _loop_2(alphaValue);
            }
        };
        Ui.bindNumber = function (id, initialValue, onchange) {
            var input = document.getElementById(id);
            input.value = initialValue.toString();
            input.onchange = function (ev) {
                var result = parseFloat(input.value);
                if (result >= 0) {
                    onchange(result);
                }
                else {
                    input.value = "0";
                    onchange(0);
                }
            };
        };
        Ui.colorValues = [
            new ColorEntry("gray", 127, 127, 127),
            new ColorEntry("white", 255, 255, 255),
            new ColorEntry("red", 255, 0, 0),
            new ColorEntry("green", 0, 255, 0),
            new ColorEntry("blue", 0, 0, 255),
            new ColorEntry("cyan", 0, 255, 255),
            new ColorEntry("purple", 255, 0, 255),
            new ColorEntry("yellow", 255, 255, 0),
        ];
        Ui.alphaValues = [
            new AlphaEntry("25", "rgb(255,255,255)", 0.25),
            new AlphaEntry("50", "rgb(191,191,191)", 0.50),
            new AlphaEntry("75", "rgb(127,127,127)", 0.75),
            new AlphaEntry("100", "rgb(63,63,63)", 1.00),
        ];
        return Ui;
    }());
    exports.Ui = Ui;
});
//# sourceMappingURL=Ui.js.map;
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('layers/LayerPolylineEdit',["require", "exports", "../Layer", "../drawable/DrawablePolyline", "../util/Size", "../MouseListener", "../util/Ui"], function (require, exports, Layer_1, DrawablePolyline_1, Size_1, MouseListener_1, Ui_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LayerPolylineEdit = /** @class */ (function (_super) {
        __extends(LayerPolylineEdit, _super);
        function LayerPolylineEdit(canvas) {
            var _this = _super.call(this, "polyline_edit", canvas) || this;
            _this.polylineNew = null;
            _this.polylineEdit = null;
            return _this;
        }
        LayerPolylineEdit.prototype.setLayer = function (layerPolylineView) {
            this.layerPolylineView = layerPolylineView;
        };
        LayerPolylineEdit.prototype.load = function (map, data, folder) {
            this.map = map;
            var self = this;
            Ui_1.Ui.bindButtonOnClick("buttonStartEditing", function () { return self.startCreatingPolyline(); });
            Ui_1.Ui.bindButtonOnClick("buttonFinishEditing", function () { return self.finishEditing(); });
            Ui_1.Ui.bindButtonOnClick("buttonDeleteSelected", function () { return self.deleteEditing(); });
            Ui_1.Ui.setVisibility("panelSelected", false);
        };
        LayerPolylineEdit.prototype.startCreatingPolyline = function () {
            this.finishEditing();
            var self = this;
            var points = [];
            this.polylineNew = new DrawablePolyline_1.DrawablePolyline(new DrawablePolyline_1.DrawablePolylinePack(points, true, true, new Size_1.Size(2)));
            this.polylineNew.strokeColor = "rgba(255,255,255,0.5)";
            this.polylineNew.fillColor = "rgba(255,255,255,0.25)";
            this.bindPolyline(this.polylineNew);
            this._mouseListener = new /** @class */ (function (_super) {
                __extends(class_1, _super);
                function class_1() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.down = false;
                    return _this;
                }
                class_1.prototype.preview = function (position) {
                    var xy = points[points.length - 1];
                    xy.x = position.x;
                    xy.y = position.y;
                };
                class_1.prototype.onmousedown = function (event) {
                    if (event.button == 0 && !this.down) { //left button down => add point
                        this.down = true;
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        points.push(new DrawablePolyline_1.Point(position.x, position.y));
                        self.canvas.requestRender();
                        return true;
                    }
                    else {
                        return false;
                    }
                };
                class_1.prototype.onmouseup = function (event) {
                    if (event.button == 0) { //left button up => update last point
                        this.down = false;
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        this.preview(position);
                        self.canvas.requestRender();
                        return true;
                    }
                    else {
                        return false;
                    }
                };
                class_1.prototype.onmousemove = function (event) {
                    if (this.down) { //left button is down => show modification
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        this.preview(position);
                        self.canvas.requestRender();
                        return true;
                    }
                    else {
                        return false;
                    }
                };
                return class_1;
            }(MouseListener_1.MouseListener));
            return this.polylineNew;
        };
        LayerPolylineEdit.prototype.startEditingPolyline = function (polyline) {
            this.finishEditing();
            //show polyline and its point indicators
            this.polylineEdit = polyline;
            this.bindPolyline(this.polylineEdit);
            //start listening to mouse events: drag point, remove point on double click, add point on double click
            var self = this;
            this._mouseListener = new /** @class */ (function (_super) {
                __extends(class_2, _super);
                function class_2() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.down = false;
                    _this.dragPoint = null;
                    return _this;
                }
                class_2.prototype.onmousedown = function (event) {
                    this.dragPoint = null;
                    if (event.button == 0) { //left button down => test drag point
                        this.down = true;
                        //test point
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        var point = polyline.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (point) { //start dragging this point
                            this.dragPoint = point;
                            return true;
                        }
                    }
                    return false;
                };
                class_2.prototype.onmouseup = function (event) {
                    var passEvent = !this.dragPoint; //pass event if not moving point, so that LayerPolylineView will deselect this polyline
                    this.dragPoint = null;
                    if (event.button == 0) { //left button up => nothing
                        this.down = false;
                        return !passEvent;
                    }
                    return false;
                };
                class_2.prototype.ondblclick = function (event) {
                    if (event.button == 0) {
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        //test points
                        var point = polyline.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (point) { //delete point
                            if (polyline.points.length > 3) { //so it will be at least a triangle
                                var index = polyline.points.indexOf(point);
                                if (index !== -1)
                                    polyline.points.splice(index, 1);
                                self.canvas.requestRender();
                            }
                            return true;
                        }
                        //test segments
                        var segment = polyline.pickLine(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (segment) { //add point
                            var newIndex = segment.p1Index; //insert point after p1
                            polyline.points.splice(newIndex, 0, segment.position);
                            self.canvas.requestRender();
                            return true;
                        }
                    }
                    return false;
                };
                class_2.prototype.onmousemove = function (event) {
                    if (this.down) { //left button is down => drag point
                        if (this.dragPoint) {
                            var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                            this.dragPoint.x = position.x;
                            this.dragPoint.y = position.y;
                            self.canvas.requestRender();
                            return true;
                        }
                    }
                    return false;
                };
                return class_2;
            }(MouseListener_1.MouseListener));
            this.canvas.requestRender();
        };
        LayerPolylineEdit.prototype.finishEditing = function () {
            Ui_1.Ui.setVisibility("panelSelected", false);
            if (this.polylineNew) {
                if (this.polylineNew.points.length > 2) {
                    this.layerPolylineView.addPolyline(this.polylineNew);
                }
                this.polylineNew = null;
                this.canvas.requestRender();
            }
            if (this.polylineEdit) {
                this.polylineEdit = null;
                this.canvas.requestRender();
            }
            this._mouseListener = null;
        };
        LayerPolylineEdit.prototype.render = function (renderer) {
            if (this.polylineNew) {
                this.polylineNew.render(this.canvas, renderer, this.camera);
                //draw two points
                var pointCount = this.polylineNew.points.length;
                if (pointCount > 0)
                    this.drawPointCircle(this.polylineNew.points[0], renderer);
                if (pointCount > 1)
                    this.drawPointCircle(this.polylineNew.points[pointCount - 1], renderer);
            }
            if (this.polylineEdit) {
                //draw all points
                for (var _i = 0, _a = this.polylineEdit.points; _i < _a.length; _i++) {
                    var point = _a[_i];
                    this.drawPointCircle(point, renderer);
                }
            }
        };
        LayerPolylineEdit.prototype.drawPointCircle = function (point, renderer) {
            var position = this.camera.canvasToScreen(point.x, point.y);
            renderer.setColor("rgba(255,255,255,1)");
            renderer.drawCircle(position.x, position.y, 5, false, true, 1);
            renderer.setColor("rgba(0,0,0,0.5)");
            renderer.drawCircle(position.x, position.y, 4, true, false);
        };
        LayerPolylineEdit.prototype.deleteEditing = function () {
            if (this.polylineEdit) {
                this.layerPolylineView.deletePolyline(this.polylineEdit);
                this.finishEditing();
            }
        };
        LayerPolylineEdit.prototype.bindPolyline = function (polyline) {
            var _this = this;
            Ui_1.Ui.setVisibility("panelSelected", true);
            Ui_1.Ui.bindCheckbox("checkboxClosed", polyline.closed, function (newValue) {
                polyline.closed = newValue;
                _this.canvas.requestRender();
            });
            Ui_1.Ui.bindCheckbox("checkboxFill", polyline.fill, function (newValue) {
                polyline.fill = newValue;
                _this.canvas.requestRender();
            });
            Ui_1.Ui.bindNumber("textSizeOnScreen", polyline.lineWidth.onScreen, function (newValue) {
                polyline.lineWidth.onScreen = newValue;
                _this.canvas.requestRender();
            });
            Ui_1.Ui.bindNumber("textSizeOnCanvas", polyline.lineWidth.onCanvas, function (newValue) {
                polyline.lineWidth.onCanvas = newValue;
                _this.canvas.requestRender();
            });
            Ui_1.Ui.bindNumber("textSizeOfScreen", polyline.lineWidth.ofScreen * 1000, function (newValue) {
                polyline.lineWidth.ofScreen = newValue * 0.001;
                _this.canvas.requestRender();
            });
            //TODO white,25,50 save in polyline
            Ui_1.Ui.bindColor("strokeColorContainer", "strokeAlphaContainer", "white", "50", function (newColor, newAlpha, colorString) {
                polyline.strokeColor = colorString;
                _this.canvas.requestRender();
            });
            Ui_1.Ui.bindColor("fillColorContainer", "fillAlphaContainer", "white", "25", function (newColor, newAlpha, colorString) {
                polyline.fillColor = colorString;
                _this.canvas.requestRender();
            });
        };
        return LayerPolylineEdit;
    }(Layer_1.Layer));
    exports.LayerPolylineEdit = LayerPolylineEdit;
});
//# sourceMappingURL=LayerPolylineEdit.js.map;
define('util/LZString',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LZString = /** @class */ (function () {
        function LZString() {
        }
        LZString.getBaseValue = function (alphabet, character) {
            if (!LZString.baseReverseDic[alphabet]) {
                LZString.baseReverseDic[alphabet] = {};
                for (var i = 0; i < alphabet.length; i++) {
                    LZString.baseReverseDic[alphabet][alphabet.charAt(i)] = i;
                }
            }
            return LZString.baseReverseDic[alphabet][character];
        };
        LZString.compressToBase64 = function (input) {
            if (input == null)
                return "";
            var res = LZString._compress(input, 6, function (a) {
                return LZString.keyStrBase64.charAt(a);
            });
            switch (res.length % 4) { // To produce valid Base64
                default: // When could this happen ?
                case 0:
                    return res;
                case 1:
                    return res + "===";
                case 2:
                    return res + "==";
                case 3:
                    return res + "=";
            }
        };
        LZString.decompressFromBase64 = function (input) {
            if (input == null)
                return "";
            if (input == "")
                return null;
            return LZString._decompress(input.length, 32, function (index) {
                return LZString.getBaseValue(LZString.keyStrBase64, input.charAt(index));
            });
        };
        LZString.compressToUTF16 = function (input) {
            if (input == null)
                return "";
            return LZString._compress(input, 15, function (a) {
                return String.fromCharCode(a + 32);
            }) + " ";
        };
        LZString.decompressFromUTF16 = function (compressed) {
            if (compressed == null)
                return "";
            if (compressed == "")
                return null;
            return LZString._decompress(compressed.length, 16384, function (index) {
                return compressed.charCodeAt(index) - 32;
            });
        };
        //compress into uint8array (UCS-2 big endian format)
        LZString.compressToUint8Array = function (uncompressed) {
            var compressed = LZString.compress(uncompressed);
            var buf = new Uint8Array(compressed.length * 2); // 2 bytes per character
            for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
                var current_value = compressed.charCodeAt(i);
                buf[i * 2] = current_value >>> 8;
                buf[i * 2 + 1] = current_value % 256;
            }
            return buf;
        };
        //decompress from uint8array (UCS-2 big endian format)
        LZString.decompressFromUint8Array = function (compressed) {
            if (compressed === null || compressed === undefined) {
                return LZString.decompress(compressed);
            }
            else {
                var buf = new Array(compressed.length / 2); // 2 bytes per character
                for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
                    buf[i] = compressed.charCodeAt(i * 2) * 256 + compressed.charCodeAt(i * 2 + 1);
                }
                var result_1 = [];
                buf.forEach(function (c) {
                    result_1.push(String.fromCharCode(c));
                });
                return LZString.decompress(result_1.join(''));
            }
        };
        //compress into a string that is already URI encoded
        LZString.compressToEncodedURIComponent = function (input) {
            if (input == null)
                return "";
            return LZString._compress(input, 6, function (a) {
                return LZString.keyStrUriSafe.charAt(a);
            });
        };
        //decompress from an output of compressToEncodedURIComponent
        LZString.decompressFromEncodedURIComponent = function (input) {
            if (input == null)
                return "";
            if (input == "")
                return null;
            input = input.replace(/ /g, "+");
            return LZString._decompress(input.length, 32, function (index) {
                return LZString.getBaseValue(LZString.keyStrUriSafe, input.charAt(index));
            });
        };
        LZString.compress = function (uncompressed) {
            return LZString._compress(uncompressed, 16, function (a) {
                return String.fromCharCode(a);
            });
        };
        LZString._compress = function (uncompressed, bitsPerChar, getCharFromInt) {
            if (uncompressed == null)
                return "";
            var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, // Compensate for the first entry which should not count
            context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
            for (ii = 0; ii < uncompressed.length; ii += 1) {
                context_c = uncompressed.charAt(ii);
                if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                    context_dictionary[context_c] = context_dictSize++;
                    context_dictionaryToCreate[context_c] = true;
                }
                context_wc = context_w + context_c;
                if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                    context_w = context_wc;
                }
                else {
                    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                        if (context_w.charCodeAt(0) < 256) {
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 8; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        else {
                            value = 1;
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = 0;
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 16; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        delete context_dictionaryToCreate[context_w];
                    }
                    else {
                        value = context_dictionary[context_w];
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    // Add wc to the dictionary.
                    context_dictionary[context_wc] = context_dictSize++;
                    context_w = String(context_c);
                }
            }
            // Output the code for w.
            if (context_w !== "") {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                    if (context_w.charCodeAt(0) < 256) {
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else {
                                context_data_position++;
                            }
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 8; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    else {
                        value = 1;
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else {
                                context_data_position++;
                            }
                            value = 0;
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 16; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    delete context_dictionaryToCreate[context_w];
                }
                else {
                    value = context_dictionary[context_w];
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        }
                        else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
            }
            // Mark the end of the stream
            value = 2;
            for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                }
                else {
                    context_data_position++;
                }
                value = value >> 1;
            }
            // Flush the last char
            while (true) {
                context_data_val = (context_data_val << 1);
                if (context_data_position == bitsPerChar - 1) {
                    context_data.push(getCharFromInt(context_data_val));
                    break;
                }
                else
                    context_data_position++;
            }
            return context_data.join('');
        };
        LZString.decompress = function (compressed) {
            if (compressed == null)
                return "";
            if (compressed == "")
                return null;
            return LZString._decompress(compressed.length, 32768, function (index) {
                return compressed.charCodeAt(index);
            });
        };
        LZString._decompress = function (length, resetValue, getNextValue) {
            var dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
            for (i = 0; i < 3; i += 1) {
                dictionary[i] = i;
            }
            bits = 0;
            maxpower = Math.pow(2, 2);
            power = 1;
            while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }
            switch (next = bits) {
                case 0:
                    bits = 0;
                    maxpower = Math.pow(2, 8);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = String.fromCharCode(bits);
                    break;
                case 1:
                    bits = 0;
                    maxpower = Math.pow(2, 16);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = String.fromCharCode(bits);
                    break;
                case 2:
                    return "";
            }
            dictionary[3] = c;
            w = c;
            result.push(c);
            while (true) {
                if (data.index > length) {
                    return "";
                }
                bits = 0;
                maxpower = Math.pow(2, numBits);
                power = 1;
                while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                switch (c = bits) {
                    case 0:
                        bits = 0;
                        maxpower = Math.pow(2, 8);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        dictionary[dictSize++] = String.fromCharCode(bits);
                        c = dictSize - 1;
                        enlargeIn--;
                        break;
                    case 1:
                        bits = 0;
                        maxpower = Math.pow(2, 16);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        dictionary[dictSize++] = String.fromCharCode(bits);
                        c = dictSize - 1;
                        enlargeIn--;
                        break;
                    case 2:
                        return result.join('');
                }
                if (enlargeIn == 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }
                if (dictionary[c]) {
                    entry = dictionary[c];
                }
                else {
                    if (c === dictSize) {
                        entry = w + w.charAt(0);
                    }
                    else {
                        return null;
                    }
                }
                result.push(entry);
                // Add w+entry[0] to the dictionary.
                dictionary[dictSize++] = w + entry.charAt(0);
                enlargeIn--;
                w = entry;
                if (enlargeIn == 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }
            }
        };
        // private property
        LZString.keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        LZString.keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
        LZString.baseReverseDic = {};
        return LZString;
    }());
    exports.LZString = LZString;
});
//# sourceMappingURL=LZString.js.map;
define('App',["require", "exports", "./Canvas", "./util/NetUtil", "./layers/LayerImage", "./layers/LayerPolylineView", "./layers/LayerPolylineEdit", "./data/Data", "./util/Ui", "./util/LZString"], function (require, exports, Canvas_1, NetUtil_1, LayerImage_1, LayerPolylineView_1, LayerPolylineEdit_1, Data_1, Ui_1, LZString_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var canvas = new Canvas_1.Canvas(document.getElementById("container"), 'canvas2d');
    canvas.init();
    var layerImage = new LayerImage_1.LayerImage(canvas);
    var layerPolylineView = new LayerPolylineView_1.LayerPolylineView(canvas);
    var layerPolylineEdit = new LayerPolylineEdit_1.LayerPolylineEdit(canvas);
    layerPolylineView.setLayer(layerPolylineEdit);
    layerPolylineEdit.setLayer(layerPolylineView);
    canvas.addLayer(layerImage);
    canvas.addLayer(layerPolylineView);
    canvas.addLayer(layerPolylineEdit);
    function load(mapString, dataString) {
        Ui_1.Ui.bindButtonOnClick("buttonSave", function () {
            var data = canvas.save();
            var dataString = JSON.stringify(data);
            console.log(dataString);
            var compressed = LZString_1.LZString.compressToEncodedURIComponent(dataString);
            var url = location.pathname + '?map=' + mapString + '&data=' + compressed;
            history.replaceState(data, "", url);
        });
        NetUtil_1.NetUtil.get("data/" + map + "/content.json", function (mapDesc) {
            var map = JSON.parse(mapDesc);
            var decompressed = dataString ? LZString_1.LZString.decompressFromEncodedURIComponent(dataString) : null;
            var data = decompressed ? JSON.parse(decompressed) : new Data_1.Data;
            canvas.load(map, data, "data/" + mapString);
            canvas.requestRender();
        });
    }
    var url_string = window.location.href;
    var url = new URL(url_string);
    var map = url.searchParams.get("map") || "fiji";
    var data = url.searchParams.get("data");
    load(map, data);
});
//# sourceMappingURL=App.js.map;

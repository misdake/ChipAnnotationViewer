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
        Camera.prototype.load = function (canvas, content) {
            this.canvas = canvas;
            this.zoomMin = 0;
            this.zoomMax = content.maxLevel;
            this.zoom = content.maxLevel;
            this.checkZoom();
            this.position.x = content.width / 2;
            this.position.y = content.height / 2;
            this.xMin = 0;
            this.xMax = content.width;
            this.yMin = 0;
            this.yMax = content.height;
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
define('Canvas',["require", "exports", "./Renderer", "./Camera"], function (require, exports, Renderer_1, Camera_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Canvas = /** @class */ (function () {
        function Canvas(domElement, id) {
            this.renderNext = false;
            this.domElement = domElement;
            this.domElement.innerHTML = "<canvas id=\"" + id + "\" style='width:100%;height:100%;overflow:hidden'></canvas>";
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
        Canvas.prototype.load = function (content, folder) {
            this.camera.load(this, content);
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.load(content, folder);
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
        Layer.prototype.load = function (content, folder) {
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
    }
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
    }
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
        LayerImage.prototype.load = function (content, folder) {
            _super.prototype.load.call(this, content, folder);
            this.content = content;
            this.maxLevel = content.maxLevel;
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
            var targetSize = this.content.tileSize << zoom;
            var levelData = this.content.levels[zoom];
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
    }
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
    var DrawablePolyline = /** @class */ (function (_super) {
        __extends(DrawablePolyline, _super);
        function DrawablePolyline(points, closed, fill, lineWidth) {
            var _this = _super.call(this) || this;
            _this.points = points;
            _this.closed = closed;
            _this.fill = fill;
            _this.stroke = true; //TODO add to parameter
            _this.lineWidth = lineWidth;
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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('drawable/DrawableText',["require", "exports", "./Drawable"], function (require, exports, Drawable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AnchorX;
    (function (AnchorX) {
        AnchorX["LEFT"] = "left";
        AnchorX["MIDDLE"] = "center";
        AnchorX["RIGHT"] = "right";
    })(AnchorX = exports.AnchorX || (exports.AnchorX = {}));
    var AnchorY;
    (function (AnchorY) {
        AnchorY["TOP"] = "top";
        AnchorY["MIDDLE"] = "middle";
        AnchorY["BOTTOM"] = "bottom";
    })(AnchorY = exports.AnchorY || (exports.AnchorY = {}));
    var DrawableText = /** @class */ (function (_super) {
        __extends(DrawableText, _super);
        function DrawableText(text, color, anchorX, anchorY, fontSize, x, y) {
            var _this = _super.call(this) || this;
            _this.text = "";
            _this.text = text;
            _this.color = color;
            _this.anchorX = anchorX;
            _this.anchorY = anchorY;
            _this.fontSize = fontSize;
            _this.x = x;
            _this.y = y;
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
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('layers/LayerPolylineView',["require", "exports", "../Layer", "../drawable/DrawablePolyline", "../util/Size", "../MouseListener", "../drawable/DrawableText"], function (require, exports, Layer_1, DrawablePolyline_1, Size_1, MouseListener_1, DrawableText_1) {
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
        LayerPolylineView.prototype.load = function (content, folder) {
            _super.prototype.load.call(this, content, folder);
            this.content = content;
            var polyline1 = new DrawablePolyline_1.DrawablePolyline(LayerPolylineView.prepareRect(100, 100, 900, 900), true, false, new Size_1.Size(0, 10));
            polyline1.fillColor = "#00ff00";
            polyline1.strokeColor = "#ff0000";
            this.polylines.push(polyline1);
            var polyline2 = new DrawablePolyline_1.DrawablePolyline(LayerPolylineView.prepareRect(1100, 100, 1900, 900), true, true, new Size_1.Size(5, 0));
            polyline2.fillColor = "#0000ff";
            polyline2.strokeColor = "#00ff00";
            this.polylines.push(polyline2);
            var polyline3 = new DrawablePolyline_1.DrawablePolyline(LayerPolylineView.prepareRect(2100, 100, 2900, 900), false, false, new Size_1.Size(0, 0, 0.004));
            polyline3.fillColor = "#ff0000";
            polyline3.strokeColor = "#0000ff";
            this.polylines.push(polyline3);
            this.texts.push(new DrawableText_1.DrawableText("a", "#ff0000", DrawableText_1.AnchorX.MIDDLE, DrawableText_1.AnchorY.MIDDLE, new Size_1.Size(0, 100), 500, 500));
            this.texts.push(new DrawableText_1.DrawableText("b", "#00ff00", DrawableText_1.AnchorX.MIDDLE, DrawableText_1.AnchorY.MIDDLE, new Size_1.Size(50, 0), 1500, 500));
            this.texts.push(new DrawableText_1.DrawableText("c", "#0000ff", DrawableText_1.AnchorX.MIDDLE, DrawableText_1.AnchorY.MIDDLE, new Size_1.Size(0, 0, 0.04), 2500, 500));
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
define('util/Ui',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }
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
        LayerPolylineEdit.prototype.load = function (content, folder) {
            this.content = content;
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
            this.polylineNew = new DrawablePolyline_1.DrawablePolyline(points, true, true, new Size_1.Size(2));
            this.polylineNew.strokeColor = "rgba(255,255,255,0.5)";
            this.polylineNew.fillColor = "rgba(255,255,255,0.2)";
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
            Ui_1.Ui.bindValue("colorStroke", polyline.strokeColor, function (newValue) {
                polyline.strokeColor = newValue;
                _this.canvas.requestRender();
            });
            Ui_1.Ui.bindValue("colorFill", polyline.fillColor, function (newValue) {
                polyline.fillColor = newValue;
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
            Ui_1.Ui.bindNumber("textSizeOfScreen", polyline.lineWidth.ofScreen, function (newValue) {
                polyline.lineWidth.ofScreen = newValue;
                _this.canvas.requestRender();
            });
        };
        return LayerPolylineEdit;
    }(Layer_1.Layer));
    exports.LayerPolylineEdit = LayerPolylineEdit;
});
//# sourceMappingURL=LayerPolylineEdit.js.map;
define('App',["require", "exports", "./Canvas", "./util/NetUtil", "./layers/LayerImage", "./layers/LayerPolylineView", "./layers/LayerPolylineEdit"], function (require, exports, Canvas_1, NetUtil_1, LayerImage_1, LayerPolylineView_1, LayerPolylineEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    document.oncontextmenu = function (ev) {
        return false; //disable context menu
    };
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
    function load(map, config) {
        NetUtil_1.NetUtil.get("data/" + map + "/content.json", function (text) {
            var content = JSON.parse(text);
            canvas.load(content, "data/" + map);
            canvas.requestRender();
            // console.log(LZString.compressToEncodedURIComponent(text));
        });
    }
    var url_string = window.location.href;
    var url = new URL(url_string);
    var map = url.searchParams.get("map");
    // let config = url.searchParams.get("config");
    if (!map) {
        map = "fiji";
    }
    // if (config) {
    //     console.log("decompressed: " + LZString.decompressFromEncodedURIComponent(config));
    // }
    load(map, "");
});
//# sourceMappingURL=App.js.map;

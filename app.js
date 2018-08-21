define('Renderer',["require", "exports"], function (require, exports) {
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
        //---------------------------------------------
        //polyline
        Renderer.prototype.renderPolyline = function (camera, points, closed, fill, lineWidth) {
            this.context.lineWidth = lineWidth;
            this.context.beginPath();
            var start = camera.canvasToScreen(points[0][0], points[0][1]);
            this.context.moveTo(start.x, start.y);
            for (var i = 1; i < points.length; i++) {
                var point = camera.canvasToScreen(points[i][0], points[i][1]);
                this.context.lineTo(point.x, point.y);
            }
            if (closed) {
                this.context.lineTo(start.x, start.y);
            }
            this.context.closePath();
            if (fill) {
                this.context.fill();
            }
            else {
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
            return new ScreenRect(point.x, point.y, targetW, targetH);
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
            this._x = 0;
            this._y = 0;
            this._x = x;
            this._y = y;
        }
        Object.defineProperty(Position.prototype, "x", {
            get: function () {
                return this._x;
            },
            set: function (x) {
                this._x = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Position.prototype, "y", {
            get: function () {
                return this._y;
            },
            set: function (y) {
                this._y = y;
            },
            enumerable: true,
            configurable: true
        });
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
define('drawable/Drawable',["require", "exports", "../util/Transform"], function (require, exports, Transform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Drawable = /** @class */ (function () {
        function Drawable() {
            this.transformation = new Transform_1.Transform();
            this._color = null;
        }
        Object.defineProperty(Drawable.prototype, "color", {
            get: function () {
                return this._color;
            },
            set: function (color) {
                this._color = color;
            },
            enumerable: true,
            configurable: true
        });
        Drawable.prototype.render = function (canvas, renderer, camera) {
            if (this.color) {
                renderer.setColor(this.color);
            }
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
define('layers/LayerImage',["require", "exports", "../Layer", "../drawable/DrawableImage"], function (require, exports, Layer_1, DrawableImage_1) {
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
                    this.imageMatrix[i][j] = new DrawableImage_1.DrawableImage(this.baseFolder + "/" + zoom + "/" + i + "_" + j + ".jpg", i * targetSize, j * targetSize, targetSize, targetSize, function (image) {
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
    var DrawablePolyline = /** @class */ (function (_super) {
        __extends(DrawablePolyline, _super);
        function DrawablePolyline(points, closed, fill, lineWidth) {
            var _this = _super.call(this) || this;
            _this.points = points;
            _this.closed = closed;
            _this.fill = fill;
            _this.lineWidth = lineWidth;
            return _this;
        }
        DrawablePolyline.prototype.render = function (canvas, renderer, camera) {
            _super.prototype.render.call(this, canvas, renderer, camera);
            renderer.renderPolyline(camera, this.points, this.closed, this.fill, this.lineWidth);
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
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define('layers/LayerPolyline',["require", "exports", "../Layer", "../drawable/DrawablePolyline"], function (require, exports, Layer_1, DrawablePolyline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LayerPolyline = /** @class */ (function (_super) {
        __extends(LayerPolyline, _super);
        function LayerPolyline() {
            var _this = _super.call(this, "polyline", 1) || this;
            _this.polylines = [];
            return _this;
        }
        LayerPolyline.prototype.load = function (canvas, content, folder) {
            _super.prototype.load.call(this, canvas, content, folder);
            this.content = content;
            var polyline1 = new DrawablePolyline_1.DrawablePolyline([[0, 1000], [1000, 1000], [1000, 0], [0, 0]], true, false, 5);
            polyline1.color = "#ff0000";
            this.polylines.push(polyline1);
            var polyline2 = new DrawablePolyline_1.DrawablePolyline([[1000, 1000], [2000, 1000], [2000, 0], [1000, 0]], true, true, 0);
            polyline2.color = "#0000ff";
            this.polylines.push(polyline2);
        };
        LayerPolyline.prototype.render = function (canvas, renderer, camera) {
            _super.prototype.render.call(this, canvas, renderer, camera);
            this.polylines.forEach(function (polyline) {
                polyline.render(canvas, renderer, camera);
            });
        };
        LayerPolyline.prototype.unload = function () {
            _super.prototype.unload.call(this);
        };
        return LayerPolyline;
    }(Layer_1.Layer));
    exports.LayerPolyline = LayerPolyline;
});
//# sourceMappingURL=LayerPolyline.js.map;
define('Main',["require", "exports", "./Canvas", "./util/NetUtil", "./layers/LayerImage", "./layers/LayerPolyline"], function (require, exports, Canvas_1, NetUtil_1, LayerImage_1, LayerPolyline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var canvas = new Canvas_1.Canvas(document.getElementById("container"), 'canvas2d');
    canvas.init();
    canvas.addLayer(new LayerImage_1.LayerImage());
    canvas.addLayer(new LayerPolyline_1.LayerPolyline());
    NetUtil_1.NetUtil.get("data/fiji/content.json", function (text) {
        var content = JSON.parse(text);
        canvas.load(content, "data/fiji");
        canvas.requestRender();
    });
});
//# sourceMappingURL=Main.js.map;

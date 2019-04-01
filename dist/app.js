
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}(function () { 'use strict';

    var ScreenRect = /** @class */ (function () {
        function ScreenRect(left, top, width, height) {
            this.left = left;
            this.top = top;
            this.width = width;
            this.height = height;
        }
        return ScreenRect;
    }());

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
            this.context.lineCap = "round";
            this.context.lineJoin = "round";
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
        //image
        //---------------------------------------------
        //---------------------------------------------
        //shape
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
        Renderer.prototype.drawRect = function (x1, y1, x2, y2, fill, stroke, lineWidth) {
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
        };
        //shape
        //---------------------------------------------
        //---------------------------------------------
        //text
        Renderer.prototype.measureText = function (camera, text, fontSize) {
            var size = this.calculateLineWidth(camera, fontSize);
            this.context.font = size + "px Arial";
            var textMetrics = this.context.measureText(text);
            return [textMetrics.width, size];
        };
        Renderer.prototype.renderText = function (camera, text, fontSize, x, y, anchorX, anchorY) {
            var position = camera.canvasToScreen(x, y);
            this.drawText(text, fontSize, position.x, position.y, anchorX, anchorY);
        };
        Renderer.prototype.drawText = function (text, fontSize, x, y, anchorX, anchorY) {
            this.context.textAlign = anchorX;
            this.context.textBaseline = anchorY;
            this.context.font = fontSize + "px Arial";
            this.context.fillText(text, x, y);
        };
        return Renderer;
    }());

    var Transform = /** @class */ (function () {
        function Transform() {
            this.position = new Position(0, 0);
        }
        return Transform;
    }());
    var Position = /** @class */ (function () {
        function Position(x, y) {
            this.x = x;
            this.y = y;
        }
        return Position;
    }());

    var Camera = /** @class */ (function () {
        function Camera() {
            this.position = new Position(0, 0);
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
            if (!this.canvas)
                return;
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
            return new Position(targetX, targetY);
        };
        Camera.prototype.canvasToScreen = function (x, y) {
            var targetX = x * this.scale + this.tx;
            var targetY = y * this.scale + this.ty;
            return new Position(targetX, targetY);
        };
        Camera.prototype.screenSizeToCanvas = function (s) {
            return s / this.scale;
        };
        Camera.prototype.canvasSizeToScreen = function (s) {
            return s * this.scale;
        };
        Camera.prototype.canvasAABBInScreen = function (aabb) {
            var x1 = aabb.x1 * this.scale + this.tx;
            var y1 = aabb.y1 * this.scale + this.ty;
            var x2 = aabb.x2 * this.scale + this.tx;
            var y2 = aabb.y2 * this.scale + this.ty;
            var w = this.canvas.getWidth();
            var h = this.canvas.getHeight();
            return !(x2 < 0 || x1 > w || y2 < 0 || y1 > h);
        };
        return Camera;
    }());

    var Data = /** @class */ (function () {
        function Data() {
        }
        return Data;
    }());

    var Canvas = /** @class */ (function () {
        function Canvas(domElement, id) {
            this.renderNext = false;
            this.map = null;
            this.data = null;
            this.domElement = domElement;
            this.domElement.innerHTML += "<canvas id=\"" + id + "\" style='width:100%;height:100%;overflow:hidden'></canvas>";
            this.domElement.oncontextmenu = function (ev) {
                return false; //disable context menu
            };
            this.canvasElement = document.getElementById(id);
            this.context = this.canvasElement.getContext("2d");
            this.camera = new Camera();
            this.renderer = new Renderer(this, this.canvasElement, this.context);
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
        Canvas.prototype.findLayer = function (name) {
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                if (layer.name == name) {
                    return layer;
                }
            }
            return null;
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
        Canvas.prototype.loadMap = function (map) {
            if (!this.map || this.map.name != map.name) {
                this.camera.load(this, map);
                for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                    var layer = _a[_i];
                    layer.loadMap(map);
                }
            }
            this.map = map;
        };
        Canvas.prototype.loadData = function (data) {
            if (this.data != data) {
                for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                    var layer = _a[_i];
                    layer.loadData(data);
                }
            }
            this.data = data;
        };
        Canvas.prototype.save = function () {
            var data = new Data();
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.saveData(data);
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

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

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
        Layer.prototype.loadMap = function (map) {
        };
        Layer.prototype.loadData = function (data) {
        };
        Layer.prototype.saveData = function (data) {
        };
        Layer.prototype.render = function (renderer) {
        };
        Layer.prototype.unload = function () {
        };
        return Layer;
    }());

    var Drawable = /** @class */ (function () {
        function Drawable() {
            this.transformation = new Transform();
        }
        Drawable.prototype.render = function (canvas, renderer, camera) {
        };
        return Drawable;
    }());

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
    }(Drawable));

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

    var ColorEntry = /** @class */ (function () {
        function ColorEntry(name, r, g, b) {
            this.name = name;
            this.r = r;
            this.g = g;
            this.b = b;
        }
        ColorEntry.findByName = function (name) {
            for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
                var colorValue = _a[_i];
                if (name == colorValue.name) {
                    return colorValue;
                }
            }
            return this.list[0];
        };
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
        return ColorEntry;
    }());
    var AlphaEntry = /** @class */ (function () {
        function AlphaEntry(name, buttonColor, value) {
            this.name = name;
            this.buttonColor = buttonColor;
            this.value = value;
        }
        AlphaEntry.findByName = function (name) {
            for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
                var alphaValue = _a[_i];
                if (name == alphaValue.name) {
                    return alphaValue;
                }
            }
            return this.list[0];
        };
        AlphaEntry.findByValue = function (value) {
            for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
                var alphaValue = _a[_i];
                if (value == alphaValue.value) {
                    return alphaValue;
                }
            }
            return this.list[0];
        };
        AlphaEntry.list = [
            new AlphaEntry("25", "rgb(191,191,191)", 0.25),
            new AlphaEntry("50", "rgb(127,127,127)", 0.50),
            new AlphaEntry("75", "rgb(63,63,63)", 0.75),
            new AlphaEntry("100", "rgb(0,0,0)", 1.00),
        ];
        return AlphaEntry;
    }());
    function combineColorAlpha(color, alpha) {
        return "rgba(" + color.r + "," + color.g + "," + color.b + "," + alpha.value + ")";
    }

    var Ui = /** @class */ (function () {
        function Ui() {
        }
        Ui.copyToClipboard = function (inputId) {
            var input = document.getElementById(inputId);
            input.select();
            document.execCommand("Copy");
            input.blur();
        };
        Ui.setContent = function (id, content) {
            var element = document.getElementById(id);
            element.innerHTML = content;
        };
        Ui.bindButtonOnClick = function (id, onclick) {
            var button = document.getElementById(id);
            button.onclick = onclick;
        };
        Ui.setVisibility = function (id, visible) {
            var element = document.getElementById(id);
            element.style.display = visible ? "block" : "none";
        };
        Ui.bindCheckbox = function (id, initialValue, onchange) {
            var checkbox = document.getElementById(id);
            checkbox.checked = initialValue;
            checkbox.onchange = function (ev) {
                onchange(checkbox.checked);
            };
        };
        Ui.bindSelect = function (id, options, initialValue, onchange) {
            var select = document.getElementById(id);
            select.options.length = 0;
            for (var _i = 0, options_1 = options; _i < options_1.length; _i++) {
                var map = options_1[_i];
                select.add(new Option(map, map));
            }
            var index = options.indexOf(initialValue);
            if (index > 0) {
                select.options[index].selected = true;
            }
            select.onchange = function (ev) {
                onchange(select.selectedIndex, select.options[select.selectedIndex].value);
            };
        };
        Ui.bindValue = function (id, initialValue, onchange) {
            var element = document.getElementById(id);
            element.value = initialValue;
            element.oninput = element.onchange = function (ev) {
                onchange(element.value);
            };
        };
        Ui.bindColor = function (colorContainerId, alphaContainerId, initialColor, initialAlpha, onchange) {
            var colorContainer = document.getElementById(colorContainerId);
            var alphaContainer = document.getElementById(alphaContainerId);
            colorContainer.innerHTML = "";
            alphaContainer.innerHTML = "";
            var thisColor = initialColor;
            var thisAlpha = initialAlpha;
            for (var _i = 0, _a = ColorEntry.list; _i < _a.length; _i++) {
                var colorValue = _a[_i];
                var id = colorContainerId + "_" + colorValue.name;
                var style = "background:" + colorValue.name;
                colorContainer.innerHTML = colorContainer.innerHTML + "<button id=\"" + id + "\" class=\"configColorButton\" style=\"" + style + "\"></button>\n";
            }
            for (var _b = 0, _c = AlphaEntry.list; _b < _c.length; _b++) {
                var alphaValue = _c[_b];
                var id = alphaContainerId + "_" + alphaValue.name;
                var style = "background:" + alphaValue.buttonColor;
                alphaContainer.innerHTML = alphaContainer.innerHTML + "<button id=\"" + id + "\" class=\"configAlphaButton\" style=\"" + style + "\"></button>\n";
            }
            var _loop_1 = function (colorValue) {
                var id = colorContainerId + "_" + colorValue.name;
                var button = document.getElementById(id);
                button.onclick = function (ev) {
                    thisColor = colorValue;
                    onchange(thisColor, thisAlpha);
                };
            };
            for (var _d = 0, _e = ColorEntry.list; _d < _e.length; _d++) {
                var colorValue = _e[_d];
                _loop_1(colorValue);
            }
            var _loop_2 = function (alphaValue) {
                var id = alphaContainerId + "_" + alphaValue.name;
                var button = document.getElementById(id);
                button.onclick = function (ev) {
                    thisAlpha = alphaValue;
                    onchange(thisColor, thisAlpha);
                };
            };
            for (var _f = 0, _g = AlphaEntry.list; _f < _g.length; _f++) {
                var alphaValue = _g[_f];
                _loop_2(alphaValue);
            }
        };
        Ui.bindNumber = function (id, initialValue, onchange) {
            var input = document.getElementById(id);
            input.value = initialValue.toString();
            input.oninput = input.onchange = function (ev) {
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

    var LayerImage = /** @class */ (function (_super) {
        __extends(LayerImage, _super);
        function LayerImage(canvas) {
            return _super.call(this, "image", canvas) || this;
        }
        LayerImage.prototype.loadMap = function (map) {
            this.map = map;
            this.maxLevel = map.maxLevel;
            var split = map.githubRepo.indexOf('/');
            var username = map.githubRepo.substring(0, split);
            var repo = map.githubRepo.substring(split + 1);
            this.baseFolder = "https://" + username + ".github.io/" + repo + "/" + this.map.name;
            this.currentZoom = -1;
            var imageSource = document.getElementById("imageSource");
            Ui.setVisibility("imageSource", !!map.source);
            if (map.source) {
                imageSource.href = map.source;
                imageSource.innerHTML = map.source;
            }
            var self = this;
            this._mouseListener = new /** @class */ (function (_super) {
                __extends(class_1, _super);
                function class_1() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.down = false;
                    _this.lastX = -1;
                    _this.lastY = -1;
                    return _this;
                }
                class_1.prototype.onwheel = function (event) {
                    var camera = self.canvas.getCamera();
                    camera.action();
                    var point1 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    camera.changeZoomBy(event.deltaY > 0 ? 1 : -1);
                    camera.action();
                    var point2 = camera.screenXyToCanvas(event.offsetX, event.offsetY);
                    var dx = point1.x - point2.x;
                    var dy = point1.y - point2.y;
                    camera.moveXy(dx, dy);
                    self.canvas.requestRender();
                    return true;
                };
                class_1.prototype.onmousedown = function (event) {
                    this.down = true;
                    this.lastX = event.offsetX;
                    this.lastY = event.offsetY;
                    return true;
                };
                class_1.prototype.onmouseup = function (event) {
                    this.down = false;
                    return true;
                };
                class_1.prototype.onmousemove = function (event) {
                    if (this.down && event.buttons > 0) {
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
            }(MouseListener));
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
                    this.imageMatrix[i][j] = new DrawableImage(this.baseFolder + "/" + zoom + "/" + i + "_" + j + ".jpg", i * targetSize, j * targetSize, targetSize, targetSize, function (image) {
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
    }(Layer));

    var AABB = /** @class */ (function () {
        function AABB(x1, y1, x2, y2) {
            if (x1 === void 0) { x1 = Math.min(); }
            if (y1 === void 0) { y1 = Math.min(); }
            if (x2 === void 0) { x2 = Math.max(); }
            if (y2 === void 0) { y2 = Math.max(); }
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
        AABB.prototype.set = function (x1, y1, x2, y2) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        };
        return AABB;
    }());

    var Point = /** @class */ (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    }());
    var PointSegmentResult = /** @class */ (function () {
        function PointSegmentResult(position, p1Index, p2Index, distance) {
            this.position = position;
            this.p1Index = p1Index;
            this.p2Index = p2Index;
            this.distance = distance;
        }
        return PointSegmentResult;
    }());
    var DrawablePolylinePack = /** @class */ (function () {
        function DrawablePolylinePack(points, closed, lineWidth, fill, fillColorName, fillAlphaName, stroke, strokeColorName, strokeAlphaName) {
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
        return DrawablePolylinePack;
    }());
    var DrawablePolylinePicker = /** @class */ (function () {
        function DrawablePolylinePicker(polyline, points) {
            this.polyline = polyline;
            this.points = points;
        }
        DrawablePolylinePicker.sqr = function (dx, dy) {
            return dx * dx + dy * dy;
        };
        DrawablePolylinePicker.testPointSegment = function (points, i1, i2, x, y) {
            var p1 = points[i1];
            var p2 = points[i2];
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            var dd = DrawablePolylinePicker.sqr(dx, dy);
            if (dd < 0.0001)
                return null;
            var scalar = ((x - p1.x) * dx + (y - p1.y) * dy) / dd;
            if (scalar > 1)
                scalar = 1;
            if (scalar < 0)
                scalar = 0;
            var tx = p1.x + scalar * dx;
            var ty = p1.y + scalar * dy;
            var distance2 = DrawablePolylinePicker.sqr(x - tx, y - ty);
            return new PointSegmentResult(new Point(tx, ty), i1, i2, Math.sqrt(distance2));
        };
        DrawablePolylinePicker.testPointPolygon = function (points, x, y) {
            var length = points.length;
            var r = false;
            for (var i = 0, j = length - 1; i < length; j = i++) {
                if (((points[i].y > y) != (points[j].y > y)) &&
                    (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x))
                    r = !r;
            }
            return r;
        };
        DrawablePolylinePicker.prototype.pickPoint = function (canvasX, canvasY, radius) {
            var radius2 = radius * radius;
            var points = this.points;
            for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
                var point = points_1[_i];
                if (DrawablePolylinePicker.sqr(point.x - canvasX, point.y - canvasY) <= radius2) {
                    return points.indexOf(point);
                }
            }
            return null;
        };
        DrawablePolylinePicker.prototype.pickLine = function (canvasX, canvasY, radius) {
            var minResult = null;
            var minDistance = Number.MAX_VALUE;
            var points = this.points;
            var length = points.length;
            for (var i = 0, j = length - 1; i < length; j = i++) {
                var result = DrawablePolylinePicker.testPointSegment(points, i, j, canvasX, canvasY);
                if (result && result.distance < radius) {
                    if (result.distance < minDistance) {
                        minDistance = result.distance;
                        minResult = result;
                    }
                }
            }
            return minResult;
        };
        DrawablePolylinePicker.prototype.pickShape = function (canvasX, canvasY) {
            return this.polyline.style.fill && DrawablePolylinePicker.testPointPolygon(this.points, canvasX, canvasY);
        };
        return DrawablePolylinePicker;
    }());
    var DrawablePolylineEditor = /** @class */ (function () {
        function DrawablePolylineEditor(polyline, points) {
            this.polyline = polyline;
            this.points = points;
        }
        DrawablePolylineEditor.prototype.forEachPoint = function (func) {
            this.points.forEach(function (point, index) {
                func(point.x, point.y, index);
            });
        };
        DrawablePolylineEditor.prototype.pointCount = function () {
            return this.points.length;
        };
        DrawablePolylineEditor.prototype.getPoint = function (index) {
            var points = this.points;
            index = (index + points.length) % points.length;
            return points[index];
        };
        DrawablePolylineEditor.prototype.addPoint = function (x, y) {
            this.points.push(new Point(x, y));
            this.polyline.invalidate();
        };
        DrawablePolylineEditor.prototype.insertPoint = function (x, y, beforeIndex) {
            if (beforeIndex === void 0) { beforeIndex = -1; }
            var points = this.points;
            beforeIndex = (beforeIndex + points.length) % points.length;
            points.splice(beforeIndex, 0, new Point(x, y));
            this.polyline.invalidate();
        };
        DrawablePolylineEditor.prototype.removePoint = function (index) {
            var points = this.points;
            index = (index + points.length) % points.length;
            points.splice(index, 1);
            this.polyline.invalidate();
        };
        DrawablePolylineEditor.prototype.setPoint = function (index, x, y) {
            var points = this.points;
            index = (index + points.length) % points.length;
            var point = points[index];
            point.x = x;
            point.y = y;
            this.polyline.invalidate();
        };
        DrawablePolylineEditor.prototype.move = function (offsetX, offsetY) {
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                point.x += offsetX;
                point.y += offsetY;
            }
            this.polyline.invalidate();
        };
        DrawablePolylineEditor.prototype.flipX = function () {
            var minX = Math.min();
            var maxX = Math.max();
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
            }
            var xx = minX + maxX;
            for (var _b = 0, _c = this.points; _b < _c.length; _b++) {
                var point = _c[_b];
                point.x = xx - point.x;
            }
        };
        DrawablePolylineEditor.prototype.flipY = function () {
            var minY = Math.min();
            var maxY = Math.max();
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
            var yy = minY + maxY;
            for (var _b = 0, _c = this.points; _b < _c.length; _b++) {
                var point = _c[_b];
                point.y = yy - point.y;
            }
        };
        DrawablePolylineEditor.prototype.rotateCW = function () {
            var center = this.polyline.calculator.aabbCenter();
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                var dx = point.x - center.x;
                var dy = point.y - center.y;
                point.x = center.x - dy;
                point.y = center.y + dx;
            }
        };
        DrawablePolylineEditor.prototype.rotateCCW = function () {
            var center = this.polyline.calculator.aabbCenter();
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                var dx = point.x - center.x;
                var dy = point.y - center.y;
                point.x = center.x + dy;
                point.y = center.y - dx;
            }
        };
        return DrawablePolylineEditor;
    }());
    var DrawablePolylineCalculator = /** @class */ (function () {
        function DrawablePolylineCalculator(polyline, points) {
            this.polyline = polyline;
            this.points = points;
        }
        DrawablePolylineCalculator.prototype.centroid = function () {
            var area2 = 0;
            var accX = 0;
            var accY = 0;
            for (var i = 0; i < this.points.length; i++) {
                var p1 = this.points[i];
                var p2 = this.points[(i + 1) % this.points.length];
                var c = p1.x * p2.y - p2.x * p1.y;
                area2 += c;
                accX += (p1.x + p2.x) * c;
                accY += (p1.y + p2.y) * c;
            }
            var x = accX / 6 / (area2 / 2);
            var y = accY / 6 / (area2 / 2);
            return new Point(x, y);
        };
        DrawablePolylineCalculator.prototype.aabb = function (aabb) {
            if (aabb === void 0) { aabb = new AABB(); }
            if (!aabb)
                aabb = new AABB();
            var minX = Math.min(), maxX = Math.max();
            var minY = Math.min(), maxY = Math.max();
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
            aabb.set(minX, minY, maxX, maxY);
            return aabb;
        };
        DrawablePolylineCalculator.prototype.aabbCenter = function () {
            var aabb = this.aabb();
            var center = new Point((aabb.x1 + aabb.x2) / 2, (aabb.y1 + aabb.y2) / 2);
            return center;
        };
        DrawablePolylineCalculator.prototype.area = function () {
            if (this.points.length < 3)
                return 0;
            var s = this.points[0].y * (this.points[this.points.length - 1].x - this.points[1].x);
            for (var i = 1; i < this.points.length; i++) {
                s += this.points[i].y * (this.points[i - 1].x - this.points[(i + 1) % this.points.length].x);
            }
            return Math.abs(s * 0.5);
        };
        DrawablePolylineCalculator.prototype.length = function () {
            if (this.points.length < 2)
                return 0;
            var s = 0;
            var p0 = this.points[0];
            var pn = this.points[this.points.length - 1];
            if (this.polyline.style.closed) {
                s = DrawablePolylineCalculator.hypot(p0.x - pn.x, p0.y - pn.y);
            }
            for (var i = 0; i < this.points.length - 1; i++) {
                var pi = this.points[i];
                var pj = this.points[i + 1];
                s += DrawablePolylineCalculator.hypot(pi.x - pj.x, pi.y - pj.y);
            }
            return s;
        };
        DrawablePolylineCalculator.hypot = function (x, y) {
            return Math.sqrt(x * x + y * y);
        };
        DrawablePolylineCalculator.prototype.alignPoint = function (index, radius) {
            index = (index + this.points.length) % this.points.length;
            var xy = this.points[index];
            var newX = xy.x;
            var newY = xy.y;
            var first = this.points[(index + 1) % this.points.length];
            if (Math.abs(first.x - xy.x) <= radius)
                newX = first.x;
            if (Math.abs(first.y - xy.y) <= radius)
                newY = first.y;
            if (this.points.length > 2) {
                var last = this.points[(index - 1 + this.points.length) % this.points.length];
                if (Math.abs(last.x - xy.x) <= radius)
                    newX = last.x;
                if (Math.abs(last.y - xy.y) <= radius)
                    newY = last.y;
            }
            return new Point(newX, newY);
        };
        return DrawablePolylineCalculator;
    }());
    var DrawablePolylineStyle = /** @class */ (function () {
        function DrawablePolylineStyle(pack) {
            this._closed = pack.closed;
            this._lineWidth = pack.lineWidth;
            this._fill = pack.fill;
            this._fillColor = ColorEntry.findByName(pack.fillColorName);
            this._fillAlpha = AlphaEntry.findByName(pack.fillAlphaName);
            this._fillString = combineColorAlpha(this._fillColor, this._fillAlpha);
            this._stroke = pack.stroke;
            this._strokeColor = ColorEntry.findByName(pack.strokeColorName);
            this._strokeAlpha = AlphaEntry.findByName(pack.strokeAlphaName);
            this._strokeString = combineColorAlpha(this._strokeColor, this._strokeAlpha);
        }
        Object.defineProperty(DrawablePolylineStyle.prototype, "closed", {
            get: function () {
                return this._closed;
            },
            set: function (value) {
                this._closed = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "lineWidth", {
            get: function () {
                return this._lineWidth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "fill", {
            get: function () {
                return this._fill;
            },
            set: function (value) {
                this._fill = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "fillColor", {
            get: function () {
                return this._fillColor;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "fillAlpha", {
            get: function () {
                return this._fillAlpha;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "fillString", {
            get: function () {
                return this._fillString;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "stroke", {
            get: function () {
                return this._stroke;
            },
            set: function (value) {
                this._stroke = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "strokeColor", {
            get: function () {
                return this._strokeColor;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "strokeAlpha", {
            get: function () {
                return this._strokeAlpha;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "strokeString", {
            get: function () {
                return this._strokeString;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "onScreen", {
            get: function () {
                return this._lineWidth.onScreen;
            },
            set: function (onScreen) {
                this._lineWidth.onScreen = onScreen;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "onCanvas", {
            get: function () {
                return this._lineWidth.onCanvas;
            },
            set: function (onCanvas) {
                this._lineWidth.onCanvas = onCanvas;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawablePolylineStyle.prototype, "ofScreen", {
            get: function () {
                return this._lineWidth.ofScreen;
            },
            set: function (ofScreen) {
                this._lineWidth.ofScreen = ofScreen;
            },
            enumerable: true,
            configurable: true
        });
        DrawablePolylineStyle.prototype.pack = function () {
            return new DrawablePolylinePack(null, this._closed, this._lineWidth, this._fill, this._fillColor.name, this._fillAlpha.name, this._stroke, this._strokeColor.name, this._strokeAlpha.name);
        };
        DrawablePolylineStyle.prototype.setFillColor = function (fillColor, fillAlpha) {
            this._fillColor = fillColor;
            this._fillAlpha = fillAlpha;
            this._fillString = combineColorAlpha(this._fillColor, this._fillAlpha);
        };
        DrawablePolylineStyle.prototype.setStrokeColor = function (strokeColor, strokeAlpha) {
            this._strokeColor = strokeColor;
            this._strokeAlpha = strokeAlpha;
            this._strokeString = combineColorAlpha(this._strokeColor, this._strokeAlpha);
        };
        return DrawablePolylineStyle;
    }());
    var DrawablePolyline = /** @class */ (function (_super) {
        __extends(DrawablePolyline, _super);
        function DrawablePolyline(pack) {
            var _this = _super.call(this) || this;
            _this.canvasAABB = new AABB();
            _this.valid = false;
            _this.points = pack.points;
            _this.style = new DrawablePolylineStyle(pack);
            _this.picker = new DrawablePolylinePicker(_this, _this.points);
            _this.editor = new DrawablePolylineEditor(_this, _this.points);
            _this.calculator = new DrawablePolylineCalculator(_this, _this.points);
            return _this;
        }
        DrawablePolyline.prototype.clone = function (offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            var points = [];
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                points.push(new Point(point.x + offsetX, point.y + offsetY));
            }
            var pack = this.style.pack();
            pack.points = points;
            return pack;
        };
        DrawablePolyline.prototype.pack = function () {
            var pack = this.style.pack();
            pack.points = this.points;
            return pack;
        };
        DrawablePolyline.prototype.invalidate = function () {
            this.valid = false;
        };
        DrawablePolyline.prototype.validate = function () {
            if (!this.valid) {
                this.calculator.aabb(this.canvasAABB);
            }
        };
        DrawablePolyline.prototype.render = function (canvas, renderer, camera) {
            this.validate();
            var inScreen = camera.canvasAABBInScreen(this.canvasAABB);
            if (inScreen) {
                renderer.setFillColor(this.style.fillString);
                renderer.setStrokeColor(this.style.strokeString);
                renderer.renderPolyline(camera, this.points, this.style.closed, this.style.fill, this.style.stroke, this.style.lineWidth);
            }
        };
        DrawablePolyline.typeName = "DrawablePolyline";
        return DrawablePolyline;
    }(Drawable));

    var Selection = /** @class */ (function () {
        function Selection() {
        }
        Selection.register = function (typeName, onselect, ondeselect) {
            if (typeName) {
                if (onselect)
                    this.mapSelect[typeName] = onselect;
                if (ondeselect)
                    this.mapDeselect[typeName] = ondeselect;
            }
            this.listDeselect.push(ondeselect);
        };
        Selection.deselectAll = function () {
            for (var _i = 0, _a = this.listDeselect; _i < _a.length; _i++) {
                var ondeselect = _a[_i];
                ondeselect();
            }
        };
        Selection.deselect = function (typeName) {
            var ondeselect = this.mapDeselect[typeName];
            if (ondeselect) {
                ondeselect();
            }
        };
        Selection.select = function (typeName, item) {
            this.deselectAll();
            var onselect = this.mapSelect[typeName];
            if (onselect) {
                onselect(item);
            }
        };
        Selection.listDeselect = [];
        Selection.mapSelect = {};
        Selection.mapDeselect = {};
        return Selection;
    }());

    var LayerPolylineView = /** @class */ (function (_super) {
        __extends(LayerPolylineView, _super);
        function LayerPolylineView(canvas) {
            var _this = _super.call(this, LayerPolylineView.layerName, canvas) || this;
            _this.polylines = [];
            return _this;
        }
        LayerPolylineView.prototype.loadData = function (data) {
            this.polylines = [];
            if (data.polylines) {
                for (var _i = 0, _a = data.polylines; _i < _a.length; _i++) {
                    var pack = _a[_i];
                    this.polylines.push(new DrawablePolyline(pack));
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
                        var selected = null;
                        for (var _i = 0, _a = self.polylines; _i < _a.length; _i++) {
                            var polyline = _a[_i];
                            var pickPointIndex = polyline.picker.pickPoint(x, y, radius);
                            var pickLine = polyline.picker.pickLine(x, y, radius);
                            var pickShape = polyline.picker.pickShape(x, y);
                            if (pickPointIndex != null || pickLine || pickShape) {
                                selected = polyline;
                            }
                        }
                        if (selected) {
                            Selection.select(DrawablePolyline.typeName, selected);
                            return true;
                        }
                        Selection.deselect(DrawablePolyline.typeName);
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
            }(MouseListener));
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
        LayerPolylineView.prototype.containPolyline = function (polyline) {
            return this.polylines.indexOf(polyline) >= 0;
        };
        LayerPolylineView.prototype.saveData = function (data) {
            data.polylines = [];
            for (var _i = 0, _a = this.polylines; _i < _a.length; _i++) {
                var polyline = _a[_i];
                data.polylines.push(polyline.pack());
            }
        };
        LayerPolylineView.prototype.render = function (renderer) {
            _super.prototype.render.call(this, renderer);
            for (var _i = 0, _a = this.polylines; _i < _a.length; _i++) {
                var polyline = _a[_i];
                polyline.render(this.canvas, renderer, this.camera);
            }
        };
        LayerPolylineView.prototype.unload = function () {
            _super.prototype.unload.call(this);
        };
        LayerPolylineView.layerName = "polyline view";
        return LayerPolylineView;
    }(Layer));

    var Size = /** @class */ (function () {
        function Size(onScreen, onCanvas, ofScreen) {
            this.onScreen = onScreen;
            this.onCanvas = onCanvas ? onCanvas : 0;
            this.ofScreen = ofScreen ? ofScreen : 0;
        }
        return Size;
    }());

    var LayerPolylineEdit = /** @class */ (function (_super) {
        __extends(LayerPolylineEdit, _super);
        function LayerPolylineEdit(canvas) {
            var _this = _super.call(this, LayerPolylineEdit.layerName, canvas) || this;
            _this.polylineNew = null;
            _this.polylineEdit = null;
            var self = _this;
            Selection.register(DrawablePolyline.typeName, function (item) {
                _this.startEditingPolyline(item);
            }, function () {
                self.finishEditing();
            });
            return _this;
        }
        LayerPolylineEdit.prototype.loadMap = function (map) {
            this.map = map;
        };
        LayerPolylineEdit.prototype.loadData = function (data) {
            this.layerView = this.canvas.findLayer(LayerPolylineView.layerName);
            this.polylineNew = null;
            this.polylineEdit = null;
            this.finishEditing();
            Ui.setVisibility("panelPolylineSelected", false);
        };
        LayerPolylineEdit.prototype.startCreatingPolyline = function () {
            this.finishEditing();
            var self = this;
            this.polylineNew = new DrawablePolyline(new DrawablePolylinePack([], true, new Size(2), true, "white", "25", true, "white", "75"));
            this.bindPolylineConfigUi(this.polylineNew);
            Ui.setContent(LayerPolylineEdit.HINT_ELEMENT_ID, LayerPolylineEdit.HINT_NEW_POLYLINE);
            this._mouseListener = new /** @class */ (function (_super) {
                __extends(class_1, _super);
                function class_1() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.down = false;
                    _this.moved = false;
                    return _this;
                }
                class_1.prototype.preview = function (position, magnetic) {
                    self.polylineNew.editor.setPoint(-1, position.x, position.y);
                    if (magnetic) {
                        var radius = self.camera.screenSizeToCanvas(LayerPolylineEdit.MAG_RADIUS);
                        var result = self.polylineNew.calculator.alignPoint(-1, radius);
                        self.polylineNew.editor.setPoint(-1, result.x, result.y);
                    }
                };
                class_1.prototype.onmousedown = function (event) {
                    if (event.button == 0 && !this.down) { //left button down => add point
                        this.down = true;
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        self.polylineNew.editor.addPoint(position.x, position.y);
                        self.canvas.requestRender();
                        return true;
                    }
                    else if (event.button == 2) {
                        this.moved = false;
                    }
                    return false;
                };
                class_1.prototype.onmouseup = function (event) {
                    if (event.button == 0) { //left button up => update last point
                        this.down = false;
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        this.preview(position, event.ctrlKey);
                        self.canvas.requestRender();
                        return true;
                    }
                    else if (event.button == 2) {
                        if (!this.moved) {
                            var newPolyline = self.polylineNew;
                            self.finishEditing();
                            if (self.layerView.containPolyline(newPolyline)) {
                                self.startEditingPolyline(newPolyline);
                            }
                        }
                        this.moved = false;
                        return true;
                    }
                    return false;
                };
                class_1.prototype.onmousemove = function (event) {
                    if (this.down) { //left button is down => show modification
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        this.preview(position, event.ctrlKey);
                        self.canvas.requestRender();
                        return true;
                    }
                    else if (event.buttons & 2) {
                        this.moved = true;
                    }
                    return false;
                };
                return class_1;
            }(MouseListener));
            return this.polylineNew;
        };
        LayerPolylineEdit.prototype.deleteCreating = function () {
            this.polylineNew = null;
            this.finishEditing();
            this.canvas.requestRender();
        };
        LayerPolylineEdit.prototype.startEditingPolyline = function (polyline) {
            this.finishEditing();
            //show polyline and its point indicators
            this.polylineEdit = polyline;
            this.bindPolylineConfigUi(this.polylineEdit);
            Ui.setContent(LayerPolylineEdit.HINT_ELEMENT_ID, LayerPolylineEdit.HINT_EDIT_POLYLINE);
            //start listening to mouse events: drag point, remove point on double click, add point on double click
            var self = this;
            this._mouseListener = new /** @class */ (function (_super) {
                __extends(class_2, _super);
                function class_2() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.down = false;
                    _this.moved = false;
                    _this.dragPointIndex = null;
                    _this.dragShape = false;
                    _this.dragShapeX = -1;
                    _this.dragShapeY = -1;
                    return _this;
                }
                class_2.prototype.onmousedown = function (event) {
                    this.dragPointIndex = null;
                    if (event.button == 0) { //left button down => test drag point
                        this.down = true;
                        //test point
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        var pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (pointIndex != null) { //start dragging this point
                            this.dragPointIndex = pointIndex;
                            return true;
                        }
                        var shape = polyline.picker.pickShape(position.x, position.y);
                        if (pointIndex == null && shape && event.altKey) {
                            if (event.ctrlKey) {
                                var copied = new DrawablePolyline(polyline.clone());
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
                };
                class_2.prototype.onmouseup = function (event) {
                    var wasDragging = this.dragPointIndex != null || !!this.dragShape; //pass event if not dragging, so that LayerPolylineView will deselect this polyline
                    this.dragPointIndex = null;
                    this.dragShape = false;
                    this.dragShapeX = -1;
                    this.dragShapeY = -1;
                    if (event.button == 0) { //left button up => nothing
                        this.down = false;
                        return wasDragging;
                    }
                    else if (event.button == 2) {
                        var hit = false;
                        if (!this.moved) {
                            var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                            //test points
                            var pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
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
                };
                class_2.prototype.ondblclick = function (event) {
                    if (event.button == 0) {
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        //test points
                        var pointIndex = polyline.picker.pickPoint(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (pointIndex != null) { //delete point
                            if (polyline.editor.pointCount() > 3) { //so it will be at least a triangle
                                polyline.editor.removePoint(pointIndex);
                                self.canvas.requestRender();
                            }
                            return true;
                        }
                        //test segments
                        var segment = polyline.picker.pickLine(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (segment) { //add point
                            var newIndex = segment.p1Index; //insert point after p1
                            polyline.editor.insertPoint(segment.position.x, segment.position.y, newIndex);
                            self.canvas.requestRender();
                            return true;
                        }
                    }
                    return false;
                };
                class_2.prototype.onmousemove = function (event) {
                    if (this.down) { //left button is down => drag
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        if (this.dragPointIndex != null) {
                            polyline.editor.setPoint(this.dragPointIndex, position.x, position.y);
                            if (event.ctrlKey) {
                                var radius = self.camera.screenSizeToCanvas(LayerPolylineEdit.MAG_RADIUS);
                                var result = polyline.calculator.alignPoint(this.dragPointIndex, radius);
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
                };
                return class_2;
            }(MouseListener));
            this.canvas.requestRender();
        };
        LayerPolylineEdit.prototype.finishEditing = function () {
            Ui.setVisibility("panelPolylineSelected", false);
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
        };
        LayerPolylineEdit.prototype.render = function (renderer) {
            var _this = this;
            if (this.polylineNew) {
                this.polylineNew.render(this.canvas, renderer, this.camera);
                //draw two points
                var pointCount = this.polylineNew.editor.pointCount();
                if (pointCount > 0) {
                    var p = this.polylineNew.editor.getPoint(0);
                    this.drawPointCircle(p.x, p.y, renderer);
                }
                if (pointCount > 1) {
                    var p = this.polylineNew.editor.getPoint(-1);
                    this.drawPointCircle(p.x, p.y, renderer);
                }
            }
            if (this.polylineEdit) {
                //draw all points
                this.polylineEdit.editor.forEachPoint(function (x, y) {
                    _this.drawPointCircle(x, y, renderer);
                });
            }
        };
        LayerPolylineEdit.prototype.drawPointCircle = function (x, y, renderer) {
            var position = this.camera.canvasToScreen(x, y);
            renderer.setColor("rgba(255,255,255,1)");
            renderer.drawCircle(position.x, position.y, 5, false, true, 1);
            renderer.setColor("rgba(0,0,0,0.5)");
            renderer.drawCircle(position.x, position.y, 4, true, false);
        };
        LayerPolylineEdit.prototype.deleteEditing = function () {
            if (this.polylineEdit) {
                this.layerView.deletePolyline(this.polylineEdit);
                this.finishEditing();
            }
        };
        LayerPolylineEdit.prototype.bindPolylineConfigUi = function (polyline) {
            var _this = this;
            Ui.setVisibility("panelPolylineSelected", true);
            Ui.bindButtonOnClick("polylineButtonCopy", function () {
                var offset = _this.canvas.getCamera().screenSizeToCanvas(20);
                var newPolyline = new DrawablePolyline(polyline.clone(offset, offset));
                _this.finishEditing();
                _this.layerView.addPolyline(newPolyline);
                _this.startEditingPolyline(newPolyline);
                _this.canvas.requestRender();
            });
            Ui.setVisibility("polylineAreaContainer", this.map.widthMillimeter > 0 && this.map.heightMillimeter > 0);
            Ui.bindButtonOnClick("polylineButtonArea", function () {
                if (_this.map.widthMillimeter > 0 && _this.map.heightMillimeter > 0) {
                    Ui.setContent("poylineTextArea", "");
                    if (polyline.style.fill) {
                        var area = polyline.calculator.area();
                        var areaMM2 = area / _this.map.width / _this.map.height * _this.map.widthMillimeter * _this.map.heightMillimeter;
                        areaMM2 = Math.round(areaMM2 * 100) / 100;
                        Ui.setContent("poylineTextArea", areaMM2 + "mm^2");
                    }
                    else {
                        var length_1 = polyline.calculator.length();
                        var lengthMM = length_1 * Math.sqrt(_this.map.widthMillimeter * _this.map.heightMillimeter / _this.map.width / _this.map.height);
                        lengthMM = Math.round(lengthMM * 100) / 100;
                        Ui.setContent("poylineTextArea", lengthMM + "mm");
                    }
                }
            });
            Ui.setContent("poylineTextArea", "");
            Ui.bindButtonOnClick("polylineButtonRotateCCW", function () {
                polyline.editor.rotateCCW();
                _this.canvas.requestRender();
            });
            Ui.bindButtonOnClick("polylineButtonRotateCW", function () {
                polyline.editor.rotateCW();
                _this.canvas.requestRender();
            });
            Ui.bindButtonOnClick("polylineButtonFlipX", function () {
                polyline.editor.flipX();
                _this.canvas.requestRender();
            });
            Ui.bindButtonOnClick("polylineButtonFlipY", function () {
                polyline.editor.flipY();
                _this.canvas.requestRender();
            });
            Ui.bindCheckbox("polylineCheckboxFill", polyline.style.fill, function (newValue) {
                polyline.style.fill = newValue;
                _this.canvas.requestRender();
            });
            Ui.bindCheckbox("polylineCheckboxStroke", polyline.style.stroke, function (newValue) {
                polyline.style.stroke = newValue;
                _this.canvas.requestRender();
            });
            Ui.bindCheckbox("polylineCheckboxClosed", polyline.style.closed, function (newValue) {
                polyline.style.closed = newValue;
                _this.canvas.requestRender();
            });
            Ui.bindNumber("polylineTextSizeOnScreen", polyline.style.onScreen, function (newValue) {
                polyline.style.onScreen = newValue;
                _this.canvas.requestRender();
            });
            Ui.bindNumber("polylineTextSizeOnCanvas", polyline.style.onCanvas, function (newValue) {
                polyline.style.onCanvas = newValue;
                _this.canvas.requestRender();
            });
            Ui.bindNumber("polylineTextSizeOfScreen", polyline.style.ofScreen * 1000, function (newValue) {
                polyline.style.ofScreen = newValue * 0.001;
                _this.canvas.requestRender();
            });
            Ui.bindColor("polylineContainerStrokeColor", "polylineContainerStrokeAlpha", polyline.style.strokeColor, polyline.style.strokeAlpha, function (newColor, newAlpha) {
                polyline.style.setStrokeColor(newColor, newAlpha);
                _this.canvas.requestRender();
            });
            Ui.bindColor("polylineContainerFillColor", "polylineContainerFillAlpha", polyline.style.fillColor, polyline.style.fillAlpha, function (newColor, newAlpha) {
                polyline.style.setFillColor(newColor, newAlpha);
                _this.canvas.requestRender();
            });
        };
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
        return LayerPolylineEdit;
    }(Layer));

    var DrawableTextPack = /** @class */ (function () {
        function DrawableTextPack(text, colorName, alphaName, 
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
        return DrawableTextPack;
    }());
    var DrawableText = /** @class */ (function (_super) {
        __extends(DrawableText, _super);
        function DrawableText(pack) {
            var _this = _super.call(this) || this;
            _this._text = "";
            _this._canvasAABB = new AABB();
            _this.sizeValid = false;
            _this.canvasZoom = -1;
            _this.canvasWidth = 0;
            _this.canvasHeight = 0;
            _this.screenWidth = 0;
            _this.screenHeight = 0;
            _this._text = pack.text;
            _this.color = ColorEntry.findByName(pack.colorName);
            _this.alpha = AlphaEntry.findByName(pack.alphaName);
            _this.colorString = combineColorAlpha(_this.color, _this.alpha);
            _this.fontSize = pack.fontSize;
            _this._x = pack.x;
            _this._y = pack.y;
            return _this;
        }
        DrawableText.prototype.invalidate = function () {
            this.sizeValid = false;
        };
        Object.defineProperty(DrawableText.prototype, "text", {
            get: function () {
                return this._text;
            },
            set: function (value) {
                this._text = value;
                this.invalidate();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawableText.prototype, "x", {
            get: function () {
                return this._x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawableText.prototype, "y", {
            get: function () {
                return this._y;
            },
            enumerable: true,
            configurable: true
        });
        DrawableText.prototype.validateCanvasAABB = function (camera, renderer) {
            this.validate(camera, renderer);
            return this._canvasAABB;
        };
        Object.defineProperty(DrawableText.prototype, "onScreen", {
            get: function () {
                return this.fontSize.onScreen;
            },
            set: function (onScreen) {
                this.fontSize.onScreen = onScreen;
                this.invalidate();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawableText.prototype, "onCanvas", {
            get: function () {
                return this.fontSize.onCanvas;
            },
            set: function (onCanvas) {
                this.fontSize.onCanvas = onCanvas;
                this.invalidate();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DrawableText.prototype, "ofScreen", {
            get: function () {
                return this.fontSize.ofScreen;
            },
            set: function (ofScreen) {
                this.fontSize.ofScreen = ofScreen;
                this.invalidate();
            },
            enumerable: true,
            configurable: true
        });
        DrawableText.prototype.setPosition = function (x, y) {
            this._x = x;
            this._y = y;
            this.invalidate();
        };
        DrawableText.prototype.setColorAlpha = function (color, alpha) {
            this.color = color;
            this.alpha = alpha;
            this.colorString = combineColorAlpha(this.color, this.alpha);
        };
        DrawableText.prototype.clone = function (offsetX, offsetY) {
            return new DrawableTextPack(this._text, this.color.name, this.alpha.name, this.fontSize, this._x + offsetX, this._y + offsetY);
        };
        DrawableText.prototype.pack = function () {
            return new DrawableTextPack(this._text, this.color.name, this.alpha.name, this.fontSize, this._x, this._y);
        };
        DrawableText.prototype.render = function (canvas, renderer, camera) {
            renderer.setColor(this.colorString);
            this.validate(camera, renderer);
            var inScreen = camera.canvasAABBInScreen(this._canvasAABB);
            if (inScreen) {
                renderer.renderText(camera, this._text, this.screenHeight, this._x, this._y, "center", "middle");
            }
        };
        DrawableText.prototype.validate = function (camera, renderer) {
            if (!this.sizeValid || this.canvasZoom != camera.getZoom()) {
                this.sizeValid = true;
                var wh = renderer.measureText(camera, this._text, this.fontSize);
                var ratio = camera.screenSizeToCanvas(1);
                this.canvasZoom = camera.getZoom();
                this.canvasWidth = wh[0] * ratio / 2;
                this.canvasHeight = wh[1] * ratio / 2;
                this.screenWidth = wh[0];
                this.screenHeight = wh[1];
                this.calcCanvasAABB();
            }
        };
        DrawableText.prototype.pick = function (x, y, radius) {
            var h = (this._x - this.canvasWidth - radius <= x) && (x <= this._x + this.canvasWidth + radius);
            var v = (this._y - this.canvasHeight - radius <= y) && (y <= this._y + this.canvasHeight + radius);
            return h && v;
        };
        DrawableText.prototype.calcCanvasAABB = function () {
            this._canvasAABB.x1 = this.x - this.canvasWidth;
            this._canvasAABB.y1 = this.y - this.canvasHeight;
            this._canvasAABB.x2 = this.x + this.canvasWidth;
            this._canvasAABB.y2 = this.y + this.canvasHeight;
            return this._canvasAABB;
        };
        DrawableText.typeName = "DrawableText";
        return DrawableText;
    }(Drawable));

    var LayerTextView = /** @class */ (function (_super) {
        __extends(LayerTextView, _super);
        function LayerTextView(canvas) {
            var _this = _super.call(this, LayerTextView.layerName, canvas) || this;
            _this.texts = [];
            return _this;
        }
        LayerTextView.prototype.loadData = function (data) {
            this.texts = [];
            if (data.texts) {
                for (var _i = 0, _a = data.texts; _i < _a.length; _i++) {
                    var pack = _a[_i];
                    this.texts.push(new DrawableText(pack));
                }
            }
            //listen to mouse click to select text
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
                        var canvasXY = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        var x = canvasXY.x, y = canvasXY.y;
                        var selected = null;
                        for (var _i = 0, _a = self.texts; _i < _a.length; _i++) {
                            var text = _a[_i];
                            var pick = text.pick(x, y, self.camera.screenSizeToCanvas(5));
                            if (pick)
                                selected = text;
                        }
                        if (selected) {
                            Selection.select(DrawableText.typeName, selected);
                            return true;
                        }
                        Selection.deselect(DrawableText.typeName);
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
            }(MouseListener));
        };
        LayerTextView.prototype.addText = function (text) {
            this.texts.push(text);
            this.canvas.requestRender();
        };
        LayerTextView.prototype.deleteText = function (text) {
            var index = this.texts.indexOf(text);
            if (index !== -1) {
                this.texts.splice(index, 1);
                return true;
            }
            else {
                return false;
            }
        };
        LayerTextView.prototype.saveData = function (data) {
            data.texts = [];
            for (var _i = 0, _a = this.texts; _i < _a.length; _i++) {
                var text = _a[_i];
                data.texts.push(text.pack());
            }
        };
        LayerTextView.prototype.render = function (renderer) {
            _super.prototype.render.call(this, renderer);
            for (var _i = 0, _a = this.texts; _i < _a.length; _i++) {
                var text = _a[_i];
                text.render(this.canvas, renderer, this.camera);
            }
        };
        LayerTextView.prototype.unload = function () {
            _super.prototype.unload.call(this);
        };
        LayerTextView.layerName = "text view";
        return LayerTextView;
    }(Layer));

    var LayerTextEdit = /** @class */ (function (_super) {
        __extends(LayerTextEdit, _super);
        function LayerTextEdit(canvas) {
            var _this = _super.call(this, LayerTextEdit.layerName, canvas) || this;
            _this.textEdit = null;
            var self = _this;
            Selection.register(DrawableText.typeName, function (item) {
                self.startEditingText(item);
            }, function () {
                self.finishEditing();
            });
            return _this;
        }
        LayerTextEdit.prototype.loadData = function (data) {
            this.layerView = this.canvas.findLayer(LayerTextView.layerName);
            this.finishEditing();
            Ui.setVisibility("panelTextSelected", false);
        };
        LayerTextEdit.prototype.startCreatingText = function () {
            this.finishEditing();
            var self = this;
            //show text and its point indicators
            var textNew = new DrawableText(new DrawableTextPack("text", "white", "100", new Size(20, 50), 0, 0));
            this.bindTextConfigUi(textNew);
            Ui.setContent(LayerTextEdit.HINT_ELEMENT_ID, LayerTextEdit.HINT_NEW_TEXT);
            this._mouseListener = new /** @class */ (function (_super) {
                __extends(class_1, _super);
                function class_1() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.down = false;
                    return _this;
                }
                class_1.prototype.onmousedown = function (event) {
                    if (event.button == 0) {
                        this.down = true;
                        return true;
                    }
                    return false;
                };
                class_1.prototype.onmouseup = function (event) {
                    if (event.button == 0) { //left button up => update last point
                        this.down = false;
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        textNew.setPosition(position.x, position.y);
                        self.layerView.addText(textNew);
                        Selection.select(DrawableText.typeName, textNew);
                        self.canvas.requestRender();
                        return true;
                    }
                    else {
                        return false;
                    }
                };
                class_1.prototype.onmousemove = function (event) {
                    return (event.buttons & 1) && this.down;
                };
                return class_1;
            }(MouseListener));
        };
        LayerTextEdit.prototype.startEditingText = function (text) {
            this.finishEditing();
            //show text and its point indicators
            this.textEdit = text;
            this.bindTextConfigUi(this.textEdit);
            Ui.setContent(LayerTextEdit.HINT_ELEMENT_ID, LayerTextEdit.HINT_EDIT_TEXT);
            //start listening to mouse events: drag point, remove point on double click, add point on double click
            var self = this;
            this._mouseListener = new /** @class */ (function (_super) {
                __extends(class_2, _super);
                function class_2() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.down = false;
                    _this.drag = false;
                    _this.dragX = 0;
                    _this.dragY = 0;
                    return _this;
                }
                class_2.prototype.onmousedown = function (event) {
                    if (event.button == 0) { //left button down => test drag point
                        this.down = true;
                        this.drag = false;
                        //test
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        var pick = text.pick(position.x, position.y, self.camera.screenSizeToCanvas(5));
                        if (pick && event.altKey) { //start dragging
                            if (event.ctrlKey) {
                                var copied = new DrawableText(text.clone(0, 0));
                                self.layerView.addText(copied);
                            }
                            this.drag = true;
                            this.dragX = position.x - text.x;
                            this.dragY = position.y - text.y;
                            return event.altKey;
                        }
                    }
                    return false;
                };
                class_2.prototype.onmouseup = function (event) {
                    var passEvent = !this.drag; //pass event if not moving point, so that LayerTextView will deselect this text
                    this.drag = false;
                    if (event.button == 0) { //left button up => nothing
                        this.down = false;
                        return !passEvent;
                    }
                    return false;
                };
                class_2.prototype.onmousemove = function (event) {
                    if (this.down && this.drag) {
                        var position = self.camera.screenXyToCanvas(event.offsetX, event.offsetY);
                        self.textEdit.setPosition(position.x - this.dragX, position.y - this.dragY);
                        self.canvas.requestRender();
                        return true;
                    }
                    return false;
                };
                return class_2;
            }(MouseListener));
            this.canvas.requestRender();
        };
        LayerTextEdit.prototype.finishEditing = function () {
            Ui.setVisibility("panelTextSelected", false);
            if (this.textEdit) {
                if (this.textEdit.text.length == 0) {
                    this.layerView.deleteText(this.textEdit);
                }
                this.textEdit = null;
                this.canvas.requestRender();
            }
            this._mouseListener = null;
        };
        LayerTextEdit.prototype.render = function (renderer) {
            if (this.textEdit) {
                //draw rect
                renderer.setColor(this.textEdit.colorString);
                var aabb = this.textEdit.validateCanvasAABB(this.camera, renderer);
                var p1 = this.camera.canvasToScreen(aabb.x1, aabb.y1);
                var p2 = this.camera.canvasToScreen(aabb.x2, aabb.y2);
                renderer.drawRect(p1.x - 5, p1.y - 5, p2.x + 5, p2.y + 5, false, true, 2);
            }
        };
        LayerTextEdit.prototype.deleteEditing = function () {
            if (this.textEdit) {
                this.layerView.deleteText(this.textEdit);
                this.finishEditing();
            }
        };
        LayerTextEdit.prototype.bindTextConfigUi = function (text) {
            var _this = this;
            Ui.setVisibility("panelTextSelected", true);
            Ui.bindButtonOnClick("textButtonCopy", function () {
                var offset = _this.canvas.getCamera().screenSizeToCanvas(10);
                var newText = new DrawableText(text.clone(offset, offset));
                _this.finishEditing();
                _this.layerView.addText(newText);
                _this.startEditingText(newText);
                _this.canvas.requestRender();
            });
            Ui.bindValue("textTextContent", text.text, function (newValue) {
                text.text = newValue;
                _this.canvas.requestRender();
            });
            Ui.bindNumber("textTextSizeOnScreen", text.onScreen, function (newValue) {
                text.onScreen = newValue;
                _this.canvas.requestRender();
            });
            Ui.bindNumber("textTextSizeOnCanvas", text.onCanvas, function (newValue) {
                text.onCanvas = newValue;
                _this.canvas.requestRender();
            });
            Ui.bindNumber("textTextSizeOfScreen", text.ofScreen * 1000, function (newValue) {
                text.ofScreen = newValue * 0.001;
                _this.canvas.requestRender();
            });
            Ui.bindColor("textContainerColor", "textContainerAlpha", text.color, text.alpha, function (newColor, newAlpha) {
                text.setColorAlpha(newColor, newAlpha);
                _this.canvas.requestRender();
            });
        };
        LayerTextEdit.layerName = "text edit";
        LayerTextEdit.HINT_ELEMENT_ID = "textHint";
        LayerTextEdit.HINT_NEW_TEXT = "1. left click to create text<br>";
        LayerTextEdit.HINT_EDIT_TEXT = "1. hold alt to drag<br>" +
            "2. hold ctrl+alt to copy and drag <br>";
        return LayerTextEdit;
    }(Layer));

    var Github = /** @class */ (function () {
        function Github() {
        }
        Github.getComments = function (repo, issueId, callback) {
            NetUtil.get("https://api.github.com/repos/" + repo + "/issues/" + issueId + "/comments", function (json) {
                try {
                    var array = JSON.parse(json);
                    callback(array);
                }
                catch (e) {
                }
            });
        };
        Github.getIssueLink = function (repo, issueId) {
            return "https://github.com/" + repo + "/issues/" + issueId;
        };
        Github.getCommentLink = function (repo, issueId, commentId) {
            return "https://github.com/" + repo + "/issues/" + issueId + "#issuecomment-" + commentId;
        };
        return Github;
    }());

    var canvas = new Canvas(document.getElementById("container"), 'canvas2d');
    canvas.init();
    var layerImage = new LayerImage(canvas);
    var layerPolylineView = new LayerPolylineView(canvas);
    var layerPolylineEdit = new LayerPolylineEdit(canvas);
    var layerTextView = new LayerTextView(canvas);
    var layerTextEdit = new LayerTextEdit(canvas);
    canvas.addLayer(layerImage);
    canvas.addLayer(layerPolylineView);
    canvas.addLayer(layerPolylineEdit);
    canvas.addLayer(layerTextView);
    canvas.addLayer(layerTextEdit);
    Ui.bindButtonOnClick("buttonNewPolyline", function () {
        layerTextEdit.finishEditing();
        layerPolylineEdit.startCreatingPolyline();
    });
    Ui.bindButtonOnClick("polylineButtonDelete", function () {
        layerPolylineEdit.deleteEditing();
        layerPolylineEdit.deleteCreating();
        layerTextEdit.finishEditing();
        layerPolylineEdit.finishEditing();
    });
    Ui.bindButtonOnClick("buttonNewText", function () {
        layerPolylineEdit.finishEditing();
        layerTextEdit.startCreatingText();
    });
    Ui.bindButtonOnClick("textButtonDelete", function () {
        layerPolylineEdit.finishEditing();
        layerTextEdit.deleteEditing();
        layerTextEdit.finishEditing();
    });
    var App = /** @class */ (function () {
        function App() {
            this.currentMapName = null;
            this.issueLink = "";
            this.currentCommentId = 0;
            this.dummyData = null;
        }
        App.prototype.start = function () {
            var _this = this;
            NetUtil.get("https://misdake.github.io/ChipAnnotationData/list.txt", function (text) {
                var defaultMap = null;
                var lines = [];
                var maps = {};
                var names = [];
                if (text && text.length) {
                    lines = text.split("\n").filter(function (value) { return value.length > 0; }).map(function (value) { return value.trim(); });
                    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        var line = lines_1[_i];
                        var name_1 = line.substring(line.lastIndexOf('/') + 1);
                        names.push(name_1);
                        maps[name_1] = line;
                    }
                    if (lines.length > 0) {
                        defaultMap = names[0];
                    }
                }
                if (!defaultMap)
                    defaultMap = "Fiji";
                var url_string = window.location.href;
                var url = new URL(url_string);
                var mapName = url.searchParams.get("map") || defaultMap;
                var commentIdString = url.searchParams.get("commentId") || "0";
                _this.currentCommentId = parseInt(commentIdString);
                Ui.bindSelect("mapSelect", names, mapName, function (index, newMap) {
                    _this.currentCommentId = 0;
                    _this.loadMap(newMap, maps[newMap]);
                    _this.replaceUrl();
                });
                _this.loadMap(mapName, maps[mapName]);
            });
        };
        App.prototype.loadMap = function (mapName, mapString) {
            var _this = this;
            this.currentMapName = mapName;
            NetUtil.get(mapString + "/content.json", function (mapDesc) {
                var map = JSON.parse(mapDesc);
                canvas.loadMap(map);
                canvas.requestRender();
                _this.issueLink = Github.getIssueLink(map.githubRepo, map.githubIssueId);
                Ui.bindButtonOnClick("buttonSave", function () {
                    layerTextEdit.finishEditing();
                    layerPolylineEdit.finishEditing();
                    var data = canvas.save();
                    data.title = document.getElementById("dataTitle").value;
                    if (data.title == null || data.title == "") {
                        data.title = "untitled";
                    }
                    var dataString = JSON.stringify(data);
                    Ui.bindValue("dataOutput", dataString, function (newValue) {
                    });
                    Ui.copyToClipboard("dataOutput");
                    Ui.bindValue("dataOutput", "", function (newValue) {
                    });
                    if (_this.issueLink) {
                        window.open(_this.issueLink, '_blank');
                    }
                });
                Ui.bindValue("dataOutput", "", function (newValue) {
                });
                Ui.bindValue("dataTitle", "", function (newValue) {
                });
                Ui.bindSelect("dataSelect", [], null, function (index) {
                });
                _this.dummyData = new Data();
                _this.dummyData.title = "";
                canvas.loadData(_this.dummyData);
                Ui.bindValue("dataOutput", "", function (newValue) {
                });
                _this.loadGithubComment(map, _this.currentCommentId);
                Ui.bindButtonOnClick("buttonRefreshData", function () {
                    _this.loadGithubComment(map, _this.currentCommentId);
                });
            });
        };
        App.prototype.loadGithubComment = function (map, commentId) {
            var _this = this;
            if (map.githubRepo && map.githubIssueId) {
                Github.getComments(map.githubRepo, map.githubIssueId, function (comments) {
                    var list = [];
                    var entries = [];
                    var items = [];
                    list.push(null);
                    entries.push(_this.dummyData);
                    items.push("(empty)");
                    var startIndex = 0;
                    var startData = _this.dummyData;
                    var startCommentId = 0;
                    for (var _i = 0, comments_1 = comments; _i < comments_1.length; _i++) {
                        var comment = comments_1[_i];
                        try {
                            var data = JSON.parse(comment.body);
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
                    Ui.bindSelect("dataSelect", items, items[startIndex], function (index) {
                        var comment = list[index];
                        var data = entries[index];
                        _this.loadData(map, data, comment ? comment.id : 0);
                    });
                    _this.loadData(map, startData, startCommentId);
                });
            }
        };
        App.prototype.loadData = function (map, data, commentId) {
            Ui.bindValue("dataTitle", data.title, function (newValue) {
            });
            this.currentCommentId = commentId;
            if (commentId > 0) {
                this.issueLink = Github.getCommentLink(map.githubRepo, map.githubIssueId, commentId);
            }
            else {
                this.issueLink = Github.getIssueLink(map.githubRepo, map.githubIssueId);
            }
            Ui.bindValue("dataOutput", "", function (newValue) {
            });
            canvas.loadData(data);
            this.replaceUrl();
            canvas.requestRender();
        };
        App.prototype.replaceUrl = function () {
            var url = location.pathname + '?map=' + this.currentMapName;
            if (this.currentCommentId > 0)
                url += '&commentId=' + this.currentCommentId;
            history.replaceState(null, "", url);
        };
        return App;
    }());
    new App().start();

}));
//# sourceMappingURL=app.js.map

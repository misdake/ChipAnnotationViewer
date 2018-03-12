define('Canvas', ['Renderer', 'Camera'], function (Renderer, Camera) {
    function Canvas(domElement, name) {
        this.domElement = domElement;
        this.name = name;

        this.layers = [];
        this.layerByName = {};

        this.camera = new Camera();
    }

    Canvas.prototype.init = function () {
        this.domElement.innerHTML = "<canvas id=\"" + this.name + "\" style='width:100%;height:100%;overflow:hidden;position:absolute'></canvas>";
        this.canvasElement = document.getElementById(this.name);
        this.canvasElement.width = this.canvasElement.clientWidth;
        this.canvasElement.height = this.canvasElement.clientHeight;
        this.context = this.canvasElement.getContext("2d");
        this.renderer = new Renderer(this.canvasElement, this.context);

        var self = this;

        this.canvasElement.onmousewheel = function (event) {
            event = event || window.event;
            var layerImage = self.getLayer('image');
            if (layerImage.zoomLevel !== undefined && layerImage.maxLevel) {
                var diff = event.wheelDelta > 0 ? -1 : 1;
                layerImage.loadImageZoom(layerImage.zoomLevel + diff);
            }
        };
    };

    Canvas.prototype.addLayer = function (layer) {
        var name = layer.name;
        var renderOrder = layer.renderOrder;

        //TODO deny duplicate names?
        this.layers[renderOrder] = this.layers[renderOrder] || [];
        this.layers[renderOrder].push(layer);
        this.layerByName[name] = layer;
    };

    Canvas.prototype.getLayer = function (name) {
        return this.layerByName[name];
    };

    Canvas.prototype.requestRender = function () {
        var self = this;
        requestAnimationFrame(function () {
            self.render();
        })
    };

    Canvas.prototype.load = function (content, folder) {
        var canvas = this;
        Object.keys(this.layers).sort().forEach(function (renderOrder) {
            canvas.layers[renderOrder].forEach(function (layer) {
                layer.load(content, folder);
            })
        });
    };

    Canvas.prototype.render = function () {
        this.renderer.clear();

        var requestNextFrame = false;
        var canvas = this;
        var renderer = this.renderer;
        var camera = this.camera;
        Object.keys(this.layers).sort().forEach(function (renderOrder) {
            canvas.layers[renderOrder].forEach(function (layer) {
                requestNextFrame |= layer.render(0, canvas, renderer, camera);
            })
        });
        if (requestNextFrame) {
            this.requestRender();
        } else {
            console.log('stopped');
        }
    };

    return Canvas;
});
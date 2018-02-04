define('Canvas', ['Renderer'], function (Renderer) {
    function Canvas(domElement, name) {
        this.domElement = domElement;
        this.name = name;

        this.layers = [];
        this.layerByName = {};
    }

    Canvas.prototype.load = function () {
        this.domElement.innerHTML = "<canvas id=\"" + this.name + "\" style='overflow:hidden'></canvas>";
        this.canvasElement = document.getElementById(this.name);
        this.context = this.canvasElement.getContext("2d");
        this.renderer = new Renderer(this.canvasElement, this.context);
    };

    Canvas.prototype.addLayer = function (layer) {
        var name = layer.name;
        var renderOrder = layer.renderOrder;

        //TODO deny duplicate names?
        this.layers[renderOrder] = this.layers[renderOrder] || [];
        this.layers[renderOrder].push(layer);
        this.layerByName[name] = layer;
    };

    Canvas.prototype.removeLayer = function (layer) {
        //TODO
        //remove from layers
        //remove from layerByName
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
    Canvas.prototype.render = function () {
        this.renderer.clear();

        var requestNextFrame = false;
        var canvas = this;
        var renderer = this.renderer;
        Object.keys(this.layers).sort().forEach(function (renderOrder) {
            canvas.layers[renderOrder].forEach(function (layer) {
                requestNextFrame |= layer.render(0, canvas, renderer)
            })
        });
        if (requestNextFrame) {
            this.requestRender();
        } else {
            console.log('stopped');
        }
    };

    Canvas.prototype.unload = function () {
        this.domElement.innerHTML = "";
        this.canvasElement = undefined;
        this.context = undefined;
    };

    return Canvas;
});
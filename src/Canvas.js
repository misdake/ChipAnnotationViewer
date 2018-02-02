define('Canvas', ['Renderer'], function (Renderer) {
    function Canvas(domElement, name) {
        this.domElement = domElement;
        this.name = name
    }

    Canvas.prototype.load = function () {
        this.domElement.innerHTML = "<canvas id=\"" + this.name + "\" style='overflow:hidden'></canvas>";
        this.canvasElement = document.getElementById(this.name);
        this.context = this.canvasElement.getContext("2d");
        this.renderer = new Renderer(this.canvasElement, this.context);

        this.renderer.clear();

        this.image = new Image();
        this.image.src = "icon.jpg";
    };

    Canvas.prototype.addLayer = function () {

    };

    Canvas.prototype.createOrGetLayer = function (name) {

    };

    Canvas.prototype.removeLayer = function (name) {

    };

    Canvas.prototype.getLayer = function (name) {

    };

    Canvas.prototype.requestRender = function () {
        var self = this;
        requestAnimationFrame(function () {
            self.render();
        })
    };
    Canvas.prototype.render = function () {
        this.renderer.clear();
        this.r = this.r || 0;
        this.r += 0.1;
        if (this.image && this.image.complete) {
            this.renderer.drawImage(this.image, Math.sin(this.r) * 5 + 5, Math.cos(this.r) * 5 + 5);
        }
        this.requestRender();
    };

    Canvas.prototype.unload = function () {
        this.domElement.innerHTML = "";
        this.canvasElement = undefined;
        this.context = undefined;
    };

    return Canvas;
});
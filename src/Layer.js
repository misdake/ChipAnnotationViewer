define('Layer', [], function () {
    function Layer(name, renderOrder) {
        this.name = name;
        this.renderOrder = renderOrder;
    }

    Layer.prototype.add = function (canvas) {

    };

    Layer.prototype.render = function (deltatime, canvas, renderer) {

    };

    Layer.prototype.unload = function () {

    };

    return Layer;
});
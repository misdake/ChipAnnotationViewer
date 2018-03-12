define('Layer', [], function () {
    function Layer(name, renderOrder) {
        this.name = name;
        this.renderOrder = renderOrder;
    }

    Layer.prototype.add = function (canvas) {

    };

    Layer.prototype.load = function (content, folder) {

    };

    Layer.prototype.render = function (deltatime, canvas, renderer) {

    };

    return Layer;
});
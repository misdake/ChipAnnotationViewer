define('Renderer', [], function () {
    function Renderer(canvas, context) {
        this.canvas = canvas;
        this.context = context;
    }

    Renderer.prototype.clear = function () {
        this.context.fillStyle = "#FF0000";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    Renderer.prototype.setColor = function (color) {

    };
    Renderer.prototype.drawImage = function (image, x, y) {
        this.context.drawImage(image, x, y);
    };

    return Renderer;
});
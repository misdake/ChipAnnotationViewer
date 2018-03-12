define('Renderer', [], function () {
    function Renderer(canvas, context) {
        this.canvas = canvas;
        this.context = context;
    }

    Renderer.prototype.clear = function () {
        this.context.fillStyle = "#000000";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    Renderer.prototype.drawImage = function (image, x, y, zoom, tileSize) {
        var targetSize = tileSize << zoom;
        this.context.drawImage(image, x * targetSize, y * targetSize, targetSize, targetSize);
    };

    return Renderer;
});
define('Camera', [], function () {

    function Camera(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.zoom = 0;
        this.tileSize = 512;
    }

    Camera.prototype.setPosition = function (x, y, zoom) {
        if (x) this.x = x;
        if (y) this.y = y;
        if (zoom) this.zoom = zoom;
        this.canvas.requestRender();
    };

    Camera.prototype.movePosition = function (dx, dy) {
        this.x += dx;
        this.y += dy;
        this.canvas.requestRender();
    };

    Camera.prototype.changeZoom = function (dzoom) {
        this.zoom += dzoom;
        this.canvas.requestRender();
    };

    Camera.prototype.getXY = function (x, y, z, dx, dy) {

    };
    Camera.prototype.getScale = function () {
        return 1 << this.zoom;
    };

    return Camera;
});
define('LayerImage', ['Layer'], function(Layer) {
    function LayerImage() {
        this.image = new Image();
        this.image.src = "icon.jpg";
    }
    LayerImage.prototype = new Layer('image', 0);

    LayerImage.prototype.render = function(deltatime, canvas, renderer) {
        this.r = this.r || 0;
        this.r += 0.1;
        if (this.image && this.image.complete) {
            renderer.drawImage(this.image, Math.sin(this.r) * 5 + 5, Math.cos(this.r) * 5 + 5);
        }
        return true;
    };

    return LayerImage;
});
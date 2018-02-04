define('LayerImage', ['Layer'], function(Layer) {
    function LayerImage() {
    }
    LayerImage.prototype = new Layer('image', 0);

    LayerImage.prototype.loadImagePack = function (content, path) {
        this.content = content;
        this.maxLevel = content.maxLevel;
        this.imageBasePath = path;
    };

    LayerImage.prototype.loadImageZoom = function (zoom) {
        var oldLevel = this.zoomLevel;

        this.zoomLevel = zoom;
        if (this.zoomLevel < 0) this.zoomLevel = 0;
        if (this.zoomLevel > this.maxLevel) this.zoomLevel = this.maxLevel;

        if (oldLevel === this.zoomLevel) return;

        var levelData = this.content.levels[this.zoomLevel];
        this.xCount = levelData.xMax;
        this.yCount = levelData.yMax;
        this.imageMatrix = [];
        for (var i = 0; i < this.xCount; i++) {
            this.imageMatrix[i] = [];
            for (var j = 0; j < this.yCount; j++) {
                var image = new Image();
                image.src = this.imageBasePath + "/" + this.zoomLevel + "/" + i + "_" + j + ".jpg";
                this.imageMatrix[i][j] = image;
            }
        }
    };

    LayerImage.prototype.render = function(deltatime, canvas, renderer) {
        if (this.imageMatrix) {
            for (var i = 0; i < this.xCount; i++) {
                for (var j = 0; j < this.yCount; j++) {
                    if (this.imageMatrix[i][j] && this.imageMatrix[i][j].complete) {
                        renderer.drawImage(this.imageMatrix[i][j], i * this.content.tileSize, j * this.content.tileSize);
                    }
                }
            }
            return true;
        } else {
            return false;
        }
    };

    return LayerImage;
});
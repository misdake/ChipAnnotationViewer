requirejs.config({
    baseUrl: '.',
    paths: {
        main: 'page_view',

        Canvas: 'src/Canvas',
        Renderer: 'src/Renderer',
        Camera: 'src/Camera',

        Layer: 'src/Layer',
        LayerImage: 'src/layers/LayerImage',

        NetUtil: 'src/NetUtil',
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
require(['Canvas', 'LayerImage', 'NetUtil'], function (Canvas, LayerImage, NetUtil) {
    var canvas = new Canvas(document.getElementById("container"), 'canvas2d');
    canvas.init();
    var layerImage = new LayerImage();
    canvas.addLayer(layerImage);
    canvas.requestRender();

    NetUtil.get("data/fiji/content.json", function (content) {
        canvas.load(JSON.parse(content), "data/fiji");
        layerImage.loadImageZoom(2);
        canvas.requestRender();
    });
});
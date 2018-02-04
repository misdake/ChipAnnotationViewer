requirejs.config({
    baseUrl: '.',
    paths: {
        main: 'page_view',

        Canvas: 'src/Canvas',
        Layer: 'src/Layer',
        Renderer: 'src/Renderer',

        LayerImage: 'src/layers/LayerImage',
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
require(['Canvas', 'LayerImage'], function (Canvas, LayerImage) {
    var canvas = new Canvas(document.getElementById("container"), 'canvas2d');
    canvas.load();
    canvas.addLayer(new LayerImage());
    canvas.requestRender();
});
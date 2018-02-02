requirejs.config({
    baseUrl: '.',
    paths: {
        main: 'page_view',

        Canvas: 'src/Canvas',
        Layer: 'src/Layer',
        Renderer: 'src/Renderer',
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
require(['Canvas', 'Layer'], function (Canvas, Layer) {
    var canvas = new Canvas(document.getElementById("container"), 'canvas2d');
    canvas.load();
    canvas.requestRender();
});
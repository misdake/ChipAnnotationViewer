export class Size {
    onScreen: number;
    onCanvas: number;

    constructor(onScreen: number, onCanvas?: number) {
        this.onScreen = onScreen;
        this.onCanvas = onCanvas ? onCanvas : 0;
    }

    static clone(size: Size): Size {
        return new Size(size.onScreen, size.onCanvas, size.ofScreen);
    }
}
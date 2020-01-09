export class Size {
    onScreen: number;
    onCanvas: number;

    constructor(onScreen: number, onCanvas?: number) {
        this.onScreen = onScreen;
        this.onCanvas = onCanvas ? onCanvas : 0;
    }

    clone(): Size {
        return new Size(this.onScreen, this.onCanvas);
    }
}
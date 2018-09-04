export class Size {
    onScreen: number;
    onCanvas: number;
    ofScreenSize: number;

    constructor(onScreen: number, onCanvas?: number, ofScreenSize?: number) {
        this.onScreen = onScreen;
        this.onCanvas = onCanvas ? onCanvas : 0;
        this.ofScreenSize = ofScreenSize ? ofScreenSize : 0;
    }
}
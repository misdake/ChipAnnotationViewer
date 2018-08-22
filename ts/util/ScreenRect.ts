export class ScreenRect {
    public readonly left: number;
    public readonly top: number;
    public readonly width: number;
    public readonly height: number;

    public constructor(left: number, top: number, width: number, height: number) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}
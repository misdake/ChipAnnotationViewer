export class AABB {
    public x1: number;
    public y1: number;
    public x2: number;
    public y2: number;

    public constructor(x1: number = Math.min(), y1: number = Math.min(), x2: number = Math.max(), y2: number = Math.max()) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
}

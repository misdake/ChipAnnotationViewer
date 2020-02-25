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
    public set(x1: number, y1: number, x2: number, y2: number) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    public get centerX() {
        return (this.x1 + this.x2) / 2;
    }
    public get centerY() {
        return (this.y1 + this.y2) / 2;
    }

    public static combine(a: AABB, b: AABB, dest?: AABB): AABB {
        if (!dest) dest = new AABB();
        dest.x1 = Math.min(a.x1, b.x1);
        dest.y1 = Math.min(a.y1, b.y1);
        dest.x2 = Math.max(a.x2, b.x2);
        dest.y2 = Math.max(a.y2, b.y2);
        return dest;
    }
    public static combineAll(list: AABB[], dest?: AABB): AABB {
        if (!dest) dest = new AABB();
        for (let aabb of list) {
            dest.x1 = Math.min(aabb.x1, dest.x1);
            dest.y1 = Math.min(aabb.y1, dest.y1);
            dest.x2 = Math.max(aabb.x2, dest.x2);
            dest.y2 = Math.max(aabb.y2, dest.y2);
        }
        return dest;
    }
}

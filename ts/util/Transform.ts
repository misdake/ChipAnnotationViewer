export class Transform {
    public readonly position: Position = new Position(0, 0);
}

export class Position {
    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}
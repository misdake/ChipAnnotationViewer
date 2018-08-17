export class Transform {
    public readonly position: Position = new Position(0, 0);
}

export class Position {
    private _x: number = 0;
    private _y: number = 0;

    public constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    get x(): number {
        return this._x;
    }
    get y(): number {
        return this._y;
    }
    set x(x: number) {
        this._x = x;
    }
    set y(y: number) {
        this._y = y;
    }
}
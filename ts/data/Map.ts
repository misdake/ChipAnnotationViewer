export class TileLevel {
    level: number;
    xMax: number;
    yMax: number;
}

export class Map {
    tileSize: number;
    width: number;
    height: number;
    maxLevel: number;
    levels: TileLevel[];
}
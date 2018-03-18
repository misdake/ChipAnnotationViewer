export interface TileLevel {
    level: number;
    xMax: number;
    yMax: number;
}

export interface Content {
    tileSize: number;
    width: number;
    height: number;
    maxLevel: number;
    levels: TileLevel[];
}
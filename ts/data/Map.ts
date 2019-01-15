export class TileLevel {
    level: number;
    xMax: number;
    yMax: number;
}

export class Map {
    githubRepo: string;
    githubIssueId: number;

    name: string;
    tileSize: number;
    width: number;
    height: number;
    maxLevel: number;
    levels: TileLevel[];
    widthMillimeter: number;
    heightMillimeter: number;
}

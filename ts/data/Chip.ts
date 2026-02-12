export class TileLevel {
    level: number;
    xMax: number;
    yMax: number;
}

export class Chip {
    vendor: string;
    type: string;
    family: string;
    name: string;
    listname?: string;

    url: string;
}

export class ChipContent {
    source:string;
    imageRoot?: string;
    githubRepo: string;
    githubIssueId: number;

    vendor: string;
    type: string;
    family: string;
    name: string;

    tileSize: number;
    width: number;
    height: number;
    maxLevel: number;
    levels: TileLevel[];
    widthMillimeter: number;
    heightMillimeter: number;
}

export interface ChipClassification {
    vendor?: string;
    type?: string;
    family?: string;
}

export interface GroupedChip<T> {
    item: T;
    tone: 'base' | 'alternate';
}

function classificationKey(item: ChipClassification): string {
    return [item.vendor || '', item.type || '', item.family || ''].join('\u0000');
}

export function groupAdjacentChips<T extends ChipClassification>(items: T[]): GroupedChip<T>[] {
    let previousKey: string = null;
    let groupIndex = -1;

    return items.map(item => {
        const key = classificationKey(item);
        if (key !== previousKey) {
            groupIndex++;
            previousKey = key;
        }
        return { item, tone: groupIndex % 2 === 0 ? 'base' : 'alternate' };
    });
}

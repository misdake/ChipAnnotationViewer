let nextHistoryId = 1;

export function createHistoryId(): number {
    return nextHistoryId++;
}

export function reserveHistoryId(id: number): void {
    if (id >= nextHistoryId) nextHistoryId = id + 1;
}

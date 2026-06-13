export interface IndexedEntitySnapshot {
    id: number;
    index: number;
}

export function reconcileEntities<T, S extends IndexedEntitySnapshot>(
    target: T[],
    snapshots: S[],
    affectedIds: Set<number>,
    getId: (item: T) => number,
    create: (snapshot: S) => T,
    update: (item: T, snapshot: S) => void,
): void {
    const existing = new Map<number, T>();
    for (let index = target.length - 1; index >= 0; index--) {
        const item = target[index];
        const id = getId(item);
        if (affectedIds.has(id)) {
            existing.set(id, item);
            target.splice(index, 1);
        }
    }

    const ordered = snapshots.slice().sort((a, b) => a.index - b.index);
    for (const snapshot of ordered) {
        const item = existing.get(snapshot.id) || create(snapshot);
        update(item, snapshot);
        const index = Math.max(0, Math.min(snapshot.index, target.length));
        target.splice(index, 0, item);
    }
}

export interface TimelineEntry<T> {
    kind: string;
    before: T;
    after: T;
    mergeKey?: string;
    timestamp: number;
}

export class HistoryTimeline<T> {
    private undoEntries: TimelineEntry<T>[] = [];
    private redoEntries: TimelineEntry<T>[] = [];
    private mergeBarrier = false;

    public constructor(
        private readonly limit: number,
        private readonly mergeWindowMs: number,
    ) {
        if (limit < 1) throw new Error("History limit must be positive");
    }

    public reset(): void {
        this.undoEntries = [];
        this.redoEntries = [];
        this.mergeBarrier = true;
    }

    public canUndo(): boolean {
        return this.undoEntries.length > 0;
    }

    public canRedo(): boolean {
        return this.redoEntries.length > 0;
    }

    public record(entry: TimelineEntry<T>): void {
        const previous = this.undoEntries[this.undoEntries.length - 1];
        if (!this.mergeBarrier && this.canMerge(previous, entry)) {
            previous.after = entry.after;
            previous.kind = entry.kind;
            previous.timestamp = entry.timestamp;
        } else {
            this.undoEntries.push(entry);
            if (this.undoEntries.length > this.limit) this.undoEntries.shift();
        }
        this.mergeBarrier = false;
        this.redoEntries = [];
    }

    public peekUndo(): TimelineEntry<T> {
        return this.undoEntries[this.undoEntries.length - 1];
    }

    public completeUndo(entry: TimelineEntry<T>): void {
        if (this.peekUndo() !== entry) throw new Error("Undo entry is no longer current");
        this.undoEntries.pop();
        this.redoEntries.push(entry);
        this.mergeBarrier = true;
    }

    public peekRedo(): TimelineEntry<T> {
        return this.redoEntries[this.redoEntries.length - 1];
    }

    public completeRedo(entry: TimelineEntry<T>): void {
        if (this.peekRedo() !== entry) throw new Error("Redo entry is no longer current");
        this.redoEntries.pop();
        this.undoEntries.push(entry);
        this.mergeBarrier = true;
    }

    private canMerge(previous: TimelineEntry<T>, next: TimelineEntry<T>): boolean {
        return !!previous
            && !!previous.mergeKey
            && previous.mergeKey === next.mergeKey
            && next.timestamp >= previous.timestamp
            && next.timestamp - previous.timestamp <= this.mergeWindowMs;
    }
}

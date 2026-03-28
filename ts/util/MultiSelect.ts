export type TriState = 'none' | 'some' | 'all';
export type UnifiedValue<T> = T | undefined;

export function getUnifiedValue<T, V>(arr: T[], getter: (item: T) => V): UnifiedValue<V> {
    if (arr.length === 0) return undefined;
    const first = getter(arr[0]);
    for (const item of arr) {
        if (getter(item) !== first) return undefined;
    }
    return getter(arr[0]);
}

export function getTriState<T>(arr: T[], getter: (item: T) => boolean): TriState {
    if (arr.length === 0) return 'none';
    const first = getter(arr[0]);
    for (const item of arr) {
        if (getter(item) !== first) return 'some';
    }
    return first ? 'all' : 'none';
}

export function boolFromTriState(state: TriState): boolean | undefined {
    if (state === 'some') return undefined;
    return state === 'all';
}

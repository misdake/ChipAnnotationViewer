export class LRU<K, V> {
    private readonly max: number;
    private readonly cache: Map<K, V>;

    constructor(max = 10) {
        this.max = max;
        this.cache = new Map();
    }

    getOrInsert(key: K, create: (key: K) => V): V {
        if (this.cache.has(key)) return this.get(key) as V;
        const value = create(key);
        this.set(key, value);
        return value;
    }

    get(key: K): V | undefined {
        if (!this.cache.has(key)) return undefined;
        const item = this.cache.get(key) as V;
        // refresh key
        this.cache.delete(key);
        this.cache.set(key, item);
        return item;
    }

    set(key: K, val: V): void {
        // refresh key
        if (this.cache.has(key)) this.cache.delete(key);
        // evict oldest
        else if (this.cache.size >= this.max) {
            const first = this.cache.keys().next();
            if (!first.done) this.cache.delete(first.value);
        }
        this.cache.set(key, val);
    }

    remove(key: K): void {
        this.cache.delete(key);
    }
}

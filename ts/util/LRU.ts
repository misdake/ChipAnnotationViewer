export class LRU<K, V> {
    private readonly max: number;
    private readonly cache: Map<K, V>;

    constructor(max = 10) {
        this.max = max;
        this.cache = new Map();
    }

    getOrInsert(key: K, create: (key: K) => V): V {
        let v = this.get(key);
        if (!v) {
            this.set(key, v = create(key));
        }
        return v;
    }

    get(key: K) {
        let item = this.cache.get(key);
        if (item) {
            // refresh key
            this.cache.delete(key);
            this.cache.set(key, item);
        }
        return item;
    }

    set(key: K, val: V) {
        if (!key || !val) return;
        // refresh key
        if (this.cache.has(key)) this.cache.delete(key);
        // evict oldest
        else if (this.cache.size == this.max) {
            this.cache.delete(this.first());
        }
        this.cache.set(key, val);
    }

    remove(key: K) {
        this.cache.delete(key);
    }

    first() {
        return this.cache.keys().next()?.value;
    }
}

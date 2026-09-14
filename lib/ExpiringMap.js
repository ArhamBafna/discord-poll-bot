// --- Expiring Map ---
class ExpiringMap {
    /**
     * @param {number} defaultTtlMs Time to live in milliseconds
     * @param {number} sweepIntervalMs How often to run the garbage collector
     */
    constructor(defaultTtlMs, sweepIntervalMs = 60000) {
        this.store = new Map();
        this.defaultTtlMs = defaultTtlMs;
        this.interval = setInterval(() => this.sweep(), sweepIntervalMs);
        if (this.interval.unref) this.interval.unref(); // don't block process exit
    }

    set(key, value = Date.now()) {
        this.store.set(key, { value, expiresAt: Date.now() + this.defaultTtlMs });
    }

    get(key) {
        const item = this.store.get(key);
        if (!item) return undefined;
        if (Date.now() > item.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return item.value;
    }

    has(key) {
        return this.get(key) !== undefined;
    }

    delete(key) {
        return this.store.delete(key);
    }

    sweep() {
        const now = Date.now();
        for (const [key, item] of this.store.entries()) {
            if (now > item.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}

module.exports = ExpiringMap;

class Cache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
    this.defaultTTL = 5 * 60 * 1000;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cleanup();

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const expiry = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiry,
      createdAt: Date.now()
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expiredEntries++;
        this.cache.delete(key);
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.maxSize
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  static generateKey(req) {
    const url = req.originalUrl || req.url;
    const query = JSON.stringify(req.query);
    const userAgent = req.headers['user-agent'] || '';
    const accept = req.headers['accept'] || '';
    
    return `cache:${url}:${query}:${userAgent}:${accept}`;
  }
}

const cache = new Cache();

export { Cache };
export default cache; 
const { Redis: UpstashRedis } = require('@upstash/redis');
const IORedis = require('ioredis');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Enterprise Multi-Tier Caching Service
 *
 * Tier 1: Upstash Serverless REST Redis (Production & Render Cloud)
 * Tier 2: Standard TCP Redis / IORedis (Self-hosted or Redis Cloud)
 * Tier 3: High-speed In-Memory LRU/TTL Store (Zero-config local fallback)
 *
 * Zero downtime guarantee: If cloud Redis ever experiences network hiccups,
 * the service falls back instantly to in-memory caching without dropping requests.
 */
class CacheService {
  constructor() {
    this.upstashClient = null;
    this.redisClient = null;
    this.driver = 'memory'; // 'upstash' | 'redis' | 'memory'
    this.isReady = false;

    this.memoryStore = new Map(); // key -> { value, expiresAt }
    this.maxMemoryEntries = 2000;

    this.init();
    this.startCleanupInterval();
  }

  async init() {
    // 1. Check for Upstash Redis REST credentials (Recommended for Render / Cloud)
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken && !upstashUrl.includes('placeholder')) {
      try {
        this.upstashClient = new UpstashRedis({
          url: upstashUrl,
          token: upstashToken,
        });

        // Test connectivity
        const pong = await this.upstashClient.ping();
        if (pong === 'PONG') {
          this.driver = 'upstash';
          this.isReady = true;
          logger.info(`[Cache] Connected to Upstash Redis (${upstashUrl}). Ultra-low latency caching active.`);
          return;
        }
      } catch (err) {
        logger.warn(`[Cache] Upstash Redis ping failed: ${err.message}. Checking TCP Redis fallback.`);
      }
    }

    // 2. Check for TCP Redis (IORedis)
    const redisUrl = process.env.REDIS_URL || env.REDIS_URL;
    const shouldAttemptTcpRedis =
      redisUrl &&
      (env.NODE_ENV === 'production' ||
        process.env.ENABLE_REDIS === 'true' ||
        (!redisUrl.includes('localhost') && !redisUrl.includes('127.0.0.1')));

    if (shouldAttemptTcpRedis) {
      try {
        this.redisClient = new IORedis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
          retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 500, 2000);
          },
          lazyConnect: true,
        });

        this.redisClient.on('connect', () => {
          this.driver = 'redis';
          this.isReady = true;
          logger.info('[Cache] Connected to TCP Redis. Fast caching active.');
        });

        this.redisClient.on('error', (err) => {
          logger.warn(`[Cache] TCP Redis error: ${err.message}. Operating in high-speed in-memory mode.`);
        });

        await this.redisClient.connect().catch(() => {});
        if (this.redisClient.status === 'ready') {
          this.driver = 'redis';
          this.isReady = true;
          return;
        }
      } catch (err) {
        logger.warn(`[Cache] TCP Redis init error: ${err.message}`);
      }
    }

    // 3. Fallback: High-Performance In-Memory Cache
    this.driver = 'memory';
    this.isReady = true;
    logger.info('[Cache] Operating in in-memory mode (Zero external dependency).');
  }

  /**
   * Returns current active cache driver name
   */
  getDriverName() {
    if (this.driver === 'upstash') return 'upstash-redis';
    if (this.driver === 'redis') return 'tcp-redis';
    return 'in-memory';
  }

  /**
   * Periodic TTL cleanup for in-memory store to prevent memory leaks
   */
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryStore.entries()) {
        if (entry.expiresAt && entry.expiresAt <= now) {
          this.memoryStore.delete(key);
        }
      }
    }, 60 * 1000).unref();
  }

  /**
   * Get value from cache
   * @param {string} key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    if (this.driver === 'upstash' && this.upstashClient) {
      try {
        const val = await this.upstashClient.get(key);
        return val ?? null;
      } catch (err) {
        logger.warn(`[Cache] Upstash GET failed for "${key}": ${err.message}. Falling back to memory.`);
      }
    }

    if (this.driver === 'redis' && this.redisClient && this.redisClient.status === 'ready') {
      try {
        const raw = await this.redisClient.get(key);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        logger.warn(`[Cache] Redis GET failed for "${key}": ${err.message}.`);
      }
    }

    // In-memory lookup
    const entry = this.memoryStore.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.memoryStore.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache with TTL
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds - Default 300s (5 minutes)
   */
  async set(key, value, ttlSeconds = 300) {
    if (this.driver === 'upstash' && this.upstashClient) {
      try {
        if (ttlSeconds > 0) {
          await this.upstashClient.set(key, value, { ex: ttlSeconds });
        } else {
          await this.upstashClient.set(key, value);
        }
        return true;
      } catch (err) {
        logger.warn(`[Cache] Upstash SET failed for "${key}": ${err.message}. Writing to memory.`);
      }
    }

    if (this.driver === 'redis' && this.redisClient && this.redisClient.status === 'ready') {
      try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds > 0) {
          await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await this.redisClient.set(key, serialized);
        }
        return true;
      } catch (err) {
        logger.warn(`[Cache] Redis SET failed for "${key}": ${err.message}.`);
      }
    }

    // In-memory with LRU-style size eviction
    if (this.memoryStore.size >= this.maxMemoryEntries) {
      const oldestKey = this.memoryStore.keys().next().value;
      if (oldestKey) this.memoryStore.delete(oldestKey);
    }

    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryStore.set(key, { value, expiresAt });
    return true;
  }

  /**
   * Delete specific cache key
   * @param {string} key
   */
  async del(key) {
    if (this.driver === 'upstash' && this.upstashClient) {
      try {
        await this.upstashClient.del(key);
      } catch (err) {
        logger.warn(`[Cache] Upstash DEL failed: ${err.message}`);
      }
    }

    if (this.driver === 'redis' && this.redisClient && this.redisClient.status === 'ready') {
      try {
        await this.redisClient.del(key);
      } catch (err) {
        logger.warn(`[Cache] Redis DEL failed: ${err.message}`);
      }
    }

    this.memoryStore.delete(key);
    return true;
  }

  /**
   * Invalidate all keys matching a prefix/pattern (e.g., 'jobs:*', 'http:/api/v1/jobs*')
   * @param {string} pattern
   */
  async delPattern(pattern) {
    // 1. Delete matching from memory
    const regexPattern = new RegExp(`^${pattern.replace('*', '.*')}$`);
    for (const key of this.memoryStore.keys()) {
      if (regexPattern.test(key)) {
        this.memoryStore.delete(key);
      }
    }

    // 2. Delete matching from Upstash Redis
    if (this.driver === 'upstash' && this.upstashClient) {
      try {
        const keys = await this.upstashClient.keys(pattern);
        if (Array.isArray(keys) && keys.length > 0) {
          await this.upstashClient.del(...keys);
        }
      } catch (err) {
        logger.warn(`[Cache] Upstash delPattern failed for "${pattern}": ${err.message}`);
      }
    }

    // 3. Delete matching from TCP Redis
    if (this.driver === 'redis' && this.redisClient && this.redisClient.status === 'ready') {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (Array.isArray(keys) && keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (err) {
        logger.warn(`[Cache] Redis delPattern failed for "${pattern}": ${err.message}`);
      }
    }

    return true;
  }

  /**
   * Cache-Aside Helper: fetch from cache or execute fallback & populate
   * @param {string} key
   * @param {number} ttlSeconds
   * @param {Function} fetcherFn
   */
  async remember(key, ttlSeconds, fetcherFn) {
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      return { data: cached, isHit: true };
    }

    const freshData = await fetcherFn();
    if (freshData !== undefined && freshData !== null) {
      await this.set(key, freshData, ttlSeconds);
    }
    return { data: freshData, isHit: false };
  }

  /**
   * AI Extraction / Document Cache Key Generator
   * Computes SHA-256 hash of document content to instantly return cached AI extractions (0ms latency, $0 token cost)
   * @param {string|Buffer} content
   * @returns {string} Hash key
   */
  computeContentHash(content) {
    const hash = crypto.createHash('sha256');
    hash.update(typeof content === 'string' ? content : content.toString('utf-8'));
    return `ai:doc:${hash.digest('hex')}`;
  }

  /**
   * Express Route Cache Middleware
   * Caches successful GET responses (status 200) with custom TTL and headers
   * @param {number} ttlSeconds
   * @param {Function} [keyGenerator] Optional custom key generator (req) => string
   */
  middleware(ttlSeconds = 60, keyGenerator = null) {
    return async (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }

      const cacheKey = keyGenerator
        ? keyGenerator(req)
        : `http:${req.baseUrl}${req.path}:${JSON.stringify(req.query)}:${req.user?.id || 'anon'}`;

      try {
        const cachedResponse = await this.get(cacheKey);
        if (cachedResponse) {
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Driver', this.getDriverName());
          res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
          return res.status(200).json(cachedResponse);
        }

        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Driver', this.getDriverName());

        const originalJson = res.json.bind(res);
        res.json = (body) => {
          if (res.statusCode === 200) {
            this.set(cacheKey, body, ttlSeconds).catch((err) => {
              logger.warn(`[Cache] Middleware failed to cache "${cacheKey}": ${err.message}`);
            });
          }
          return originalJson(body);
        };

        next();
      } catch (err) {
        logger.warn(`[Cache] Middleware error: ${err.message}`);
        next();
      }
    };
  }
}

const cacheService = new CacheService();
module.exports = cacheService;

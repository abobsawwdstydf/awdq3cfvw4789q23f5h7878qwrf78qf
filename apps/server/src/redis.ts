import Redis from 'ioredis';
import { config } from './config';

let redisClient: Redis | null = null;

/**
 * Get Redis client instance (singleton)
 */
export function getRedisClient(): Redis | null {
  if (!config.redisUrl) {
    console.warn('  ⚠ REDIS_URL не задан — кэширование отключено');
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('  ✓ Redis подключён');
    });
  }

  return redisClient;
}

/**
 * Cache user online status
 */
export async function cacheUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    if (isOnline) {
      await redis.setex(`user:${userId}:online`, 300, '1'); // 5 minutes
    } else {
      await redis.del(`user:${userId}:online`);
      await redis.setex(`user:${userId}:lastseen`, 86400 * 7, new Date().toISOString()); // 7 days
    }
  } catch (error) {
    console.error('Failed to cache user status:', error);
  }
}

/**
 * Get cached user online status
 */
export async function getCachedUserOnlineStatus(userId: string): Promise<boolean | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const status = await redis.get(`user:${userId}:online`);
    return status === '1';
  } catch (error) {
    console.error('Failed to get cached user status:', error);
    return null;
  }
}

/**
 * Cache user's last seen timestamp
 */
export async function cacheUserLastSeen(userId: string, timestamp: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.setex(`user:${userId}:lastseen`, 86400 * 7, timestamp); // 7 days
  } catch (error) {
    console.error('Failed to cache last seen:', error);
  }
}

/**
 * Get cached last seen timestamp
 */
export async function getCachedUserLastSeen(userId: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    return await redis.get(`user:${userId}:lastseen`);
  } catch (error) {
    console.error('Failed to get cached last seen:', error);
    return null;
  }
}

/**
 * Cache active call sessions to prevent multiple device issues
 */
export async function setActiveCall(sessionKey: string, callData: any): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.setex(`call:${sessionKey}`, 300, JSON.stringify(callData)); // 5 minutes
  } catch (error) {
    console.error('Failed to cache call session:', error);
  }
}

/**
 * Get active call session
 */
export async function getActiveCall(sessionKey: string): Promise<any | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const data = await redis.get(`call:${sessionKey}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get call session:', error);
    return null;
  }
}

/**
 * Remove active call session
 */
export async function removeActiveCall(sessionKey: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(`call:${sessionKey}`);
  } catch (error) {
    console.error('Failed to remove call session:', error);
  }
}

/**
 * Check if user is already in a call (for multi-device sync)
 */
export async function isUserInCall(userId: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const keys = await redis.keys(`call:*:${userId}:*`);
    return keys.length > 0;
  } catch (error) {
    console.error('Failed to check user call status:', error);
    return false;
  }
}

/**
 * Cache typing status
 */
export async function setTypingStatus(chatId: string, userId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.setex(`typing:${chatId}:${userId}`, 5, '1'); // 5 seconds
  } catch (error) {
    console.error('Failed to cache typing status:', error);
  }
}

/**
 * Get typing status
 */
export async function getTypingStatus(chatId: string): Promise<string[]> {
  const redis = getRedisClient();
  if (!redis) return [];

  try {
    const keys = await redis.keys(`typing:${chatId}:*`);
    return keys.map(k => k.split(':')[2]);
  } catch (error) {
    console.error('Failed to get typing status:', error);
    return [];
  }
}

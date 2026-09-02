import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function saveSession(sessionId, sessionData, ttlSeconds) {
  await redis.set(
    `session:${sessionId}`,
    sessionData,
    {
      ex: ttlSeconds
    }
  );
}

export async function getSession(sessionId) {
  return redis.get(`session:${sessionId}`);
}

export async function deleteSession(sessionId) {
  await redis.del(`session:${sessionId}`);
}
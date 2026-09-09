import { destroySession } from '../../lib/session/session.js';

export default async function handler(req, res) {
  // CORS & Header Setup
  res.setHeader('Access-Control-Allow-Origin', 'https://github.yourcookie.site');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Destroy session in Upstash Redis and expire __Host-session cookie
    await destroySession(req, res);

    return res.status(200).json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    console.error('[Logout Error]:', error);
    return res.status(500).json({ error: 'Failed to revoke session' });
  }
}
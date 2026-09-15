import { normalizeOktaIdentity } from '../../lib/identity/okta.js';
import { createSession } from '../../lib/session/session.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://github.yourcookie.site');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, code_verifier, redirect_uri } = req.body;
  const AUTH0_DOMAIN = process.env.OKTA_DOMAIN;
  const AUTH0_CLIENT_ID = process.env.OKTA_CLIENT_ID;

  try {
    // 1. Exchange Auth Code for Tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: AUTH0_CLIENT_ID,
      code,
      redirect_uri,
      code_verifier
    });

    const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    if (!tokenRes.ok) throw new Error('Failed to exchange code with Auth0');
    const tokens = await tokenRes.json();

    // 2. Fetch UserInfo
    const userRes = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userRes.ok) throw new Error('Failed to fetch Auth0 userinfo');
    const auth0User = await userRes.json();

    // 3. Normalize & Create Redis Session
    const identity = normalizeOktaIdentity(auth0User);
    await createSession(res, identity);

    return res.status(200).json({ success: true, identity });
  } catch (error) {
    console.error('[Auth0 Callback Error]:', error);
    return res.status(500).json({ error: 'Auth0 authentication failed' });
  }
}
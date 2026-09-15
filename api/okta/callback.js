import { normalizeOktaIdentity } from '../../lib/identity/okta.js';
import { createSession } from '../../lib/session/session.js';

export default async function handler(req, res) {
  // Always set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', 'https://github.yourcookie.site');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, code_verifier, redirect_uri } = req.body;

    // Sanitize domain to strip protocol or trailing slashes
    const rawDomain = process.env.OKTA_DOMAIN || '';
    const AUTH0_DOMAIN = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const AUTH0_CLIENT_ID = process.env.OKTA_CLIENT_ID;

    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
      console.error('[Auth0 Error]: OKTA_DOMAIN or OKTA_CLIENT_ID environment variables are missing on Vercel.');
      return res.status(500).json({ error: 'Server configuration error: missing credentials' });
    }

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

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('[Auth0 Token Exchange Failed]:', errorText);
      return res.status(400).json({ error: `Auth0 token exchange failed: ${errorText}` });
    }

    const tokens = await tokenRes.json();

    // 2. Fetch UserInfo
    const userRes = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userRes.ok) {
      const userErrorText = await userRes.text();
      console.error('[Auth0 UserInfo Failed]:', userErrorText);
      return res.status(400).json({ error: 'Failed to fetch user profile from Auth0' });
    }

    const auth0User = await userRes.json();

    // 3. Normalize & Create Redis Session
    const identity = normalizeOktaIdentity(auth0User);
    await createSession(res, identity);

    return res.status(200).json({ success: true, identity });
  } catch (error) {
    console.error('[Auth0 Callback Runtime Error]:', error);
    return res.status(500).json({ error: error.message || 'Auth0 authentication failed' });
  }
}
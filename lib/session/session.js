import { deleteSessionFromStore } from './store.js';

export function createSessionData(identity) {
  return {
    provider: identity.provider,
    externalId: identity.externalId,
    email: identity.email,
    name: identity.name,
    emailVerified: identity.emailVerified
  };
}

export async function destroySession(req, res) {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/__Host-session=([^;]+)/);
  const sessionId = match ? match[1] : null;

  if (sessionId) {
    // Remove from Upstash Redis
    await deleteSessionFromStore(sessionId);
  }

  // Expire the cookie immediately
  res.setHeader(
    'Set-Cookie',
    '__Host-session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0'
  );
}
import { normalizeIdentity } from './normalize.js';

export function normalizeOktaIdentity(auth0Profile) {
  const name = auth0Profile.name || 
    auth0Profile.nickname || 
    auth0Profile.email;

  return normalizeIdentity({
    externalId: `okta_${auth0Profile.sub}`, // Produces okta_auth0|12345...
    email: auth0Profile.email,
    name: name,
    emailVerified: auth0Profile.email_verified ?? true,
    provider: 'okta'
  });
}
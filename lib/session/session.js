export function createSessionData(identity) {
  return {
    provider: identity.provider,
    externalId: identity.externalId,
    email: identity.email,
    name: identity.name,
    emailVerified: identity.emailVerified
  };
}
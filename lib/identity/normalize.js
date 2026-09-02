export function normalizeIdentity({
  externalId,
  email,
  name,
  emailVerified = false,
  provider
}) {
  if (!externalId) {
    throw new Error("Identity is missing externalId");
  }

  if (!email) {
    throw new Error("Identity is missing email");
  }

  return {
    externalId,
    email,
    name: name || email,
    emailVerified,
    provider
  };
}
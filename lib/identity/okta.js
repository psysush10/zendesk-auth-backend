import { normalizeIdentity } from "./normalize.js";

export function normalizeOktaIdentity({
  externalId,
  email,
  name,
  emailVerified = false
}) {
  return normalizeIdentity({
    externalId: `okta_${externalId}`,
    email,
    name,
    emailVerified,
    provider: "okta"
  });
}
import jwt from "jsonwebtoken";

export function createZendeskJWT(identity) {
  const KEY_ID = process.env.ZENDESK_KEY_ID;
  const SHARED_SECRET = process.env.ZENDESK_SHARED_SECRET;

  if (!KEY_ID || !SHARED_SECRET) {
    throw new Error("Missing Zendesk environment variables");
  }

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    scope: "user",
    external_id: identity.externalId,
    email: identity.email,
    email_verified: identity.emailVerified,
    name: identity.name,
    iat: now,
    exp: now + (5 * 60)
  };

  return jwt.sign(payload, SHARED_SECRET, {
    header: {
      alg: "HS256",
      typ: "JWT",
      kid: KEY_ID
    }
  });
}
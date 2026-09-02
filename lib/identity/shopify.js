import { normalizeIdentity } from "./normalize.js";

export function normalizeShopifyCustomer(customer) {
  const email = customer.emailAddress?.emailAddress || null;

  const name = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ") || email;

  return normalizeIdentity({
    externalId: `shopify_${customer.id}`,
    email,
    name,
    emailVerified: true,
    provider: "shopify"
  });
}
import { normalizeIdentity } from "./normalize.js";

export function normalizeShopifyCustomer(customer) {
  if (!customer) {
    throw new Error("Shopify customer is missing");
  }

  if (!customer.id) {
    throw new Error("Shopify customer is missing id");
  }

  const email = customer.emailAddress?.emailAddress || null;

  if (!email) {
    throw new Error("Shopify customer is missing email");
  }

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
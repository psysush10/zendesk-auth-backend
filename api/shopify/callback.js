export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://github.yourcookie.site"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      code,
      state,
      code_verifier,
      redirect_uri
    } = req.body || {};

    if (!code || !code_verifier || !redirect_uri) {
      return res.status(400).json({
        error: "Missing code, code_verifier, or redirect_uri"
      });
    }

    // 1. Exchange Shopify authorization code for access token
    const tokenResponse = await fetch(
      "https://shopify.com/authentication/75827249230/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: process.env.SHOPIFY_CLIENT_ID,
          client_secret: process.env.SHOPIFY_CLIENT_SECRET,
          redirect_uri,
          code,
          code_verifier
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Shopify token exchange failed:", tokenData);

      return res.status(400).json({
        error: "Shopify token exchange failed",
        details: tokenData
      });
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(400).json({
        error: "Shopify did not return an access token"
      });
    }

    // 2. Discover the Customer Account API endpoint
    const discoveryResponse = await fetch(
      "https://cookie-co.barxyhmr.myshopify.com/.well-known/customer-account-api"
    );

    const discoveryData = await discoveryResponse.json();

    if (!discoveryResponse.ok || !discoveryData.graphql_api) {
      console.error(
        "Customer Account API discovery failed:",
        discoveryData
      );

      return res.status(500).json({
        error: "Customer Account API discovery failed",
        details: discoveryData
      });
    }

    const graphqlEndpoint = discoveryData.graphql_api;

    // 3. Retrieve the authenticated customer
    const customerResponse = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken
      },
      body: JSON.stringify({
        query: `
          query {
            customer {
              id
              firstName
              lastName
              emailAddress {
                emailAddress
              }
            }
          }
        `
      })
    });

    const customerData = await customerResponse.json();

    if (!customerResponse.ok || customerData.errors) {
      console.error(
        "Customer Account API request failed:",
        customerData
      );

      return res.status(400).json({
        error: "Customer Account API request failed",
        details: customerData
      });
    }

    const customer = customerData?.data?.customer;

    if (!customer) {
      return res.status(400).json({
        error: "Customer was not returned by Shopify"
      });
    }

    // 4. Temporary verification response
    return res.status(200).json({
      success: true,
      state,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.emailAddress?.emailAddress || null
      }
    });

  } catch (error) {
    console.error("Shopify callback error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
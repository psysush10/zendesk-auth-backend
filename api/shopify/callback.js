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

    // --------------------------------------------------
    // STEP 1: Exchange authorization code for access token
    // --------------------------------------------------

    let tokenResponse;

    try {
      tokenResponse = await fetch(
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
    } catch (error) {
      return res.status(500).json({
        error: "Shopify token endpoint fetch failed",
        message: error.message,
        cause: error.cause?.message || null,
        code: error.cause?.code || null
      });
    }

    const tokenResponseText = await tokenResponse.text();

let tokenData;

try {
  tokenData = JSON.parse(tokenResponseText);
} catch (error) {
  return res.status(500).json({
    error: "Shopify token endpoint returned non-JSON",
    status: tokenResponse.status,
    statusText: tokenResponse.statusText,
    contentType: tokenResponse.headers.get("content-type"),
    responsePreview: tokenResponseText.slice(0, 1000)
  });
}

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(400).json({
        error: "Shopify did not return an access token"
      });
    }

    // --------------------------------------------------
    // STEP 2: Call Customer Account API
    // --------------------------------------------------

    const graphqlEndpoint =
      "https://cookie-co-barxyhmr.myshopify.com/customer/api/2026-07/graphql";

    let customerResponse;

    try {
      customerResponse = await fetch(graphqlEndpoint, {
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
    } catch (error) {
      return res.status(500).json({
        error: "Customer Account API fetch failed",
        message: error.message,
        cause: error.cause?.message || null,
        code: error.cause?.code || null,
        endpoint: graphqlEndpoint
      });
    }

    const customerResponseText = await customerResponse.text();

let customerData;

try {
  customerData = JSON.parse(customerResponseText);
} catch (error) {
  return res.status(500).json({
    error: "Customer Account API returned non-JSON",
    status: customerResponse.status,
    statusText: customerResponse.statusText,
    contentType: customerResponse.headers.get("content-type"),
    responsePreview: customerResponseText.slice(0, 1000)
  });
}

    if (!customerResponse.ok || customerData.errors) {
      return res.status(400).json({
        error: "Customer Account API request failed",
        details: customerData
      });
    }

    const customer = customerData?.data?.customer;

    if (!customer) {
      return res.status(400).json({
        error: "Customer was not returned by Shopify",
        details: customerData
      });
    }

    // --------------------------------------------------
    // STEP 3: Temporary verification response
    // --------------------------------------------------

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
    return res.status(500).json({
      error: "Unexpected callback error",
      message: error.message,
      cause: error.cause?.message || null,
      code: error.cause?.code || null
    });
  }
}
export default async function handler(req, res) {
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

    return res.status(200).json({
      success: true,
      state,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      access_token_received: Boolean(tokenData.access_token)
    });

  } catch (error) {
    console.error("Shopify callback error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
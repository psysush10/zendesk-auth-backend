import crypto from "crypto";
import { normalizeOktaIdentity } from "../../lib/identity/okta.js";
import { createSessionData } from "../../lib/session/session.js";
import { saveSession } from "../../lib/session/store.js";

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

    const rawDomain = process.env.OKTA_DOMAIN || '';
    const AUTH0_DOMAIN = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const AUTH0_CLIENT_ID = process.env.OKTA_CLIENT_ID;

    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
      return res.status(500).json({
        error: "Server configuration error: missing OKTA_DOMAIN or OKTA_CLIENT_ID"
      });
    }

    // --------------------------------------------------
    // STEP 1: Exchange authorization code for Auth0 tokens
    // --------------------------------------------------
    let tokenResponse;

    try {
      tokenResponse = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: AUTH0_CLIENT_ID,
          redirect_uri,
          code,
          code_verifier
        })
      });
    } catch (error) {
      return res.status(500).json({
        error: "Auth0 token endpoint fetch failed",
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
        error: "Auth0 token endpoint returned non-JSON",
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        contentType: tokenResponse.headers.get("content-type"),
        responsePreview: tokenResponseText.slice(0, 1000)
      });
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(400).json({
        error: "Auth0 did not return an access token",
        details: tokenData
      });
    }

    // --------------------------------------------------
    // STEP 2: Call Auth0 UserInfo Endpoint
    // --------------------------------------------------
    let userResponse;

    try {
      userResponse = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: "Auth0 UserInfo fetch failed",
        message: error.message,
        cause: error.cause?.message || null,
        code: error.cause?.code || null
      });
    }

    const userResponseText = await userResponse.text();
    let userData;

    try {
      userData = JSON.parse(userResponseText);
    } catch (error) {
      return res.status(500).json({
        error: "Auth0 UserInfo returned non-JSON",
        status: userResponse.status,
        statusText: userResponse.statusText,
        contentType: userResponse.headers.get("content-type"),
        responsePreview: userResponseText.slice(0, 1000)
      });
    }

    if (!userResponse.ok) {
      return res.status(400).json({
        error: "Auth0 UserInfo request failed",
        details: userData
      });
    }

    // --------------------------------------------------
    // STEP 3: Normalize Okta/Auth0 Identity & Save Session
    // --------------------------------------------------
    const identity = normalizeOktaIdentity(userData);
    const sessionData = createSessionData(identity);
    const sessionId = crypto.randomBytes(32).toString("hex");

    await saveSession(
      sessionId,
      sessionData,
      60 * 60 * 24
    );

    res.setHeader(
      "Set-Cookie",
      `__Host-session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24}`
    );

    return res.status(200).json({
      success: true
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
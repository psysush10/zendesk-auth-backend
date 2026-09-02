import { getSession } from "../../lib/session/store.js";
import { createZendeskJWT } from "../../lib/zendesk/jwt.js";

export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://github.yourcookie.site"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const cookieHeader = req.headers.cookie || "";

    const sessionCookie = cookieHeader
      .split(";")
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith("__Host-session="));

    if (!sessionCookie) {
      return res.status(401).json({
        error: "Not authenticated"
      });
    }

    const sessionId =
      sessionCookie.substring("__Host-session=".length);

    const session = await getSession(sessionId);

    if (!session) {
      return res.status(401).json({
        error: "Invalid or expired session"
      });
    }

    const token = createZendeskJWT(session);

    return res.status(200).json({
      token
    });
  } catch (error) {
    console.error("Zendesk token error:", error);

    return res.status(500).json({
      error: "Unable to generate Zendesk token"
    });
  }
}
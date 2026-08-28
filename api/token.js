import jwt from 'jsonwebtoken';

export default async function handler(req) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  const KEY_ID = process.env.ZENDESK_KEY_ID;
  const SHARED_SECRET = process.env.ZENDESK_SHARED_SECRET;

  if (!KEY_ID || !SHARED_SECRET) {
    return new Response(
      JSON.stringify({ 
        error: 'Missing Environment Variables',
        details: 'Check ZENDESK_KEY_ID and ZENDESK_SHARED_SECRET in Vercel settings.' 
      }),
      { status: 500, headers }
    );
  }

  try {
    const payload = {
      scope: 'user',
      external_id: 'chennai_customer_prod_99',
      email: 'sushanth.production@example.com',
      email_verified: true,
      name: 'Sushanth (Production Auth Flow)',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (5 * 60)
    };

    const token = jwt.sign(payload, SHARED_SECRET, {
      header: { alg: 'HS256', typ: 'JWT', kid: KEY_ID }
    });

    return new Response(
      JSON.stringify({ token: token }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers }
    );
  }
}

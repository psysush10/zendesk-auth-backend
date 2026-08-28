const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
  // 1. Set explicit CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // 2. Handle preflight request immediately
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const KEY_ID = process.env.ZENDESK_KEY_ID;
    const SHARED_SECRET = process.env.ZENDESK_SHARED_SECRET;

    if (!KEY_ID || !SHARED_SECRET) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ 
        error: 'Missing Environment Variables',
        details: 'Ensure ZENDESK_KEY_ID and ZENDESK_SHARED_SECRET are set in Vercel settings.' 
      }));
    }

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

    // 3. Explicitly terminate the connection with status code and body
    res.statusCode = 200;
    return res.end(JSON.stringify({ token: token }));

  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: err.message }));
  }
};

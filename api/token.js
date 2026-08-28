const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // Enable CORS so your GitHub Pages site can fetch this endpoint
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Retrieve environment variables safely on the server side
  const KEY_ID = process.env.ZENDESK_KEY_ID;
  const SHARED_SECRET = process.env.ZENDESK_SHARED_SECRET;

  if (!KEY_ID || !SHARED_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration: missing keys' });
  }

  // Simulate authenticated user profile from your database/session
  const payload = {
    scope: 'user',
    external_id: 'chennai_customer_prod_99',
    email: 'sushanth.production@example.com',
    email_verified: true,
    name: 'Sushanth (Production Auth Flow)',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (5 * 60) // Short-lived token (5 mins)
  };

  const token = jwt.sign(payload, SHARED_SECRET, {
    header: { alg: 'HS256', typ: 'JWT', kid: KEY_ID }
  });

  // Return non-cached JSON response containing the signed token
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ token });
};
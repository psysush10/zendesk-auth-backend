const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const KEY_ID = process.env.ZENDESK_KEY_ID;
    const SHARED_SECRET = process.env.ZENDESK_SHARED_SECRET;

    if (!KEY_ID || !SHARED_SECRET) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: 'Missing environment variables on Vercel' }));
    }

    // Parse incoming request body for custom credentials
    let body = {};
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch (e) {
      body = {};
    }

    const username = body.username || 'Anonymous User';
    const email = body.email || `${username.toLowerCase().replace(/\s+/g, '')}@example.com`;
    const externalId = `user_${username.toLowerCase().replace(/\s+/g, '_')}`;

    // Construct JWT payload dynamically using submitted user data
    const payload = {
      scope: 'user',
      external_id: externalId,
      email: email,
      email_verified: true,
      name: username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (5 * 60)
    };

    const token = jwt.sign(payload, SHARED_SECRET, {
      header: { alg: 'HS256', typ: 'JWT', kid: KEY_ID }
    });

    res.statusCode = 200;
    return res.end(JSON.stringify({ token: token, user: { name: username, email: email } }));

  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: err.message }));
  }
};

const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
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

    // --- RELIABLE BODY PARSING ---
    let body = req.body;

    // Handle stringified bodies
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    // Handle unparsed stream buffers if body is missing
    if (!body && req.readable) {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const data = Buffer.concat(buffers).toString();
      try {
        body = JSON.parse(data);
      } catch (e) {
        body = {};
      }
    }

    body = body || {};

    // Extract submitted values with clean fallbacks
    const rawName = body.username ? body.username.trim() : 'Test User';
    const cleanId = rawName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const username = rawName;
    const email = body.email || `${cleanId}@example.com`;
    const externalId = `usr_${cleanId}_${Date.now()}`;

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
    return res.end(JSON.stringify({ 
      token: token, 
      user: { name: username, email: email } 
    }));

  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: err.message }));
  }
};

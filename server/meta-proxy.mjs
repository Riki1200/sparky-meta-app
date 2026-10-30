// Minimal Meta Model API proxy for Sparky Reader.
// Keeps META_API_KEY on the server so it is never embedded in the app bundle.
//
//   META_API_KEY=sk-... node server/meta-proxy.mjs
//   EXPO_PUBLIC_META_API_BASE_URL=http://localhost:8787   (in the app's .env)
//
// Env: META_API_KEY (required), META_API_BASE_URL (default https://api.meta.ai/v1),
//      PORT (default 8787), ALLOWED_ORIGIN (default *; set to your app's origin in production).
import http from 'node:http';

const API_KEY = process.env.META_API_KEY;
const UPSTREAM = (process.env.META_API_BASE_URL || 'https://api.meta.ai/v1').replace(/\/+$/, '');
const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const MAX_BODY_BYTES = 15 * 1024 * 1024;
// Only the two endpoints the app uses are forwarded
const ALLOWED_PATHS = new Set(['/chat/completions', '/asr/transcribe']);

if (!API_KEY) {
  console.error('META_API_KEY is not set');
  process.exit(1);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  const path = new URL(req.url, 'http://localhost').pathname;
  if (req.method !== 'POST' || !ALLOWED_PATHS.has(path)) {
    res.writeHead(404, corsHeaders);
    res.end('Not found');
    return;
  }

  try {
    const body = await readBody(req);
    const upstream = await fetch(`${UPSTREAM}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body,
    });
    const payload = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      ...corsHeaders,
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
    });
    res.end(payload);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.writeHead(err.message === 'Payload too large' ? 413 : 502, corsHeaders);
    res.end(err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Meta API proxy listening on http://localhost:${PORT} -> ${UPSTREAM}`);
});

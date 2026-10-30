// Meta Model API proxy for Sparky Reader, served by Firebase Hosting at /api/**.
// The Meta API key lives in Secret Manager (META_API_KEY), never in the app bundle.
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const META_API_KEY = defineSecret('META_API_KEY');
const UPSTREAM = 'https://api.meta.ai/v1';
// Only the two endpoints the app uses are forwarded
const ALLOWED_PATHS = new Set(['/chat/completions', '/asr/transcribe']);

exports.metaProxy = onRequest(
  {
    region: 'us-east1',
    secrets: [META_API_KEY],
    // Hosting cuts requests at 60s; Muse Spark reasoning plus a page photo fits well within it
    timeoutSeconds: 60,
    memory: '256MiB',
    // Caps cost if someone hammers the endpoint
    maxInstances: 5,
  },
  async (req, res) => {
    // Hosting forwards the full path (/api/chat/completions); direct calls arrive without the prefix
    const path = req.path.replace(/^\/api/, '');
    if (req.method !== 'POST' || !ALLOWED_PATHS.has(path)) {
      res.status(404).send('Not found');
      return;
    }

    try {
      const upstream = await fetch(`${UPSTREAM}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': req.get('content-type') || 'application/json',
          Authorization: `Bearer ${META_API_KEY.value()}`,
        },
        body: req.rawBody,
      });
      const payload = Buffer.from(await upstream.arrayBuffer());
      res
        .status(upstream.status)
        .set('Content-Type', upstream.headers.get('content-type') || 'application/json')
        .set('Cache-Control', 'no-store')
        .send(payload);
    } catch (err) {
      console.error('Meta proxy error:', err);
      res.status(502).send('Upstream error');
    }
  }
);

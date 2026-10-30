// Fails the deploy if the Meta API key from .env leaked into the web build in dist/.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const envFile = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const key = (envFile.match(/^EXPO_PUBLIC_META_API_KEY=(.*)$/m)?.[1] || '').trim().replace(/^["']|["']$/g, '');

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(js|html|json)$/.test(name)) files.push(path);
  }
};
walk('dist');

if (key && files.some((file) => readFileSync(file, 'utf8').includes(key))) {
  console.error('The Meta API key is inside dist/. Build with `npm run build:web` so the app uses the /api proxy.');
  process.exit(1);
}
console.log(`Bundle check passed: no API key in ${files.length} files.`);

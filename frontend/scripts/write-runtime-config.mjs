import { writeFileSync } from 'node:fs';

const apiUrl = process.env.API_URL?.trim().replace(/\/+$/, '');
if (!apiUrl || !/^https:\/\/[^/]+\/api\/v1$/.test(apiUrl)) {
  throw new Error('API_URL must be an HTTPS URL ending with /api/v1.');
}

writeFileSync(
  new URL('../public/runtime-config.js', import.meta.url),
  `window.__APP_CONFIG__ = ${JSON.stringify({ apiUrl })};\n`,
  'utf8'
);

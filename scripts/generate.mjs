import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import worker from './engine.mjs';

const origin = process.env.PUBLIC_ORIGIN || 'https://patient-pine-10b1.iabfall.workers.dev';
const base = new URL(origin);
if (base.protocol !== 'https:') throw new Error('PUBLIC_ORIGIN muss HTTPS verwenden.');

const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, options = {}) => {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await nativeFetch(input, { ...options, signal: AbortSignal.timeout(60000) });
      if (response.ok) return response;
      lastError = new Error(`Quelldienst: HTTP ${response.status}`);
      await response.body?.cancel();
    } catch (error) { lastError = error; }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  throw lastError;
};

// Only this known route is generated. All icon addresses point to the public Worker.
const response = await worker.fetch(new Request(new URL('/roadworks-datex.geojson', base)), {}, { waitUntil() {} });
if (!response.ok) throw new Error(`Aufbereitung fehlgeschlagen: ${response.status} ${await response.text()}`);
const data = await response.json();
if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Ungültiges GeoJSON');
// An empty county may be valid. An empty statewide source indicates a source/format problem.
if (!(data.metadata?.situations > 0) || !(data.metadata?.raw_phases > 0)) throw new Error('DATEX-Quelle ist leer oder das Format wurde geändert. Vorherige Daten bleiben erhalten.');
for (const feature of data.features) {
  const geometry = feature.geometry;
  if (!geometry || !['Point', 'LineString'].includes(geometry.type)) throw new Error('Unerwartete Geometrie');
  const points = geometry.type === 'Point' ? [geometry.coordinates] : geometry.coordinates;
  if (points.length < (geometry.type === 'Point' ? 1 : 2) || !points.every(p => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90)) throw new Error('Ungültige Koordinaten');
  const icon = feature.properties?._umap_options?.iconUrl;
  if (icon && new URL(icon).origin !== base.origin) throw new Error('Falsche Icon-Adresse');
}
const status = { last_success: data.metadata.generated, features: data.features.length, source: data.metadata.source, public_origin: base.origin };
const target = new URL('../data/', import.meta.url);
const stage = new URL('../.data-stage/', import.meta.url);
await mkdir(stage, { recursive: true });
await writeFile(new URL('roadworks-datex.geojson', stage), JSON.stringify(data));
await writeFile(new URL('status.json', stage), JSON.stringify(status, null, 2) + '\n');
await mkdir(target, { recursive: true });
// No git commit happens unless the entire generator has completed successfully.
for (const file of ['roadworks-datex.geojson', 'status.json']) await rename(new URL(file, stage), new URL(file, target));
await rm(stage, { recursive: true, force: true });
console.log(JSON.stringify(status));

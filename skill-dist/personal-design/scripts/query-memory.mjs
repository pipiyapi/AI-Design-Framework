import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    if (!values[index].startsWith('--')) continue;
    const key = values[index].slice(2);
    const value = values[index + 1];
    result[key] = value && !value.startsWith('--') ? values[++index] : true;
  }
  return result;
}

function terms(value) {
  return [...new Set(String(value || '').toLowerCase().split(/[^a-z0-9\u4e00-\u9fff-]+/).filter(term => term.length > 1))];
}

function score(item, queryTerms) {
  const title = String(item.title || '').toLowerCase();
  const tags = [...(item.tags || []), ...(item.works_for || []), ...(item.liked_aspects || [])].join(' ').toLowerCase();
  const summary = String(item.summary || '').toLowerCase();
  const avoid = (item.avoid_for || []).join(' ').toLowerCase();
  let total = item.type === 'personal-dna' ? 1.5 : 0;
  for (const term of queryTerms) {
    if (title.includes(term)) total += 6;
    if (tags.includes(term)) total += 4;
    if (summary.includes(term)) total += 1;
    if (avoid.includes(term)) total -= 8;
  }
  if (item.status === 'validated' || item.status === 'verified') total += 2;
  return total;
}

const options = parseArgs(process.argv.slice(2));
const queryTerms = terms(options.query || process.argv.slice(2).join(' '));
const limit = Math.max(1, Math.min(20, Number(options.limit || 8)));
const catalogPath = path.resolve(scriptDir, '../references/catalog.json');
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const requestedType = options.type ? new Set(String(options.type).split(',')) : null;

const results = catalog.items
  .filter(item => !requestedType || requestedType.has(item.type))
  .map(item => ({ ...item, score: score(item, queryTerms) }))
  .filter(item => item.score > 0 || item.type === 'personal-dna')
  .sort((a, b) => b.score - a.score || String(a.title).localeCompare(String(b.title)))
  .slice(0, limit);

console.log(JSON.stringify({ query: queryTerms, count: results.length, results }, null, 2));

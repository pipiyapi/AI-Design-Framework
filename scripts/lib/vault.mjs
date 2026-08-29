import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = path.resolve(moduleDir, '../..');

export function vaultRoot() {
  return path.resolve(process.env.DESIGN_MEMORY_ROOT || DEFAULT_ROOT);
}

export function toPosix(value) {
  return value.split(path.sep).join('/');
}

export function relativeToRoot(file, root = vaultRoot()) {
  return toPosix(path.relative(root, file));
}

export function slugify(value) {
  return String(value || 'untitled')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'untitled';
}

export function timestamp() {
  return new Date().toISOString();
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value === '') return '';
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if ((value.startsWith('[') && value.endsWith(']')) ||
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('"') && value.endsWith('"'))) {
    try { return JSON.parse(value); } catch { /* keep text */ }
  }
  return value.replace(/^['"]|['"]$/g, '');
}

export function parseMarkdown(text) {
  if (!text.startsWith('---\n')) return { data: {}, body: text };
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) return { data: {}, body: text };
  const frontmatter = text.slice(4, end);
  const data = {};
  for (const line of frontmatter.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon < 1) continue;
    const key = line.slice(0, colon).trim();
    data[key] = parseScalar(line.slice(colon + 1));
  }
  return { data, body: text.slice(end + 5) };
}

function scalarToYaml(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(String(value));
}

export function serializeMarkdown(data, body = '') {
  const ordered = Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${scalarToYaml(value)}`)
    .join('\n');
  return `---\n${ordered}\n---\n${body.startsWith('\n') ? body : `\n${body}`}`;
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function atomicWrite(file, content) {
  await ensureDir(path.dirname(file));
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporary, content, 'utf8');
  await fs.rename(temporary, file);
}

export async function readEntry(file, root = vaultRoot()) {
  const text = await fs.readFile(file, 'utf8');
  const parsed = parseMarkdown(text);
  return {
    ...parsed,
    file,
    relativePath: relativeToRoot(file, root),
  };
}

export async function writeEntry(file, data, body) {
  await atomicWrite(file, serializeMarkdown(data, body));
}

export async function updateEntry(file, updates) {
  const entry = await readEntry(file);
  const data = { ...entry.data, ...updates, updated_at: timestamp() };
  await writeEntry(file, data, entry.body);
  return { ...entry, data };
}

export async function walkMarkdown(dir) {
  const results = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...await walkMarkdown(full));
      if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_index')) results.push(full);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return results.sort();
}

export async function findEntryById(dir, id) {
  for (const file of await walkMarkdown(dir)) {
    const entry = await readEntry(file);
    if (entry.data.id === id) return entry;
  }
  return null;
}

export async function moveEntry(entry, targetDir) {
  await ensureDir(targetDir);
  const target = path.join(targetDir, path.basename(entry.file));
  await fs.rename(entry.file, target);
  return target;
}

export async function copyFileSafe(source, destination) {
  await ensureDir(path.dirname(destination));
  await fs.copyFile(source, destination);
}

export async function readJson(file, fallback = {}) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeJson(file, value) {
  await atomicWrite(file, `${JSON.stringify(value, null, 2)}\n`);
}

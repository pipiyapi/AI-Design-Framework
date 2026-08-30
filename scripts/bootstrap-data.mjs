import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir, frameworkRoot, vaultRoot } from './lib/vault.mjs';

function argsToObject(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    if (!values[index].startsWith('--')) continue;
    const key = values[index].slice(2);
    const next = values[index + 1];
    result[key] = next && !next.startsWith('--') ? values[++index] : true;
  }
  return result;
}

async function copyMissing(source, target) {
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await ensureDir(to);
      await copyMissing(from, to);
      continue;
    }
    try { await fs.access(to); }
    catch { await fs.copyFile(from, to); }
  }
}

export async function bootstrapData(root = vaultRoot()) {
  const template = path.join(frameworkRoot(), 'data-template');
  await ensureDir(root);
  await copyMissing(template, root);
  return root;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const options = argsToObject(process.argv.slice(2));
  const target = path.resolve(options.root || vaultRoot());
  console.log(`Data repository ready: ${await bootstrapData(target)}`);
}

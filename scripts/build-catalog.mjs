import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readEntry,
  vaultRoot,
  walkMarkdown,
  writeJson,
} from './lib/vault.mjs';

const KNOWLEDGE_DIRS = [
  '01-References',
  '02-Patterns',
  '03-Recipes',
  '04-Principles',
  '05-Personal-DNA',
  '07-Workflows',
  '08-Playbooks',
];

function list(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function excerpt(body) {
  return body
    .replace(/!\[\[[^\]]+\]\]/g, '')
    .replace(/[#>*`_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 360);
}

export async function buildCatalog(root = vaultRoot()) {
  const items = [];
  for (const relativeDir of KNOWLEDGE_DIRS) {
    const files = await walkMarkdown(path.join(root, relativeDir));
    for (const file of files) {
      const entry = await readEntry(file, root);
      if (!entry.data.id || !entry.data.type) continue;
      if (entry.data.status === 'rejected' || entry.data.status === 'archived') continue;
      items.push({
        id: entry.data.id,
        type: entry.data.type,
        title: entry.data.title || entry.data.id,
        path: entry.relativePath,
        status: entry.data.status || 'active',
        tags: list(entry.data.tags),
        works_for: list(entry.data.works_for),
        avoid_for: list(entry.data.avoid_for),
        liked_aspects: list(entry.data.liked_aspects),
        preference_score: entry.data.preference_score ?? null,
        source_url: entry.data.source_url || null,
        source_platform: entry.data.source_platform || null,
        capability_slots: list(entry.data.capability_slots),
        outcome: entry.data.outcome || null,
        evidence_quality: entry.data.evidence_quality || null,
        cover_asset: entry.data.cover_asset || entry.data.preview_asset || null,
        summary: excerpt(entry.body),
        updated_at: entry.data.updated_at || entry.data.created_at || null,
      });
    }
  }
  items.sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
  const catalog = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    counts: items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}),
    items,
  };
  await writeJson(path.join(root, '_system/catalog.json'), catalog);
  return catalog;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const catalog = await buildCatalog();
  console.log(`Catalog built: ${catalog.items.length} items`);
}

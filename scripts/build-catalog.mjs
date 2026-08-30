import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readEntry,
  vaultRoot,
  walkMarkdown,
  writeJson,
} from './lib/vault.mjs';

const KNOWLEDGE_DIRS = [
  ['01-References'],
  ['02-Patterns'],
  ['03-Recipes'],
  ['04-Principles'],
  ['05-Personal-DNA'],
  ['06-Projects/Accepted', 'project'],
  ['07-Workflows'],
];

const RELATION_FIELDS = {
  inspired_by: 'inspired-by',
  source_references: 'derived-from-reference',
  source_workflows: 'used-workflow',
  applied_in: 'applied-in',
  validated_by: 'validated-by',
  produced_recipes: 'produced-recipe',
  produced_patterns: 'produced-pattern',
  source_project: 'derived-from-project',
  related_recipes: 'implemented-by-recipe',
  related_patterns: 'supports-pattern',
};

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

function skillPath(relativePath, type) {
  const targets = {
    reference: 'references', pattern: 'patterns', recipe: 'recipes', principle: 'principles',
    'personal-dna': 'personal-dna', project: 'projects', workflow: 'workflows',
  };
  const folder = targets[type];
  if (!folder) return null;
  const parts = relativePath.split('/');
  const remainder = type === 'project' ? parts.slice(2) : parts.slice(1);
  return ['references', 'knowledge', folder, ...remainder].join('/');
}

export async function buildCatalog(root = vaultRoot()) {
  const items = [];
  const relationships = [];
  for (const [relativeDir, requiredType] of KNOWLEDGE_DIRS) {
    const files = await walkMarkdown(path.join(root, relativeDir));
    for (const file of files) {
      const entry = await readEntry(file, root);
      if (!entry.data.id || !entry.data.type) continue;
      if (requiredType && entry.data.type !== requiredType) continue;
      if (entry.data.status === 'rejected' || entry.data.status === 'archived') continue;
      const relations = Object.fromEntries(
        Object.keys(RELATION_FIELDS).map(key => [key, list(entry.data[key])]),
      );
      const item = {
        id: entry.data.id,
        type: entry.data.type,
        title: entry.data.title || entry.data.id,
        path: entry.relativePath,
        skill_path: skillPath(entry.relativePath, entry.data.type),
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
        relations,
        summary: entry.data.summary || excerpt(entry.body),
        updated_at: entry.data.updated_at || entry.data.created_at || null,
      };
      items.push(item);
      for (const [field, relation] of Object.entries(RELATION_FIELDS)) {
        for (const target of relations[field]) {
          relationships.push({ from: item.id, relation, to: target });
        }
      }
    }
  }
  items.sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
  const catalog = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    counts: items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}),
    items,
  };
  await writeJson(path.join(root, '_system/catalog.json'), catalog);
  await writeJson(path.join(root, '_system/relationships.json'), {
    schemaVersion: 1,
    generatedAt: catalog.generatedAt,
    edges: relationships.sort((a, b) => a.from.localeCompare(b.from) || a.relation.localeCompare(b.relation) || a.to.localeCompare(b.to)),
  });
  return catalog;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const catalog = await buildCatalog();
  console.log(`Catalog built: ${catalog.items.length} items`);
}

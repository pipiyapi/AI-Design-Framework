import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findEntryById,
  slugify,
  timestamp,
  vaultRoot,
  writeEntry,
} from './lib/vault.mjs';

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    if (!values[index].startsWith('--')) continue;
    const key = values[index].slice(2);
    const next = values[index + 1];
    result[key] = next && !next.startsWith('--') ? values[++index] : true;
  }
  return result;
}

function list(value) {
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

export async function createPatternCandidate(options, root = vaultRoot()) {
  if (!options.title || !options.references || !options.rule) {
    throw new Error('Required: --title, --references <id,id>, and --rule.');
  }
  const referenceIds = list(options.references);
  const references = [];
  for (const id of referenceIds) {
    const entry = await findEntryById(path.join(root, '01-References'), id);
    if (!entry) throw new Error(`Reference not found: ${id}`);
    references.push(entry);
  }
  const now = timestamp();
  const id = `pattern-${slugify(options.title)}`;
  const media = references.map(entry => entry.data.cover_asset).filter(Boolean);
  const data = {
    id,
    type: 'pattern',
    title: options.title,
    status: 'candidate',
    review_status: 'pending',
    source_references: referenceIds,
    media_assets: media,
    tags: list(options.tags),
    works_for: list(options['works-for']),
    avoid_for: list(options['avoid-for']),
    confidence: options.confidence ? Number(options.confidence) : null,
    created_at: now,
    updated_at: now,
  };
  const evidence = references.map(entry => `- [[${entry.relativePath.replace(/\.md$/, '')}|${entry.data.title || entry.data.id}]]`).join('\n');
  const body = `\n# ${options.title}\n\n## Visual evidence\n\n${evidence}\n\n## Shared design rule\n\n${options.rule}\n\n## Works for\n\n${list(options['works-for']).map(item => `- ${item}`).join('\n')}\n\n## Avoid for\n\n${list(options['avoid-for']).map(item => `- ${item}`).join('\n')}\n\n## Implementation guidance\n\n_No implementation is required for Pattern promotion._\n`;
  const file = path.join(root, '_candidates/patterns', `${id}.md`);
  await writeEntry(file, data, body);
  return file;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  try {
    const file = await createPatternCandidate(parseArgs(process.argv.slice(2)));
    console.log(`Pattern candidate created: ${file}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

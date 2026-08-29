import fs from 'node:fs/promises';
import path from 'node:path';

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

function slug(value) {
  return String(value || 'project-feedback').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function copyEvidence(source, bundle, targetName) {
  if (!source) return '';
  const absolute = path.resolve(source);
  const extension = path.extname(absolute);
  const target = path.join(bundle, `${targetName}${extension}`);
  await fs.copyFile(absolute, target);
  return path.basename(target);
}

const options = parseArgs(process.argv.slice(2));
if (!options.project || !options.note) {
  console.error('Required: --project <name> --note <explicit feedback>');
  process.exit(1);
}

const createdAt = new Date().toISOString();
const id = `feedback-${slug(options.project)}-${createdAt.slice(0, 10).replaceAll('-', '')}`;
const bundle = path.resolve('.design-memory/outbox', id);
await fs.mkdir(bundle, { recursive: true });
const beforeAsset = await copyEvidence(options.before, bundle, 'before');
const afterAsset = await copyEvidence(options.after, bundle, 'after');
const videoAsset = await copyEvidence(options.video, bundle, 'result');

const feedback = {
  schemaVersion: 1,
  id,
  type: 'feedback',
  status: 'pending-review',
  project_name: options.project,
  project_type: options['project-type'] || '',
  skill_version: options['skill-version'] || '',
  source_commit: options.commit || '',
  pattern_id: options.pattern || '',
  recipe_id: options.recipe || '',
  result: options.result || 'changed',
  classification: options.classification || 'unclassified',
  explicit_feedback: options.note,
  before_asset: beforeAsset,
  after_asset: afterAsset,
  video_asset: videoAsset,
  created_at: createdAt,
};

await fs.writeFile(path.join(bundle, 'feedback.json'), `${JSON.stringify(feedback, null, 2)}\n`);
const frontmatter = Object.entries(feedback).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
const body = `---\n${frontmatter}\n---\n\n# ${options.project} design feedback\n\n## Explicit user feedback\n\n${options.note}\n\n## Visual evidence\n\n${beforeAsset ? `Before: [[${beforeAsset}]]\n` : ''}${afterAsset ? `After: [[${afterAsset}]]\n` : ''}${videoAsset ? `Motion: [[${videoAsset}]]\n` : ''}\n## Suggested knowledge update\n\nClassification candidate: ${feedback.classification}\n`;
await fs.writeFile(path.join(bundle, 'feedback.md'), body);
console.log(bundle);

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findEntryById, slugify, timestamp, vaultRoot, writeEntry } from './lib/vault.mjs';

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

function list(value) { return String(value || '').split(',').map(item => item.trim()).filter(Boolean); }

export async function createPlaybookCandidate(options, root = vaultRoot()) {
  if (!options.title || !options.workflows || !options.mechanism) throw new Error('Required: --title, --workflows, and --mechanism.');
  const workflowIds = list(options.workflows);
  for (const id of workflowIds) {
    const entry = await findEntryById(path.join(root, '07-Workflows'), id);
    if (!entry) throw new Error(`Validated workflow not found: ${id}`);
  }
  const now = timestamp();
  const id = `playbook-${slugify(options.title)}`;
  const data = {
    id,
    type: 'playbook',
    title: options.title,
    status: 'candidate',
    review_status: 'pending',
    source_workflows: workflowIds,
    outcome: options.outcome || '',
    capability_slots: list(options.capabilities),
    works_for: list(options['works-for']),
    avoid_for: list(options['avoid-for']),
    created_at: now,
    updated_at: now,
  };
  const body = `\n# ${options.title}\n\n## Reusable mechanism\n\n${options.mechanism}\n\n## Decision rules\n\n${options.rules || '_Pending review._'}\n\n## Capability slots\n\n${data.capability_slots.map(value => `- ${value}`).join('\n') || '_Pending._'}\n\n## Execution sequence\n\n${options.sequence || '_Pending._'}\n\n## Success criteria\n\n${options.success || '_Pending._'}\n\n## Failure modes\n\n${options.failures || '_Pending._'}\n\n## Promotion path to Recipe\n\nUse this Playbook in a real project, capture visual evidence, and create a Recipe only after the result is accepted.\n`;
  const file = path.join(root, '_candidates/playbooks', `${id}.md`);
  await writeEntry(file, data, body);
  return file;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  try { console.log(await createPlaybookCandidate(argsToObject(process.argv.slice(2)))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateVideoProposal } from './lib/video-generation-policy.mjs';
import { slugify, timestamp, vaultRoot, writeJson } from './lib/vault.mjs';

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
function list(value) { return String(value || '').split('|').map(item => item.trim()).filter(Boolean); }

export async function createVideoProposal(options, root = vaultRoot()) {
  const createdAt = timestamp();
  const proposal = {
    schemaVersion: 1,
    id: `video-${slugify(options.goal)}-${createdAt.replace(/\D/g, '').slice(0, 14)}`,
    status: 'awaiting-user-confirmation',
    provider: 'jimeng-cli',
    official_install: 'https://jimeng.jianying.com/ai-tool/install',
    goal: options.goal || '',
    references: list(options.references),
    model: options.model || 'seedance-2.5',
    rationale: options.rationale || '',
    duration: options.duration || '',
    aspect_ratio: options.ratio || '',
    resolution: options.resolution || '',
    audio: options.audio || 'none',
    motion_constraints: list(options.motion),
    avoid: list(options.avoid),
    estimated_points: options.points || 'unknown — verify in Jimeng before submission',
    output_count: 1,
    created_at: createdAt,
    approval: null,
  };
  const errors = validateVideoProposal(proposal);
  if (errors.length) throw new Error(errors.join('; '));
  const file = path.join(root, '_generation/video-proposals', `${proposal.id}.json`);
  await writeJson(file, proposal);
  return { file, proposal };
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  try {
    const result = await createVideoProposal(argsToObject(process.argv.slice(2)));
    console.log(`Proposal awaiting user confirmation: ${result.file}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

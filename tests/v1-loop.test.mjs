import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildCatalog } from '../scripts/build-catalog.mjs';
import { buildSkill } from '../scripts/build-skill.mjs';
import { bootstrapData } from '../scripts/bootstrap-data.mjs';
import { createPatternCandidate } from '../scripts/create-pattern-candidate.mjs';
import { importFeedback } from '../scripts/import-feedback.mjs';
import { ingest } from '../scripts/ingest.mjs';
import { ingestTutorial } from '../scripts/ingest-tutorial.mjs';
import { createPlaybookCandidate } from '../scripts/create-playbook-candidate.mjs';
import { createVideoProposal } from '../scripts/video-proposal.mjs';
import { assertSubmissionAllowed } from '../scripts/lib/video-generation-policy.mjs';
import { readEntry, walkMarkdown } from '../scripts/lib/vault.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function makeRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-memory-v1-'));
  for (const dir of [
    '00-Inbox', '01-References', '02-Patterns', '03-Recipes', '04-Principles',
    '05-Personal-DNA', '06-Projects/Feedback-Inbox', '06-Projects/Accepted',
    '07-Workflows', '08-Playbooks',
    '_assets/references', '_archive/rejected-references', '_archive/rejected-patterns',
    '_archive/rejected-workflows', '_archive/rejected-playbooks', '_candidates/patterns',
    '_candidates/playbooks', '_evidence/tutorials', '_generation/video-proposals', '_system', 'skill-dist',
  ]) await fs.mkdir(path.join(root, dir), { recursive: true });
  await fs.cp(path.join(repoRoot, 'skill-source'), path.join(root, 'skill-source'), { recursive: true });
  await fs.copyFile(path.join(repoRoot, 'data-template/_system/settings.json'), path.join(root, '_system/settings.json'));
  await fs.copyFile(path.join(repoRoot, 'data-template/_system/taxonomy.json'), path.join(root, '_system/taxonomy.json'));
  await fs.writeFile(path.join(root, '05-Personal-DNA/preferences.md'), `---\nid: "dna-test"\ntype: "personal-dna"\ntitle: "Test DNA"\nstatus: "active"\ntags: ["editorial"]\n---\n\n# Test DNA\n\nPrefer restrained editorial hierarchy.\n`);
  return root;
}

async function waitForServer(child, url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Server exited with ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch { /* retry */ }
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  throw new Error('Server did not become ready.');
}

test('V1 closes the loop from visual inbox to skill and project feedback', async t => {
  const root = await makeRoot();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const image = path.join(root, 'fixture.svg');
  await fs.writeFile(image, `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720"><rect width="1200" height="720" fill="#eee9dd"/><rect x="80" y="80" width="430" height="560" fill="#1c1b18"/><text x="570" y="220" font-family="serif" font-size="72">Editorial memory</text></svg>`);

  const first = await ingest({ image, title: 'Editorial Memory One' }, root);
  const second = await ingest({ image, title: 'Editorial Memory Two' }, root);
  assert.equal((await walkMarkdown(path.join(root, '00-Inbox'))).length, 2);

  const port = 45170 + Math.floor(Math.random() * 300);
  const child = spawn(process.execPath, [path.join(repoRoot, 'review-app/server.mjs'), '--port', String(port)], {
    cwd: repoRoot,
    env: { ...process.env, DESIGN_MEMORY_ROOT: root, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => child.kill('SIGTERM'));
  await waitForServer(child, `http://127.0.0.1:${port}/api/health`);

  for (const id of [first.id, second.id]) {
    const response = await fetch(`http://127.0.0.1:${port}/api/review/reference`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, decision: 'liked', aspects: ['layout', 'typography'] }),
    });
    assert.equal(response.status, 200);
  }
  assert.equal((await walkMarkdown(path.join(root, '01-References'))).length, 2);

  const candidate = await createPatternCandidate({
    title: 'Editorial Split Memory',
    references: `${first.id},${second.id}`,
    rule: 'Use an asymmetric split between a dense anchor and generous reading space.',
    tags: 'editorial,asymmetric',
    'works-for': 'portfolio,editorial',
    'avoid-for': 'dense-dashboard',
  }, root);
  const candidateEntry = await readEntry(candidate, root);
  const promote = await fetch(`http://127.0.0.1:${port}/api/review/pattern`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: candidateEntry.data.id, decision: 'approved' }),
  });
  assert.equal(promote.status, 200);
  assert.equal((await walkMarkdown(path.join(root, '02-Patterns'))).length, 1);

  const catalog = await buildCatalog(root);
  assert.ok(catalog.items.some(item => item.type === 'pattern'));
  const skill = await buildSkill(root);
  assert.ok(skill.itemCount >= 2);
  await fs.access(path.join(skill.target, 'references/catalog.json'));

  const project = await fs.mkdtemp(path.join(os.tmpdir(), 'design-project-'));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  const feedbackScript = path.join(skill.target, 'scripts/write-feedback.mjs');
  const feedback = spawn(process.execPath, [
    feedbackScript,
    '--project', 'Knowledge Project',
    '--project-type', 'knowledge-base',
    '--pattern', candidateEntry.data.id,
    '--classification', 'project-only',
    '--note', 'The motion is too prominent for dense reading.',
    '--before', image,
    '--after', image,
  ], { cwd: project, stdio: 'inherit' });
  await new Promise((resolve, reject) => {
    feedback.on('exit', code => code === 0 ? resolve() : reject(new Error(`Feedback writer exited ${code}`)));
  });
  const imported = await importFeedback(project, root);
  assert.equal(imported.length, 1);

  const feedbackState = await (await fetch(`http://127.0.0.1:${port}/api/state`)).json();
  assert.equal(feedbackState.feedback.length, 1);
  const approve = await fetch(`http://127.0.0.1:${port}/api/review/feedback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: feedbackState.feedback[0].id, decision: 'approved', classification: 'project-only' }),
  });
  assert.equal(approve.status, 200);
  assert.equal((await walkMarkdown(path.join(root, '06-Projects/Accepted'))).length, 1);
});

test('raw video intake stays in the ignored local cache instead of formal assets', async t => {
  const root = await makeRoot();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const input = path.join(root, 'temporary-recording.mov');
  await fs.writeFile(input, 'temporary video fixture');

  const result = await ingest({ video: input, title: 'Temporary Recording' }, root);
  const entry = await readEntry(result.note, root);
  assert.equal(entry.data.raw_media_policy, 'local-intake-only');
  assert.equal(entry.data.source_file, '');
  assert.deepEqual(entry.data.media_assets, []);
  await fs.access(path.join(root, '.design-memory/intake-media', result.id, 'temporary-recording.mov'));
  await assert.rejects(fs.access(path.join(root, '_assets/references', result.id, 'temporary-recording.mov')));
});

test('tutorial evidence becomes a reviewed Workflow and Playbook without publishing raw evidence', async t => {
  const root = await makeRoot();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const evidenceFile = path.join(root, 'tutorial.json');
  await fs.writeFile(evidenceFile, JSON.stringify({
    title: 'Pointer-driven character turn',
    canonical_url: 'https://www.xiaohongshu.com/explore/test123',
    platform_id: 'test123',
    page_text: 'raw source tool and prompt evidence',
    evidence_coverage: ['page text', 'timeline'],
    distillation: {
      outcome: 'character follows pointer',
      capability_slots: ['image-generation', 'video-generation', 'frontend-generation'],
      steps: ['Create consistent endpoint images', 'Generate one continuous transition clip', 'Map pointer delta to video time'],
      success_criteria: ['eyes and head move together'],
      failure_modes: ['seek flooding'],
      prompt_recipe: 'Keep identity fixed; turn eyes and head naturally; preserve lighting and framing.',
      confidence: 0.86,
    },
  }));
  const workflow = await ingestTutorial({ url: 'https://xhslink.cn/o/test', evidence: evidenceFile }, root);
  assert.equal((await readEntry(workflow.note, root)).data.type, 'workflow');

  const port = 45500 + Math.floor(Math.random() * 300);
  const child = spawn(process.execPath, [path.join(repoRoot, 'review-app/server.mjs'), '--port', String(port)], {
    cwd: repoRoot,
    env: { ...process.env, DESIGN_MEMORY_ROOT: root, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => child.kill('SIGTERM'));
  await waitForServer(child, `http://127.0.0.1:${port}/api/health`);
  const approve = await fetch(`http://127.0.0.1:${port}/api/review/workflow`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: workflow.id, decision: 'approved' }),
  });
  assert.equal(approve.status, 200);
  assert.equal((await walkMarkdown(path.join(root, '07-Workflows'))).length, 1);

  const playbookFile = await createPlaybookCandidate({
    title: 'Pointer-scrubbed character state', workflows: workflow.id,
    mechanism: 'Use a short transition clip as a continuous state space controlled by pointer movement.',
    capabilities: 'image-generation,video-generation,frontend-generation',
  }, root);
  const playbook = await readEntry(playbookFile, root);
  const promote = await fetch(`http://127.0.0.1:${port}/api/review/playbook`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: playbook.data.id, decision: 'approved' }),
  });
  assert.equal(promote.status, 200);
  const skill = await buildSkill(root);
  await fs.access(path.join(skill.target, 'references/knowledge/workflows'));
  await fs.access(path.join(skill.target, 'references/knowledge/playbooks'));
  await assert.rejects(fs.access(path.join(skill.target, '_evidence')));
});

test('video proposal enforces one output and matching unconsumed approval', async t => {
  const root = await makeRoot();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const { proposal } = await createVideoProposal({
    goal: 'Natural character head turn', model: 'seedance-2.5', duration: '5s', ratio: '16:9', resolution: '1080p',
    motion: 'eyes and head rotate together|stable identity', avoid: 'camera movement|flicker',
  }, root);
  assert.equal(proposal.output_count, 1);
  assert.throws(() => assertSubmissionAllowed(proposal, null), /confirmation/i);
  const approved = { ...proposal, status: 'approved-for-one-submission' };
  assert.equal(assertSubmissionAllowed(approved, { proposal_id: proposal.id, explicit_user_confirmation: true, consumed_at: null }), true);
  assert.throws(() => assertSubmissionAllowed(approved, { proposal_id: proposal.id, explicit_user_confirmation: true, consumed_at: new Date().toISOString() }), /already/i);
});

test('framework bootstraps a separate empty data repository without overwriting it', async t => {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'design-data-bootstrap-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'data');
  await bootstrapData(root);
  await fs.access(path.join(root, '_system/settings.json'));
  await fs.access(path.join(root, '00-Inbox/.gitkeep'));
  const marker = path.join(root, '05-Personal-DNA/preferences.md');
  await fs.writeFile(marker, 'user-owned knowledge');
  await bootstrapData(root);
  assert.equal(await fs.readFile(marker, 'utf8'), 'user-owned knowledge');
});

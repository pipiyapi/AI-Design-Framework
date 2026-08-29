import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildCatalog } from '../scripts/build-catalog.mjs';
import { buildSkill } from '../scripts/build-skill.mjs';
import { createPatternCandidate } from '../scripts/create-pattern-candidate.mjs';
import { importFeedback } from '../scripts/import-feedback.mjs';
import { ingest } from '../scripts/ingest.mjs';
import { readEntry, walkMarkdown } from '../scripts/lib/vault.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function makeRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-memory-v1-'));
  for (const dir of [
    '00-Inbox', '01-References', '02-Patterns', '03-Recipes', '04-Principles',
    '05-Personal-DNA', '06-Projects/Feedback-Inbox', '06-Projects/Accepted',
    '_assets/references', '_archive/rejected-references', '_archive/rejected-patterns',
    '_candidates/patterns', '_system', 'skill-dist',
  ]) await fs.mkdir(path.join(root, dir), { recursive: true });
  await fs.cp(path.join(repoRoot, 'skill-source'), path.join(root, 'skill-source'), { recursive: true });
  await fs.copyFile(path.join(repoRoot, '_system/settings.json'), path.join(root, '_system/settings.json'));
  await fs.copyFile(path.join(repoRoot, '_system/taxonomy.json'), path.join(root, '_system/taxonomy.json'));
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

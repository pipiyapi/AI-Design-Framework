import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from './build-catalog.mjs';
import { ensureDir, frameworkRoot, readJson, vaultRoot } from './lib/vault.mjs';

const KNOWLEDGE_EXPORTS = [
  ['02-Patterns', 'patterns'],
  ['03-Recipes', 'recipes'],
  ['04-Principles', 'principles'],
  ['05-Personal-DNA', 'personal-dna'],
  ['07-Workflows', 'workflows'],
  ['08-Playbooks', 'playbooks'],
];

async function copyExisting(source, target) {
  try {
    await fs.cp(source, target, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export async function buildSkill(root = vaultRoot()) {
  const catalog = await buildCatalog(root);
  const settings = await readJson(path.join(root, '_system/settings.json'));
  const framework = frameworkRoot();
  const localSource = path.join(root, 'skill-source/personal-design');
  const source = await fs.access(localSource).then(() => localSource).catch(() => path.join(framework, 'skill-source/personal-design'));
  const distRoot = source === localSource ? path.join(root, 'skill-dist') : path.join(framework, 'skill-dist');
  const target = path.join(distRoot, 'personal-design');
  const temporary = path.join(distRoot, `.tmp-${process.pid}-${Date.now()}`);

  await ensureDir(temporary);
  await fs.cp(source, temporary, { recursive: true });
  await ensureDir(path.join(temporary, 'references/knowledge'));
  await fs.writeFile(
    path.join(temporary, 'references/catalog.json'),
    `${JSON.stringify(catalog, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(temporary, 'references/source.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      repositoryUrl: settings.repositoryUrl || '',
      repositoryBranch: settings.repositoryBranch || 'main',
      skillVersion: settings.skillVersion || '0.1.0',
      builtAt: new Date().toISOString(),
    }, null, 2)}\n`,
  );

  for (const [from, to] of KNOWLEDGE_EXPORTS) {
    await copyExisting(path.join(root, from), path.join(temporary, 'references/knowledge', to));
  }

  await fs.rm(target, { recursive: true, force: true });
  await fs.rename(temporary, target);
  return { target, itemCount: catalog.items.length };
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const result = await buildSkill();
  console.log(`Skill built: ${result.target} (${result.itemCount} catalog items)`);
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir, slugify, timestamp, vaultRoot } from './lib/vault.mjs';

export async function importFeedback(projectPath, root = vaultRoot()) {
  const source = path.resolve(projectPath, '.design-memory/outbox');
  const destinationRoot = path.join(root, '06-Projects/Feedback-Inbox');
  await ensureDir(destinationRoot);
  let entries;
  try {
    entries = await fs.readdir(source, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`No feedback outbox found at ${source}`);
    throw error;
  }

  const imported = [];
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isFile()) continue;
    const stamp = timestamp().replace(/[:.]/g, '-');
    const target = path.join(destinationRoot, `${slugify(entry.name)}-${stamp}`);
    await fs.cp(path.join(source, entry.name), target, { recursive: true });
    imported.push(target);
  }
  return imported;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const projectPath = process.argv[2];
  if (!projectPath) {
    console.error('Usage: import-feedback <project-directory>');
    process.exitCode = 1;
  } else {
    try {
      const imported = await importFeedback(projectPath);
      console.log(`Imported ${imported.length} feedback bundle(s).`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}

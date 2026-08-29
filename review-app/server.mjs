import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../scripts/build-catalog.mjs';
import {
  ensureDir,
  findEntryById,
  moveEntry,
  readEntry,
  updateEntry,
  vaultRoot,
  walkMarkdown,
} from '../scripts/lib/vault.mjs';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const root = vaultRoot();
const settings = JSON.parse(await fs.readFile(path.join(root, '_system/settings.json'), 'utf8'));
const portArg = process.argv.indexOf('--port');
const port = Number(portArg >= 0 ? process.argv[portArg + 1] : process.env.PORT || settings.reviewPort || 4317);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

function json(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

function safePath(base, requested) {
  const resolved = path.resolve(base, requested);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) throw new Error('Unsafe path');
  return resolved;
}

async function bodyJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function array(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function bodySummary(body) {
  const analysisMatch = body.match(/## AI analysis\s+([\s\S]*?)(?=\n## |$)/i);
  const source = analysisMatch?.[1] || body;
  return source
    .replace(/!\[\[[^\]]+\]\]/g, '')
    .replace(/\[\[[^\]]+\]\]/g, '')
    .replace(/[#>*`_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 520);
}

function entryJson(entry) {
  const data = entry.data;
  const media = [...new Set([
    data.cover_asset,
    ...array(data.media_assets),
    data.preview_asset,
    data.before_asset,
    data.after_asset,
    data.video_asset,
  ].filter(Boolean).map(asset => {
    if (String(asset).includes('/') || String(asset).includes('\\')) return String(asset).replaceAll('\\', '/');
    return path.relative(root, path.join(path.dirname(entry.file), String(asset))).split(path.sep).join('/');
  }))];
  return {
    id: data.id,
    type: data.type,
    title: data.title || data.id,
    status: data.status,
    reviewStatus: data.review_status,
    sourceUrl: data.source_url || '',
    sourceType: data.source_type || '',
    summary: bodySummary(entry.body),
    tags: array(data.tags),
    suggestedTags: array(data.suggested_tags),
    likedAspects: array(data.liked_aspects),
    worksFor: array(data.works_for),
    avoidFor: array(data.avoid_for),
    sourceReferences: array(data.source_references),
    projectName: data.project_name || '',
    projectType: data.project_type || '',
    skillVersion: data.skill_version || '',
    explicitFeedback: data.explicit_feedback || '',
    classification: data.classification || 'unclassified',
    media,
    relativePath: entry.relativePath,
  };
}

async function entriesFrom(relativeDir) {
  const files = await walkMarkdown(path.join(root, relativeDir));
  const entries = [];
  for (const file of files) {
    const entry = await readEntry(file, root);
    if (entry.data.id) entries.push(entryJson(entry));
  }
  return entries;
}

async function state() {
  return {
    inbox: await entriesFrom('00-Inbox'),
    patterns: await entriesFrom('_candidates/patterns'),
    feedback: await entriesFrom('06-Projects/Feedback-Inbox'),
    taxonomy: JSON.parse(await fs.readFile(path.join(root, '_system/taxonomy.json'), 'utf8')),
    settings: {
      vaultName: settings.vaultName,
      skillVersion: settings.skillVersion,
      repositoryUrl: settings.repositoryUrl,
    },
  };
}

async function reviewReference(payload) {
  const entry = await findEntryById(path.join(root, '00-Inbox'), payload.id);
  if (!entry) throw new Error('Reference not found in Inbox.');
  const common = {
    review_status: payload.decision,
    liked_aspects: array(payload.aspects),
    reviewed_at: new Date().toISOString(),
  };
  if (payload.decision === 'liked') {
    await updateEntry(entry.file, { ...common, status: 'reference' });
    await moveEntry(entry, path.join(root, '01-References'));
  } else if (payload.decision === 'rejected') {
    await updateEntry(entry.file, { ...common, status: 'rejected' });
    await moveEntry(entry, path.join(root, '_archive/rejected-references'));
  } else {
    await updateEntry(entry.file, { ...common, status: 'inbox' });
  }
  await buildCatalog(root);
}

async function reviewPattern(payload) {
  const entry = await findEntryById(path.join(root, '_candidates/patterns'), payload.id);
  if (!entry) throw new Error('Pattern candidate not found.');
  if (payload.decision === 'approved') {
    await updateEntry(entry.file, { status: 'validated', review_status: 'approved' });
    await moveEntry(entry, path.join(root, '02-Patterns'));
  } else if (payload.decision === 'rejected') {
    await updateEntry(entry.file, { status: 'rejected', review_status: 'rejected' });
    await moveEntry(entry, path.join(root, '_archive/rejected-patterns'));
  } else {
    await updateEntry(entry.file, { status: 'candidate', review_status: 'observe' });
  }
  await buildCatalog(root);
}

async function reviewFeedback(payload) {
  const entry = await findEntryById(path.join(root, '06-Projects/Feedback-Inbox'), payload.id);
  if (!entry) throw new Error('Feedback item not found.');
  const updates = {
    classification: payload.classification || 'unclassified',
    review_status: payload.decision,
    reviewed_at: new Date().toISOString(),
  };
  if (payload.decision === 'approved') {
    await updateEntry(entry.file, { ...updates, status: 'approved-for-distillation' });
    const bundleDir = path.dirname(entry.file);
    const inboxDir = path.join(root, '06-Projects/Feedback-Inbox');
    if (bundleDir !== inboxDir) {
      const target = path.join(root, '06-Projects/Accepted', path.basename(bundleDir));
      await ensureDir(path.dirname(target));
      await fs.rename(bundleDir, target);
    } else {
      await moveEntry(entry, path.join(root, '06-Projects/Accepted'));
    }
  } else {
    await updateEntry(entry.file, { ...updates, status: 'pending-review' });
  }
  await buildCatalog(root);
}

async function serveFile(response, file) {
  try {
    const data = await fs.readFile(file);
    response.writeHead(200, {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    response.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') return json(response, 404, { error: 'Not found' });
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json(response, 200, { ok: true, root, version: settings.skillVersion });
    }
    if (request.method === 'GET' && url.pathname === '/api/state') {
      return json(response, 200, await state());
    }
    if (request.method === 'GET' && url.pathname === '/api/media') {
      const requested = url.searchParams.get('path') || '';
      return serveFile(response, safePath(root, requested));
    }
    if (request.method === 'POST' && url.pathname === '/api/review/reference') {
      await reviewReference(await bodyJson(request));
      return json(response, 200, { ok: true });
    }
    if (request.method === 'POST' && url.pathname === '/api/review/pattern') {
      await reviewPattern(await bodyJson(request));
      return json(response, 200, { ok: true });
    }
    if (request.method === 'POST' && url.pathname === '/api/review/feedback') {
      await reviewFeedback(await bodyJson(request));
      return json(response, 200, { ok: true });
    }
    if (request.method === 'POST' && url.pathname === '/api/rebuild') {
      const catalog = await buildCatalog(root);
      return json(response, 200, { ok: true, items: catalog.items.length });
    }
    if (request.method === 'GET') {
      const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      return serveFile(response, safePath(appRoot, relative));
    }
    json(response, 404, { error: 'Not found' });
  } catch (error) {
    console.error(error);
    json(response, 500, { error: error.message });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Personal Design Memory review: http://127.0.0.1:${port}`);
});

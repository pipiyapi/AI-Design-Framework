import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureDir,
  readEntry,
  relativeToRoot,
  slugify,
  timestamp,
  vaultRoot,
  walkMarkdown,
  writeEntry,
  writeJson,
} from './lib/vault.mjs';

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

export function detectPlatform(url) {
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (host === 'xhslink.cn' || host.endsWith('xiaohongshu.com')) return 'xiaohongshu';
  if (host === 'v.douyin.com' || host.endsWith('douyin.com')) return 'douyin';
  if (host === 'b23.tv' || host.endsWith('bilibili.com')) return 'bilibili';
  throw new Error('Tutorial URLs currently support Xiaohongshu, Douyin, and Bilibili.');
}

function derivePlatformId(platform, url) {
  const pathname = new URL(url).pathname;
  if (platform === 'xiaohongshu') return pathname.match(/\/(?:explore|discovery\/item)\/([a-z0-9]+)/i)?.[1] || '';
  if (platform === 'bilibili') return pathname.match(/\/(BV[a-z0-9]+)/i)?.[1] || '';
  if (platform === 'douyin') return pathname.match(/\/video\/(\d+)/)?.[1] || '';
  return '';
}

function lines(values, fallback = '_Pending evidence-aware distillation._') {
  if (!Array.isArray(values) || !values.length) return fallback;
  return values.map((value, index) => {
    if (typeof value === 'string') return `${index + 1}. ${value}`;
    const label = value.title || value.action || `Step ${index + 1}`;
    const detail = value.detail || value.mechanism || '';
    const io = [value.input && `Input: ${value.input}`, value.output && `Output: ${value.output}`].filter(Boolean).join(' · ');
    return `${index + 1}. **${label}**${detail ? ` — ${detail}` : ''}${io ? ` (${io})` : ''}`;
  }).join('\n');
}

function bullets(values, fallback = '_Not yet established._') {
  if (!Array.isArray(values) || !values.length) return fallback;
  return values.map(value => `- ${typeof value === 'string' ? value : JSON.stringify(value)}`).join('\n');
}

function compactPromptRecipe(value) {
  if (!value) return '_Not yet distilled._';
  const text = Array.isArray(value) ? value.join('\n') : String(value);
  if (text.length > 1400) throw new Error('prompt_recipe is too long. Store the original prompt in raw evidence and keep only compact constraints here.');
  return text;
}

async function findDuplicate(root, platform, platformId, canonicalUrl, hash) {
  for (const relativeDir of ['00-Inbox', '07-Workflows']) {
    for (const file of await walkMarkdown(path.join(root, relativeDir))) {
      const entry = await readEntry(file, root);
      if (entry.data.type !== 'workflow') continue;
      if (platformId && entry.data.source_platform === platform && entry.data.platform_id === platformId) return entry;
      if (canonicalUrl && entry.data.canonical_url === canonicalUrl) return entry;
      if (hash && entry.data.content_hash === hash) return entry;
    }
  }
  return null;
}

export async function ingestTutorial(options, root = vaultRoot()) {
  if (!options.url) throw new Error('Required: --url <Xiaohongshu, Douyin, or Bilibili share URL>.');
  const platform = detectPlatform(options.url);
  const evidence = options.evidence ? JSON.parse(await fs.readFile(path.resolve(options.evidence), 'utf8')) : {};
  const hasStructuredEvidence = Boolean(options.evidence);
  const canonicalUrl = evidence.canonical_url || options.url;
  const platformId = evidence.platform_id || derivePlatformId(platform, canonicalUrl);
  const title = options.title || evidence.title || `${platform} tutorial`;
  const capturedAt = evidence.captured_at || timestamp();
  const hashInput = JSON.stringify({ platform, canonicalUrl, title, page_text: evidence.page_text || '', transcript: evidence.transcript || '' });
  const contentHash = crypto.createHash('sha256').update(hashInput).digest('hex');
  const duplicate = await findDuplicate(root, platform, platformId, canonicalUrl, contentHash);
  if (duplicate) return { id: duplicate.data.id, note: duplicate.file, duplicate: true };

  const stableKey = platformId || slugify(title);
  const id = `workflow-${platform}-${stableKey}`.slice(0, 110);
  const evidenceDir = path.join(root, '_evidence/tutorials', id);
  await ensureDir(evidenceDir);
  const evidenceFile = path.join(evidenceDir, 'evidence.json');
  const raw = {
    schemaVersion: 1,
    platform,
    source_url: options.url,
    canonical_url: canonicalUrl,
    platform_id: platformId,
    captured_at: capturedAt,
    capture_routes: evidence.capture_routes || (hasStructuredEvidence ? [] : ['share URL only']),
    evidence_coverage: evidence.evidence_coverage || [],
    missing_evidence: evidence.missing_evidence || (hasStructuredEvidence ? [] : ['page text', 'transcript or subtitles', 'timed visual evidence', 'useful comments']),
    author: evidence.author || '',
    title,
    duration_seconds: evidence.duration_seconds ?? null,
    page_text: evidence.page_text || '',
    transcript: evidence.transcript || '',
    timeline: evidence.timeline || [],
    comments: evidence.comments || [],
    source_tool_mentions: evidence.source_tool_mentions || [],
    distillation: evidence.distillation || {},
    content_hash: contentHash,
  };
  await writeJson(evidenceFile, raw);

  const distilled = raw.distillation;
  const slots = distilled.capability_slots || [];
  const noteData = {
    id,
    type: 'workflow',
    title,
    status: 'inbox',
    review_status: 'pending',
    analysis_status: Object.keys(distilled).length ? 'distilled' : 'pending',
    source_platform: platform,
    source_url: options.url,
    canonical_url: canonicalUrl,
    platform_id: platformId,
    author: raw.author,
    evidence_file: relativeToRoot(evidenceFile, root),
    evidence_quality: evidence.evidence_quality || (hasStructuredEvidence && !raw.missing_evidence.length ? 'full' : 'partial'),
    evidence_coverage: raw.evidence_coverage,
    missing_evidence: raw.missing_evidence,
    outcome: distilled.outcome || '',
    capability_slots: slots,
    tags: [],
    suggested_tags: distilled.suggested_tags || [],
    works_for: distilled.works_for || [],
    avoid_for: distilled.avoid_for || [],
    confidence: distilled.confidence ?? null,
    content_hash: contentHash,
    created_at: capturedAt,
    updated_at: capturedAt,
  };
  const mapping = slots.length
    ? slots.map(slot => `- \`${slot}\`: ${slot === 'image-generation' ? 'Codex Image Generation (default)' : slot === 'video-generation' ? 'Jimeng CLI → Seedance 2.0/2.5 (approval required)' : 'select by current project capability'}`).join('\n')
    : '_Pending capability mapping._';
  const body = `\n# ${title}\n\n## Outcome\n\n${distilled.outcome || '_Pending._'}\n\n## Evidence coverage\n\n${bullets(raw.evidence_coverage)}\n\nMissing: ${raw.missing_evidence.length ? raw.missing_evidence.join(', ') : 'none recorded'}\n\n## Distilled method\n\n${lines(distilled.steps)}\n\n## Capability mapping\n\n${mapping}\n\n## Success criteria\n\n${bullets(distilled.success_criteria)}\n\n## Failure modes\n\n${bullets(distilled.failure_modes)}\n\n## Prompt recipe\n\n${compactPromptRecipe(distilled.prompt_recipe)}\n\n## Reuse notes\n\n${distilled.reuse_notes || '_Pending review._'}\n\n## Provenance\n\nRaw evidence: [[${relativeToRoot(evidenceFile, root)}]]\n`;
  const note = path.join(root, '00-Inbox', `${id}.md`);
  await writeEntry(note, noteData, body);
  return { id, note, evidenceFile, duplicate: false };
}

function usage() {
  console.log('Usage: tutorial --url <share URL> [--evidence <capture-and-distillation.json>] [--title <title>]');
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  try {
    const result = await ingestTutorial(argsToObject(process.argv.slice(2)));
    console.log(`${result.duplicate ? 'Existing' : 'Created'} workflow: ${result.note}`);
  } catch (error) {
    console.error(error.message);
    usage();
    process.exitCode = 1;
  }
}

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

function bullets(values, fallback = '_尚未确定。_') {
  if (!Array.isArray(values) || !values.length) return fallback;
  return values.map(value => `- ${typeof value === 'string' ? value : JSON.stringify(value)}`).join('\n');
}

function compactPromptRecipe(value) {
  if (!value) return '_尚未提炼。_';
  const text = Array.isArray(value) ? value.join('\n') : String(value);
  if (text.length > 1400) throw new Error('prompt_recipe is too long. Store the original prompt in raw evidence and keep only compact constraints here.');
  return text;
}

function timelineLines(values) {
  if (!Array.isArray(values) || !values.length) return '_没有取得可核对的视频时间线。_';
  return values.map(item => {
    const at = item.timestamp || item.time || '';
    const stage = item.stage || item.title || '视频片段';
    const evidence = item.evidence || item.detail || '';
    return `- ${at ? `**${at}** · ` : ''}**${stage}**${evidence ? ` — ${evidence}` : ''}`;
  }).join('\n');
}

function sourceCommentLines(values) {
  if (!Array.isArray(values) || !values.length) return '_没有取得有效的作者补充。_';
  return values.map(value => `- ${typeof value === 'string' ? value : `${value.author || '评论'}：${value.text || value.detail || ''}`}`).join('\n');
}

function sopLines(values) {
  if (!Array.isArray(values) || !values.length) return '_等待提炼可执行 SOP。_';
  return values.map((value, index) => {
    if (typeof value === 'string') return `${index + 1}. ${value}`;
    const label = value.title || value.action || `步骤 ${index + 1}`;
    const action = value.detail || value.mechanism || '';
    const parts = [
      value.input && `   - 输入：${value.input}`,
      action && `   - 动作：${action}`,
      value.output && `   - 输出：${value.output}`,
      value.checkpoint && `   - 检查点：${value.checkpoint}`,
      value.on_failure && `   - 失败回退：${value.on_failure}`,
    ].filter(Boolean);
    return `${index + 1}. **${label}**\n${parts.join('\n')}`;
  }).join('\n');
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
  const title = options.title || evidence.title || `${platform} 教程`;
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
    media_assets: evidence.media_assets || [],
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
    status: 'active',
    review_status: 'not-required',
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
    media_assets: raw.media_assets,
    cover_asset: raw.media_assets[0] || '',
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
    ? slots.map(slot => `- \`${slot}\`：${slot === 'image-generation' ? 'Codex 图像生成（默认）' : slot === 'video-generation' ? '集梦 CLI → Seedance 2.0/2.5（生成前需要确认）' : '按当前项目能力选择'}`).join('\n')
    : '_等待能力映射。_';
  const visualEvidence = raw.media_assets.length
    ? raw.media_assets.map((asset, index) => `### 关键画面 ${index + 1}\n\n![[${asset}]]`).join('\n\n')
    : '_暂未保存关键帧或轻量效果预览。_';
  const body = `\n# ${title}\n\n## 第一部分：原帖实现信息\n\n### 来源信息\n\n- 平台：${platform}\n- 作者：${raw.author || '未取得'}\n- 原帖：${canonicalUrl}\n- 视频时长：${raw.duration_seconds == null ? '未取得' : `${raw.duration_seconds} 秒`}\n- 抓取方式：${raw.capture_routes.join('、') || '仅分享链接'}\n\n### 原帖正文与明确表达\n\n${raw.page_text || '_没有取得正文。_'}\n\n### 视频逐段记录\n\n${timelineLines(raw.timeline)}\n\n### 作者与评论区补充\n\n${sourceCommentLines(raw.comments)}\n\n### 原帖提及的工具\n\n${bullets(raw.source_tool_mentions)}\n\n### 截图与轻量效果预览\n\n${visualEvidence}\n\n### 证据边界\n\n已取得：\n${bullets(raw.evidence_coverage)}\n\n仍缺少：${raw.missing_evidence.length ? raw.missing_evidence.join('、') : '没有已知缺失项'}\n\n原始长录像只用于首次分析，不进入正式知识库。原始轻量证据：[[${relativeToRoot(evidenceFile, root)}]]\n\n## 第二部分：Workflow SOP\n\n### 目标结果\n\n${distilled.outcome || '_等待补充。_'}\n\n### 开始前准备\n\n${bullets(distilled.prerequisites || distilled.inputs)}\n\n### 执行步骤\n\n${sopLines(distilled.steps)}\n\n### 能力与工具映射\n\n${mapping}\n\n### 最终交付物\n\n${bullets(distilled.deliverables)}\n\n### 总体验收标准\n\n${bullets(distilled.success_criteria)}\n\n### 故障定位与修复\n\n${bullets(distilled.failure_modes)}\n\n### 提示词约束\n\n${compactPromptRecipe(distilled.prompt_recipe)}\n\n### 适用边界\n\n${distilled.reuse_notes || '_尚未提炼。_'}\n`;
  const note = path.join(root, '07-Workflows', `${id}.md`);
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

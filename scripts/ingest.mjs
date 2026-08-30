import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import {
  copyFileSafe,
  ensureDir,
  relativeToRoot,
  slugify,
  timestamp,
  vaultRoot,
  writeEntry,
  writeJson,
} from './lib/vault.mjs';

const PLAYWRIGHT_PATHS = [
  process.env.PLAYWRIGHT_MODULE,
  '/Users/hejuntao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs',
].filter(Boolean);

function argsToObject(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = args[index + 1];
    result[key] = next && !next.startsWith('--') ? args[++index] : true;
  }
  return result;
}

async function loadPlaywright() {
  for (const candidate of PLAYWRIGHT_PATHS) {
    try {
      await fs.access(candidate);
      return await import(pathToFileURL(candidate).href);
    } catch { /* try next */ }
  }
  return null;
}

async function captureUrl(url, assetDir) {
  const result = { errors: [], githubLinks: [], media: [] };
  const playwright = await loadPlaywright();
  if (!playwright) {
    result.errors.push('Playwright is unavailable; URL stored without screenshots.');
    return result;
  }
  const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true, executablePath });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    const desktop = path.join(assetDir, 'desktop.png');
    await page.screenshot({ path: desktop, fullPage: true, animations: 'disabled' });
    result.media.push(desktop);
    const analysis = await page.evaluate(() => {
      const counts = values => Object.entries(values.reduce((acc, value) => {
        if (value) acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {})).sort((a, b) => b[1] - a[1]).slice(0, 18);
      const elements = [...document.querySelectorAll('body *')].slice(0, 700);
      const styles = elements.map(element => getComputedStyle(element));
      const animations = document.getAnimations().slice(0, 80).map(animation => {
        const timing = animation.effect?.getTiming?.() || {};
        return {
          target: animation.effect?.target?.tagName || null,
          duration: timing.duration ?? null,
          delay: timing.delay ?? null,
          easing: timing.easing ?? null,
          iterations: timing.iterations ?? null,
        };
      });
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        fonts: counts(styles.map(style => style.fontFamily)),
        textColors: counts(styles.map(style => style.color)),
        backgrounds: counts(styles.map(style => style.backgroundColor).filter(value => value !== 'rgba(0, 0, 0, 0)')),
        radii: counts(styles.map(style => style.borderRadius).filter(value => value !== '0px')),
        displays: counts(styles.map(style => style.display)),
        githubLinks: [...document.querySelectorAll('a[href*="github.com"]')].map(link => link.href).slice(0, 20),
        animations,
      };
    });
    Object.assign(result, analysis);
    result.githubLinks = analysis.githubLinks || [];
    await context.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobilePage.waitForTimeout(900);
    const mobile = path.join(assetDir, 'mobile.png');
    await mobilePage.screenshot({ path: mobile, fullPage: true, animations: 'disabled' });
    result.media.push(mobile);
    await mobileContext.close();
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    await browser?.close();
  }
  return result;
}

function usage() {
  console.log(`Usage:\n  ingest --url <url> [--title <title>]\n  ingest --image <path> [--title <title>]\n  ingest --video <path> [--title <title>]\n  ingest --github <url> [--title <title>]`);
}

export async function ingest(options, root = vaultRoot()) {
  const input = options.url || options.image || options.video || options.github;
  const sourceType = options.url ? 'url' : options.image ? 'image' : options.video ? 'video' : options.github ? 'github' : null;
  if (!input || !sourceType) throw new Error('Provide one of --url, --image, --video, or --github.');

  const now = timestamp();
  const seed = options.title || (sourceType === 'url' || sourceType === 'github' ? new URL(input).hostname : path.basename(input));
  const id = `ref-${slugify(seed)}-${now.slice(0, 10).replaceAll('-', '')}`;
  const assetDir = path.join(root, '_assets/references', id);
  await ensureDir(assetDir);

  let capture = { errors: [], media: [] };
  if (sourceType === 'url') capture = await captureUrl(input, assetDir);
  if (sourceType === 'image') {
    const destination = path.join(assetDir, path.basename(input));
    await copyFileSafe(path.resolve(input), destination);
    capture.media = [destination];
  }
  if (sourceType === 'video') {
    const localIntakeDir = path.join(root, '.design-memory/intake-media', id);
    const destination = path.join(localIntakeDir, path.basename(input));
    await ensureDir(localIntakeDir);
    await copyFileSafe(path.resolve(input), destination);
    capture.localMedia = [relativeToRoot(destination, root)];
    capture.rawMediaPolicy = 'local-intake-only';
  }

  const title = options.title || capture.title || seed;
  const mediaAssets = (capture.media || []).map(file => relativeToRoot(file, root));
  const coverAsset = mediaAssets[0] || '';
  const captureFile = path.join(assetDir, 'capture.json');
  await writeJson(captureFile, {
    schemaVersion: 1,
    sourceType,
    source: input,
    capturedAt: now,
    ...capture,
    media: mediaAssets,
  });

  const data = {
    id,
    type: 'reference',
    title,
    status: 'inbox',
    review_status: 'pending',
    analysis_status: 'pending',
    source_type: sourceType,
    source_url: sourceType === 'image' || sourceType === 'video' ? '' : input,
    source_file: sourceType === 'image' ? path.resolve(input) : '',
    raw_media_policy: sourceType === 'video' ? 'local-intake-only' : '',
    github_candidates: capture.githubLinks || [],
    cover_asset: coverAsset,
    media_assets: mediaAssets,
    capture_file: relativeToRoot(captureFile, root),
    suggested_tags: [],
    tags: [],
    liked_aspects: [],
    confidence: null,
    created_at: now,
    updated_at: now,
  };
  const embeds = mediaAssets.map(asset => asset.match(/\.(mp4|mov|webm)$/i)
    ? `- Video: [[${asset}]]`
    : `![[${asset}]]`).join('\n\n');
  const emptyEvidence = sourceType === 'video'
    ? '_Raw video is available only in the ignored local intake cache. Retain distilled keyframes/transcript before completing review._'
    : '_No visual capture available yet._';
  const body = `\n# ${title}\n\n## Visual evidence\n\n${embeds || emptyEvidence}\n\n## AI analysis\n\n_Pending Codex analysis._\n\n## Why it works\n\n## Reusable patterns\n\n## Works for\n\n## Avoid for\n\n## Personal notes\n`;
  const note = path.join(root, '00-Inbox', `${id}.md`);
  await writeEntry(note, data, body);
  return { id, note, captureErrors: capture.errors || [] };
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const options = argsToObject(process.argv.slice(2));
  if (options.help) usage();
  else {
    try {
      const result = await ingest(options);
      console.log(`Inbox item created: ${result.note}`);
      for (const error of result.captureErrors) console.warn(`Capture warning: ${error}`);
    } catch (error) {
      console.error(error.message);
      usage();
      process.exitCode = 1;
    }
  }
}

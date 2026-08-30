# AI Design Framework workspace

This outer repository is the reusable system framework. The nested `data/` directory is a separate Git repository and the editable source of truth for the user's personal frontend-aesthetic memory. The user should be able to operate both conversationally and is not expected to know frontend code, scraping tools, schemas, or Git commands.

## Repository boundary

- Framework owns `bin/`, `scripts/`, `review-app/`, `skill-source/`, `_templates/`, `data-template/`, tests, documentation, and CI.
- Data owns all numbered knowledge directories, `_assets/`, `_evidence/`, `_archive/`, `_candidates/`, `_generation/`, `_system/`, `_experiments/`, `.obsidian/`, and its own `AGENTS.md`.
- `data/` is ignored by the outer repository. Never stage, commit, or push Data through the Framework repository, and never copy Framework code into the Data repository.
- `skill-dist/` is a generated local artifact composed from both repositories and is not a source of truth.
- Commands run from the Framework root and default to `data/`. `DESIGN_MEMORY_ROOT` may point to another compatible Data repository.

## Intake requests

When the user asks to save, study, or ingest a website, image, video, GitHub repository, Xiaohongshu link, or other visual reference:

1. Accept the smallest input they provide. Do not ask them to determine whether source code is available.
2. Run `bin/design-memory ingest` with the matching input type. A normal webpage or social link uses `--url`; a repository uses `--github`; local media uses `--image` or `--video`.
3. For a URL, let the intake script attempt desktop and mobile captures and record discoverable GitHub links. If the page is protected or the capture is incomplete, use an available signed-in browser session when possible. Ask for screenshots only when no adequate visual evidence can be obtained.
4. Inspect the captured image or video itself. Do not make an aesthetic judgment from text alone. Raw video is intake-only: keep it under the ignored `data/.design-memory/intake-media/` cache, never in Data Git history. Before review is completed, retain only lightweight keyframes, transcript/subtitle evidence, and distilled notes in the formal Data repository.
5. Update the new Inbox note with a compact design analysis and controlled `suggested_tags` from `_system/taxonomy.json`. Cover:
   - page type and primary user task;
   - visual style and overall tone;
   - composition, hierarchy, typography, color, components, and motion when visible;
   - why the design works;
   - plausible reusable patterns;
   - `works_for` and `avoid_for` contexts;
   - confidence and any missing evidence.
6. Keep the item in `00-Inbox`. The user makes the aesthetic decision in the visual review page. Never promote an item merely because the analysis is positive.

## Tutorial intake

For Xiaohongshu, Douyin, and Bilibili tutorials, run `bin/design-memory tutorial --url <share-url>` and provide structured evidence when browser or local extraction produced richer evidence. Fuse page text, subtitles/transcript, timed keyframes/OCR, and useful author comments when available. Record missing evidence explicitly.

Every completed tutorial intake is written directly to `07-Workflows` as one two-part Chinese note; it does not use an Inbox approval, Playbook promotion, or Recipe promotion path:

1. **原帖实现信息** — preserve source metadata, faithful page/post information, timestamped video observations, useful author replies, source tool mentions, 3–6 keyframes, an optional lightweight preview, and explicit missing evidence. Clearly separate observed source facts from inference. Do not copy a long source prompt or full transcript verbatim.
2. **Workflow SOP** — produce prerequisites, inputs, numbered actions, outputs, a checkpoint and failure rollback for every step, capability/tool mapping, deliverables, final acceptance criteria, failure repair, and applicability boundaries.

Write all user-facing tutorial prose in Simplified Chinese. Keep stable machine identifiers, capability slots, and controlled taxonomy tags in English. Raw long recordings stay in the ignored local intake cache. A curated preview may be committed under `_assets/tutorials` only when it is 3–8 seconds, no more than 5 MB, muted when audio is not essential, and useful for understanding motion. Prefer WebM/MP4 or animated WebP; use GIF only for tiny simple loops.

Default `image-generation` to Codex Image Generation. Default `video-generation` to the official Jimeng CLI with Seedance 2.0 or 2.5. Before every video submission, show the exact single-output proposal and ask for explicit confirmation. One confirmation authorizes one task and one output; batching, automatic variants, and approval reuse are forbidden. Every retry or material change requires confirmation again. Polling, downloading, and QA after submission do not. Never store credentials or session material in the vault, Git, GitHub, proposals, or logs.

Do not reproduce every saved site. A screenshot plus compact analysis is sufficient for an initial Reference. A raw screen recording or downloaded source video is not a knowledge artifact and must not be committed.

## Source-code handling

- Determine code availability yourself; do not ask the user to inspect source code.
- A public page's delivered HTML/CSS/JS is implementation evidence, not permission to copy proprietary source.
- When a real open-source repository is found, record repository URL, exact commit, relevant file paths, and license.
- Extract only high-value decisions: tokens, layout rules, component behavior, motion parameters, and small focused snippets when licensing permits. Do not archive a whole dependency tree or long generated bundles.
- Create a reusable Recipe only after an implementation has been used and visually accepted in a real project.

## Review and distillation

- `bin/design-memory start` opens the visual-first review queue.
- A liked Inbox item becomes a Reference; it does not become a Pattern automatically.
- Propose a Pattern only when at least two approved References support the same rule, or when one Reference plus one accepted project result provides strong evidence.
- Pattern promotion and project-feedback absorption require visual evidence and explicit user confirmation.
- When mature knowledge changes, run `bin/design-memory build` so the published Skill stays synchronized with the Obsidian/GitHub source.

## Project feedback

The published `personal-design` Skill is read-only inside other projects. Import confirmed project feedback with `bin/design-memory import-feedback <project-path>`, place it in the visual feedback queue, and let the user classify it as project-only, general preference, or implementation mismatch. Do not directly rewrite Personal DNA from a single project comment.

## Communication

Speak in visual and product language. Show images or video whenever asking for an aesthetic decision. Avoid presenting raw code as the evidence the user must judge. Ask a question only when missing information would materially change the capture or classification.

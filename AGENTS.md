# Personal Design Memory workspace

This repository is the editable source of truth for the user's personal frontend-aesthetic memory. The user should be able to operate it conversationally and is not expected to know frontend code, scraping tools, schemas, or Git commands.

## Intake requests

When the user asks to save, study, or ingest a website, image, video, GitHub repository, Xiaohongshu link, or other visual reference:

1. Accept the smallest input they provide. Do not ask them to determine whether source code is available.
2. Run `bin/design-memory ingest` with the matching input type. A normal webpage or social link uses `--url`; a repository uses `--github`; local media uses `--image` or `--video`.
3. For a URL, let the intake script attempt desktop and mobile captures and record discoverable GitHub links. If the page is protected or the capture is incomplete, use an available signed-in browser session when possible. Ask for screenshots only when no adequate visual evidence can be obtained.
4. Inspect the captured image or video itself. Do not make an aesthetic judgment from text alone.
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

For Xiaohongshu, Douyin, and Bilibili tutorials, run `bin/design-memory tutorial --url <share-url>` and provide a structured evidence file when browser or local extraction produced richer evidence. Fuse page text, subtitles/transcript, timed keyframes/OCR, and useful author comments when available. Record missing evidence explicitly.

Keep raw text, transcripts, comments, source prompts, and source tool names in `_evidence/tutorials`; do not publish them into the Personal Design Skill. The Workflow note must retain only the demonstrated order, mechanism, inputs/outputs, success criteria, failure modes, compact prompt constraints, and capability slots. Never copy a long example prompt verbatim.

A confirmed tutorial becomes a Workflow in `07-Workflows`. A reviewed tool-agnostic generalization becomes a Playbook in `08-Playbooks`. Neither is a Recipe until it has been implemented and visually accepted in a real project.

Default `image-generation` to Codex Image Generation. Default `video-generation` to the official Jimeng CLI with Seedance 2.0 or 2.5. Before every video submission, show the exact single-output proposal and ask for explicit confirmation. One confirmation authorizes one task and one output; batching, automatic variants, and approval reuse are forbidden. Every retry or material change requires confirmation again. Polling, downloading, and QA after submission do not. Never store credentials or session material in the vault, Git, GitHub, proposals, or logs.

Do not reproduce every saved site. A screenshot plus compact analysis is sufficient for an initial Reference.

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

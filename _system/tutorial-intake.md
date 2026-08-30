# Tutorial intake routes

The intake accepts the smallest input: a Xiaohongshu, Douyin, or Bilibili share link. Codex chooses the richest available route and records what is missing instead of silently filling gaps.

1. **Platform route** — resolve the share link, collect page text and native subtitles when exposed, and identify the platform item ID.
2. **Signed-browser route** — use the available signed-in browser for protected page text, visible comments, video inspection, and canonical URL resolution.
3. **Local-media route** — when a local video or screen recording is available, extract transcript, interval frames plus scene-change frames, timestamped OCR, and technical metadata.
4. **Partial-evidence route** — create a reviewable Workflow candidate with explicit missing evidence and reduced confidence. Partial capture never blocks intake, but it blocks claims of complete coverage.

Evidence fusion keeps source and time: page text, subtitle/transcript, frame/OCR timeline, and useful author clarifications remain separate in `_evidence/tutorials`. The published Workflow receives only the distilled sequence and checks.

Platform identity and canonical URL are preferred dedupe keys; content hash is the fallback. Raw media is not copied into the published Skill.

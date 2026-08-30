# Tutorial workflow reuse

## Read the two parts correctly

- `原帖实现信息` preserves what the post, video frames, and author replies actually showed. It defines provenance and uncertainty.
- `Workflow SOP` converts that evidence into an executable sequence with inputs, outputs, checkpoints, rollback, deliverables, and final acceptance criteria.
- Tutorials are stored directly as Workflow SOPs. There is no Inbox approval or promotion step for this path.

## Apply a Workflow

1. Match the desired outcome, interaction mechanism, and `works_for` constraints.
2. Check evidence quality and missing evidence. State uncertainty when the source was only partially captured.
3. Preserve dependency order and success checks, but map capability slots to current tools.
4. Convert prompt recipes into compact constraints. Never reproduce long source prompts verbatim.
5. Verify the generated assets before coding the interaction. Asset continuity and motion quality may be the dominant risk.
6. Implement the smallest interaction mechanism that reproduces the behavior, then render and test it.
7. Keep project-specific changes in the project. Update the central SOP only when new evidence materially improves its steps, checks, or failure recovery.

## Default capability mapping

- `image-generation` → Codex Image Generation.
- `video-generation` → official Jimeng CLI using Seedance 2.0 or 2.5, subject to the video approval gate.
- `frontend-generation` → the current coding agent and project stack.
- `video-transcription`, `keyframe-extraction`, and `ocr` → available local or platform adapters; preserve timestamps and evidence source.

# Tutorial workflow reuse

## Read the layers correctly

- Source Evidence proves what was visible and preserves provenance. Do not retrieve it by default.
- Workflow preserves a demonstrated sequence and the conditions under which it worked.
- Playbook removes source-platform and vendor assumptions so the method can travel across projects.
- Recipe is the local implementation only after a real project result is visually accepted.

## Apply a Workflow

1. Match the desired outcome, interaction mechanism, and `works_for` constraints.
2. Check evidence quality and missing evidence. State uncertainty when the source was only partially captured.
3. Preserve dependency order and success checks, but map capability slots to current tools.
4. Convert prompt recipes into compact constraints. Never reproduce long source prompts verbatim.
5. Verify the generated assets before coding the interaction. Asset continuity and motion quality may be the dominant risk.
6. Implement the smallest interaction mechanism that reproduces the behavior, then render and test it.
7. If the result is accepted in a real project, record it as Recipe evidence. Do not silently promote the Workflow itself.

## Default capability mapping

- `image-generation` → Codex Image Generation.
- `video-generation` → official Jimeng CLI using Seedance 2.0 or 2.5, subject to the video approval gate.
- `frontend-generation` → the current coding agent and project stack.
- `video-transcription`, `keyframe-extraction`, and `ocr` → available local or platform adapters; preserve timestamps and evidence source.

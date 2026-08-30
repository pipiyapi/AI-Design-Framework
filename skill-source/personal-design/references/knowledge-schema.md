# Knowledge schema

## Knowledge graph

- `source-evidence`: internal raw page text, transcript, timeline, OCR, frames, comments, and provenance. Never loaded during ordinary project retrieval.
- `workflow`: a source-derived, externally demonstrated sequence with evidence coverage and confidence.
- `reference`: one visually approved website or page. Code is optional.
- `project`: a real implementation that has been visually accepted; it owns the reproducible source snapshot and acceptance evidence.
- `pattern`: a reusable design rule supported by References and accepted Projects.
- `recipe`: an implementation extracted from an accepted Project and linked to exact source files.
- `principle`: a stable rule supported across patterns and projects.
- `personal-dna`: confirmed preferences, exceptions, and anti-patterns.

## Important fields

- `tags`: controlled descriptive vocabulary.
- `works_for`: contexts where the knowledge has evidence of fit.
- `avoid_for`: contexts where it failed or is predictably unsuitable.
- `source_references` and `source_workflows`: inputs used by a Project.
- `source_project`: the accepted implementation behind a Recipe.
- `applied_in`, `validated_by`, `produced_recipes`, `produced_patterns`, `related_recipes`, and `related_patterns`: graph links generated into `_system/relationships.json`.
- `preference_score`: personal affinity, not universal quality.
- `status`: maturity and review state.
- `capability_slots`: replace source tool names with roles such as image generation, video generation, OCR, or frontend generation.
- `evidence_quality` and `missing_evidence`: prevent partial captures from masquerading as complete tutorials.

There is no promotion ladder. A visually accepted Project may directly support a Recipe or Pattern. Personal DNA still requires explicit or repeated user evidence.

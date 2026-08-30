# Knowledge schema

## Maturity ladder

- `source-evidence`: internal raw page text, transcript, timeline, OCR, frames, comments, and provenance. Never loaded during ordinary project retrieval.
- `workflow`: a source-derived, externally demonstrated sequence with evidence coverage and confidence.
- `playbook`: a reviewed, tool-agnostic method generalized from one or more Workflows.
- `reference`: one visually approved website or page. Code is optional.
- `pattern`: a reusable design rule supported by multiple references and approved visually.
- `recipe`: an implementation verified in a real project with visual evidence.
- `principle`: a stable rule supported across patterns and projects.
- `personal-dna`: confirmed preferences, exceptions, and anti-patterns.

## Important fields

- `tags`: controlled descriptive vocabulary.
- `works_for`: contexts where the knowledge has evidence of fit.
- `avoid_for`: contexts where it failed or is predictably unsuitable.
- `source_references`: evidence behind a Pattern.
- `source_pattern` and `source_project`: provenance behind a Recipe.
- `preference_score`: personal affinity, not universal quality.
- `status`: maturity and review state.
- `capability_slots`: replace source tool names with roles such as image generation, video generation, OCR, or frontend generation.
- `evidence_quality` and `missing_evidence`: prevent partial captures from masquerading as complete tutorials.

One project result may update applicability evidence, but must not directly become Personal DNA without central review.

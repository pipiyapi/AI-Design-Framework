---
name: personal-design
description: Use a curated personal visual-design memory when designing, implementing, or reviewing frontend websites and interfaces. Also use it to record project-specific design feedback for later review. Do not use it for backend-only work or generic code tasks without a visual-design decision.
---

# Personal Design Memory

Use the published knowledge as read-only guidance. The Obsidian/GitHub knowledge repository is the only editable source of truth; never modify this installed Skill from a project.

## Design or implementation

1. Convert the request into a compact project profile: page type, audience, primary tasks, content density, desired tone, devices, technical stack, and explicit avoidances.
2. Run `scripts/query-memory.mjs` with the profile terms. Read only the returned Pattern, Recipe, Principle, and Personal DNA files. Do not load the entire catalog or knowledge folder.
3. Prefer validated Patterns. Use a Recipe only when its `works_for` conditions fit and its `avoid_for` conditions do not conflict. A visual Reference is evidence, not a template.
4. Before coding, state a short Design Provenance mapping the intended decisions to knowledge IDs. Explain why each item fits this project and name any attractive but incompatible item you rejected.
5. Adapt knowledge to the current product and stack. Do not clone a reference site or force a Recipe into an unsuitable context.
6. Render the result and judge the actual page or animation. Code inspection alone cannot verify an aesthetic result.

Read [references/retrieval-workflow.md](references/retrieval-workflow.md) when selecting knowledge for a project. Read [references/knowledge-schema.md](references/knowledge-schema.md) when interpreting fields or maturity levels.

## Feedback during a real project

Treat statements such as “too busy,” “keep the previous version,” “I like this source panel,” or “the animation does not feel like the reference” as provisional feedback.

- Do not interrupt after every comment and do not silently rewrite Personal DNA.
- At a meaningful milestone, compare the relevant before/after visuals and classify the feedback as `project-only`, `general-preference`, or `implementation-mismatch`.
- Ask for confirmation before external sync or GitHub mutation.
- After confirmation, run `scripts/write-feedback.mjs` to create a project-local `.design-memory/outbox` bundle. The central repository imports and reviews that bundle later.

Read [references/feedback-workflow.md](references/feedback-workflow.md) before writing a feedback bundle.

## Boundaries

- Do not reproduce every newly saved website. References and Patterns normally remain code-free.
- Create a reusable Recipe only after a real project implementation is visually accepted.
- Never copy closed-source production code. For open-source material, preserve repository, commit, path, and license provenance.
- Never push directly to the knowledge repository's main branch. Project feedback is a candidate, not established knowledge.

# Retrieval workflow

## Project profile

Describe the current project with these facets when known:

- page type and user task
- audience and product domain
- content density
- visual tone
- desktop/mobile priority
- interaction and motion needs
- performance and accessibility constraints
- explicit dislikes or banned treatments

## Query and selection

Run:

```text
node scripts/query-memory.mjs --query "knowledge-base editorial high-density source verification" --limit 8
```

Use hard constraints before aesthetic similarity. Reject knowledge when `avoid_for` conflicts with the current project even if the screenshot looks attractive.

Load in this order:

1. Personal DNA and anti-patterns relevant to the brief.
2. Validated Patterns matching the product and task.
3. Verified Recipes matching the stack and context.
4. A small number of source References only when visual evidence is needed.

## Required provenance

Before implementation, provide a compact mapping such as:

```text
Answer layout      <- pattern-editorial-answer
Source inspection  <- pattern-source-panel
Motion restraint   <- dna-preferences
```

If no relevant knowledge is found, say so. Do not pretend the Skill contained a recommendation.

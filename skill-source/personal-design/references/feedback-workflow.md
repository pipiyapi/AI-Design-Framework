# Feedback workflow

## Capture only design-relevant evidence

Record:

- project name and type
- Skill version and source commit when available
- Pattern or Recipe IDs retrieved
- which items were used, changed, or rejected
- the user's explicit design feedback
- before and after screenshots or a short motion preview
- the proposed feedback classification

Do not export the full conversation or the whole project repository.

## Classification

- `project-only`: the design can remain useful, but not for this context.
- `general-preference`: the user indicates a stable preference across contexts. This remains a candidate until centrally reviewed.
- `implementation-mismatch`: the source Pattern remains liked; the implementation or Recipe failed to reproduce it.

## Write the outbox bundle

```text
node scripts/write-feedback.mjs \
  --project "Enterprise Knowledge Base" \
  --project-type knowledge-base \
  --pattern pattern-editorial-answer \
  --result rejected \
  --classification project-only \
  --note "The animation is too prominent for dense enterprise reading." \
  --before before.png \
  --after after.png
```

The command writes only to the current project's `.design-memory/outbox`. Central import, review, and GitHub merge happen separately.

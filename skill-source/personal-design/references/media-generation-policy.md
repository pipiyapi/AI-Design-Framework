# Media generation policy

## Images

Use Codex Image Generation by default. Image generation does not need an additional confirmation unless the user separately requests one.

## Videos: mandatory one-output approval gate

Use the official Jimeng CLI installed from `https://jimeng.jianying.com/ai-tool/install`. Never install it, log in, or transmit credentials without the permissions required by the current environment.

Before each paid video submission, show the user:

- goal and reference assets;
- exact model (`seedance-2.0` or `seedance-2.5`) and why;
- duration, aspect ratio, resolution, and audio choice;
- distilled motion constraints and avoidances;
- estimated point cost when the tool exposes it, otherwise say it is unknown and must be checked;
- an explicit statement that approval authorizes exactly one task and one output.

Submit only after the user explicitly approves that exact proposal. Do not batch, request automatic variations, or reuse approval. A retry, regenerated clip, changed reference, model, duration, ratio, resolution, audio choice, or material prompt change requires a new proposal and confirmation.

Once a task has been submitted, polling status, downloading that result, and visual quality review do not require a new confirmation. Never store API keys, login tokens, cookies, or session material in project files, the knowledge vault, Git, GitHub, proposals, or logs.

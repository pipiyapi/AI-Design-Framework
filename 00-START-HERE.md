---
type: guide
version: 0.2.0
---

# Personal Design Memory V1

这个 Vault 是个人前端审美知识库的唯一主源。

## 最短使用路径

1. 运行 `bin/design-memory ingest --url <网址>`，或传入 `--image`、`--video`、`--github`。
   小红书、抖音或 B 站教程使用 `bin/design-memory tutorial --url <分享链接>`；Codex 会在可用时补充登录态浏览器证据，并把提炼结果送入“教程工作流”队列。
2. 运行 `bin/design-memory start`，在视觉审核页中选择“保留 / 暂不确定 / 不喜欢”。
3. 喜欢的案例自动进入 `01-References`。
4. 运行 `bin/design-memory build`，重建检索索引和 Personal Design Skill。
5. 真实项目通过 Skill 查询成熟 Pattern；项目反馈写入 `.design-memory/outbox`。
6. 用 `bin/design-memory import-feedback <项目路径>` 将反馈带回 `06-Projects/Feedback-Inbox`。

当前整个 `AI-Design` 文件夹就是 Obsidian Vault。用 Obsidian 的“打开本地仓库”选择这个文件夹即可。

## GitHub 连接

V1 已准备好 Git 结构和自动验证，但不会替你猜测远程仓库。创建或选定 GitHub 仓库后：

1. 把仓库地址填入 `_system/settings.json` 的 `repositoryUrl`。
2. 给本地仓库添加同一个远程地址。
3. 首次推送 `main`；之后知识库、索引和发布版 Skill 会一起同步。

项目中的 Skill 不直接改中央知识库。项目反馈先写入项目自己的 `.design-memory/outbox`，再由中央仓库导入、可视化确认和吸收。

## V1 原则

- 不在入库时复刻每个网站。
- 图片和视频是审美确认的第一证据。
- 项目中的 Skill 只读，不直接修改中央知识库。
- 反馈先进入 Inbox，确认后再影响 Pattern、Recipe 和 Personal DNA。
- 教程原始证据不参与普通检索；Workflow 记录跑通过的顺序，Playbook 记录工具无关方法，Recipe 只记录本地验证成功的实现。
- 图片默认由 Codex Image Generation 生成；视频默认通过集梦 CLI 调用 Seedance 2.0/2.5，并且每次提交前必须逐条确认，禁止批量生成。
- GitHub `main` 是远程主版本；项目反馈通过独立分支或 Pull Request 回流。

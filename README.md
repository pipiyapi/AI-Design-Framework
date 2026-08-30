# AI Design Framework

个人前端设计知识库的可复用框架。它包含采集与提炼脚本、Workflow / Playbook / Recipe 成熟度模型、视觉审核页、Personal Design Skill 源文件、测试和一份空白数据蓝图；不包含任何个人知识内容。

本地采用两个完全独立的 Git 仓库：

```text
AI-Design/                 # pipiyapi/AI-Design-Framework
├── bin, scripts, review-app, skill-source, tests
├── data-template/         # 空白数据蓝图
└── data/                  # pipiyapi/AI-Design-Data（独立 Git，外层忽略）
```

日常仍在 `AI-Design` 根目录运行：

```text
bin/design-memory start
bin/design-memory ingest --url <url>
bin/design-memory tutorial --url <share-url>
bin/design-memory build
```

脚本默认读取 `data/`。如需挂载另一份兼容数据仓库，设置 `DESIGN_MEMORY_ROOT`。Obsidian 应打开 `data/`，而不是 Framework 根目录。

## 新建一份空数据仓库

```text
bin/design-memory bootstrap --root <directory>
```

该命令只补齐缺失文件，不覆盖已有知识。恢复现有双仓库请阅读 [RESTORE.md](RESTORE.md)。

## 数据边界

Framework 只保存能力和空白蓝图。Reference、Workflow、Playbook、Recipe、Personal DNA、项目反馈、轻量截图/关键帧、提炼后的证据、catalog 和 Obsidian 配置只属于 Data。原始录像只进入 Data 内被 Git 忽略的 `.design-memory/intake-media/` 临时区，不属于正式知识库。`skill-dist/` 是两层组合后的可再生产物，不进入任一仓库历史。

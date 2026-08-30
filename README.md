# AI Design Framework

个人前端设计知识库的可复用框架。核心模型是“来源—项目—验证—复用”：Reference 与 Workflow 提供来源，Accepted Project 保存真实结果和可复现源码，Recipe 保存经过验收的实现方法，Pattern 与 Personal DNA 保存被项目证实的规律和偏好。

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

Framework 只保存能力和空白蓝图。Reference、Workflow、Accepted Project、Recipe、Pattern、Personal DNA、项目反馈、轻量截图/关键帧、提炼后的证据、catalog、relationships 和 Obsidian 配置只属于 Data。原始录像只进入 Data 内被 Git 忽略的 `.design-memory/intake-media/` 临时区，不属于正式知识库。`skill-dist/` 是两层组合后的可再生产物，不进入任一仓库历史。

三大视频平台教程采用直接路径：一个条目同时包含“原帖实现信息”和“Workflow SOP”，完成采集后直接进入 `07-Workflows`，不需要 Inbox 审批或晋升。只有当某个方法在真实项目中实现并通过视觉验收后，项目本身才能产出 Recipe。

## 五类核心知识

- `Reference`：看过什么、喜欢什么。
- `Workflow`：外部教程已经跑通的方法顺序。
- `Project`：自己真正做出来并确认接受的结果。
- `Recipe`：从成功项目源码中提炼的可复用实现。
- `Personal DNA`：经过重复反馈或明确确认的长期偏好。

`Pattern` 用于跨来源和项目成立的设计规律，不是必经晋升级别。Catalog 构建时会同步生成 `_system/relationships.json`，记录这些知识之间的来源、应用和验证关系。

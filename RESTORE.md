# Restore AI Design

## 恢复现有知识库

```text
git clone https://github.com/pipiyapi/AI-Design-Framework.git AI-Design
git clone https://github.com/pipiyapi/AI-Design-Data.git AI-Design/data
cd AI-Design
bin/design-memory test
bin/design-memory build
bin/design-memory start
```

在 Obsidian 中打开 `AI-Design/data`。Framework 与 Data 各自提交和推送，禁止从外层仓库暂存 `data/`。

## 创建全新的空知识库

克隆 Framework 后运行：

```text
bin/design-memory bootstrap --root data
```

随后在 `data/` 单独执行 Git 初始化并连接自己的数据仓库。Bootstrap 只复制空白目录、默认 taxonomy、设置和数据侧操作规则，不会生成示例知识。

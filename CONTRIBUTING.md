# Contributing / 贡献指南

欢迎贡献目录解释规则、界面改进和扫描体验优化。

## 开发

```powershell
npm install
npm run server
npm run dev
```

提交前请运行：

```powershell
npm run check
npm run build
```

## 新增目录说明规则

目录说明规则位于：

```text
src/shared/explain.ts
```

新增规则时请包含：

- 匹配路径的正则
- 简短标签
- 风险等级：`safe`、`caution`、`danger` 或 `info`
- 一句话说明

风险等级建议：

- `safe`：缓存或临时数据，通常可清理
- `caution`：用户数据、软件数据、模型缓存，需要确认
- `danger`：系统关键目录或虚拟磁盘，不应手动删除
- `info`：链接、受保护目录或普通说明

## 设计原则

- 默认只读。
- 不加入静默清理。
- 不上传扫描结果。
- 遇到无权限目录时不中断扫描。
- 不递归统计目录联接或符号链接。

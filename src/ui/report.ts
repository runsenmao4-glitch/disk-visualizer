import type { ScanNode, ScanResponse } from "../shared/types";
import { formatBytes, formatPercent } from "./format";

const riskTitle = {
  safe: "通常可清理",
  caution: "需要谨慎",
  danger: "不要手动处理",
  info: "说明"
} as const;

export function downloadJsonReport(scan: ScanResponse): void {
  const payload = JSON.stringify(scan, null, 2);
  downloadBlob(payload, "application/json;charset=utf-8", `disk-report-${timestamp()}.json`);
}

export function downloadHtmlReport(scan: ScanResponse): void {
  const html = buildHtmlReport(scan);
  downloadBlob(html, "text/html;charset=utf-8", `disk-report-${timestamp()}.html`);
}

function buildHtmlReport(scan: ScanResponse): string {
  const nodes = flatten(scan.root).sort((a, b) => b.size - a.size);
  const topNodes = nodes.slice(0, 30);
  const riskGroups = groupByRisk(nodes);
  const scannedAt = new Date(scan.root.scannedAt).toLocaleString();

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>磁盘空间报告 - ${escapeHtml(scan.root.path)}</title>
  <style>
    body{margin:0;background:#f6f7f3;color:#202923;font-family:"Segoe UI","Microsoft YaHei",system-ui,sans-serif;line-height:1.6}
    main{max-width:1120px;margin:0 auto;padding:32px 18px 48px}
    h1,h2,h3,p{margin-top:0} h1{font-size:32px;margin-bottom:8px} h2{font-size:22px;margin:28px 0 12px}
    .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:22px 0}
    .card{background:#fff;border:1px solid #dfe6dc;border-radius:10px;padding:16px;box-shadow:0 10px 24px rgba(45,61,49,.06)}
    .card span{display:block;color:#718076;font-size:13px}.card strong{font-size:24px}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dfe6dc;border-radius:10px;overflow:hidden}
    th,td{padding:10px 12px;border-bottom:1px solid #edf1eb;text-align:left;vertical-align:top}
    th{background:#eef3eb;color:#415148;font-size:13px}td:last-child,th:last-child{text-align:right}
    tr:last-child td{border-bottom:0}.path{color:#6d7a70;font-size:12px;word-break:break-all}
    .pill{display:inline-block;border-radius:999px;padding:3px 8px;font-size:12px;font-weight:700}
    .safe{background:#cfe8db;color:#24513f}.caution{background:#f2dfb8;color:#6b4d12}.danger{background:#ecc8c0;color:#742e25}.info{background:#dce5ef;color:#334f68}
    .note{background:#fff8e8;border:1px solid #ead8ab;border-radius:10px;padding:14px;color:#5e5542}
    .group{display:grid;gap:10px}.item{background:#fff;border:1px solid #e4e9e1;border-radius:10px;padding:12px}
    .item h3{margin:0 0 4px;font-size:16px}.muted{color:#667569}
  </style>
</head>
<body>
  <main>
    <h1>磁盘空间报告</h1>
    <p class="muted">扫描路径：${escapeHtml(scan.root.path)} · 扫描时间：${escapeHtml(scannedAt)} · 耗时：${scan.durationMs} ms</p>
    <section class="summary">
      <div class="card"><span>已统计大小</span><strong>${formatBytes(scan.root.size)}</strong></div>
      <div class="card"><span>文件数</span><strong>${scan.root.fileCount}</strong></div>
      <div class="card"><span>Top 1</span><strong>${escapeHtml(topNodes[0]?.name ?? "-")}</strong></div>
      <div class="card"><span>风险提示项</span><strong>${riskGroups.danger.length + riskGroups.caution.length}</strong></div>
    </section>
    <section class="note">
      这是一份只读扫描报告，不代表自动清理建议。红色项目不要手动删除；黄色项目请先确认用途、同步状态或卸载方式；绿色项目通常是缓存或临时数据，但仍建议通过对应软件或系统工具清理。
    </section>

    <h2>占用排行榜</h2>
    <table>
      <thead><tr><th>#</th><th>名称与路径</th><th>说明</th><th>大小</th><th>占比</th></tr></thead>
      <tbody>
        ${topNodes.map((node, index) => renderTopRow(node, index + 1, scan.root.size)).join("")}
      </tbody>
    </table>

    <h2>需要注意的项目</h2>
    ${renderRiskGroup("不要手动处理", riskGroups.danger)}
    ${renderRiskGroup("需要谨慎", riskGroups.caution)}
    ${renderRiskGroup("通常可清理", riskGroups.safe)}
  </main>
</body>
</html>`;
}

function renderTopRow(node: ScanNode, index: number, rootSize: number): string {
  const percent = rootSize > 0 ? (node.size / rootSize) * 100 : 0;
  return `<tr>
    <td>${index}</td>
    <td><strong>${escapeHtml(node.name)}</strong><div class="path">${escapeHtml(node.path)}</div></td>
    <td><span class="pill ${node.explanation.risk}">${escapeHtml(riskTitle[node.explanation.risk])}</span><div>${escapeHtml(node.explanation.label)}</div></td>
    <td>${formatBytes(node.size)}</td>
    <td>${formatPercent(percent)}</td>
  </tr>`;
}

function renderRiskGroup(title: string, nodes: ScanNode[]): string {
  const visible = nodes.slice(0, 12);
  if (visible.length === 0) {
    return `<p class="muted">${escapeHtml(title)}：暂无匹配项目。</p>`;
  }

  return `<h3>${escapeHtml(title)}</h3><div class="group">${visible
    .map(
      (node) => `<div class="item">
        <h3>${escapeHtml(node.name)} · ${formatBytes(node.size)}</h3>
        <div class="path">${escapeHtml(node.path)}</div>
        <p>${escapeHtml(node.explanation.description)}</p>
      </div>`
    )
    .join("")}</div>`;
}

function groupByRisk(nodes: ScanNode[]) {
  return {
    safe: nodes.filter((node) => node.explanation.risk === "safe"),
    caution: nodes.filter((node) => node.explanation.risk === "caution"),
    danger: nodes.filter((node) => node.explanation.risk === "danger"),
    info: nodes.filter((node) => node.explanation.risk === "info")
  };
}

function flatten(root: ScanNode): ScanNode[] {
  const nodes: ScanNode[] = [];
  const visit = (node: ScanNode) => {
    nodes.push(node);
    node.children?.forEach(visit);
  };
  visit(root);
  return nodes;
}

function downloadBlob(content: string, type: string, filename: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return replacements[char] ?? char;
  });
}

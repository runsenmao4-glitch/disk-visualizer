import { AlertTriangle, Download, FolderOpen, HardDrive, Info, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DriveInfo, RiskLevel, ScanNode, ScanResponse } from "../shared/types";
import { fetchDrives, scanPath } from "./api";
import { formatBytes, formatPercent, shortPath } from "./format";
import { downloadHtmlReport, downloadJsonReport } from "./report";
import { layoutTreemap } from "./treemap";

const riskText: Record<RiskLevel, string> = {
  safe: "可清理",
  caution: "谨慎",
  danger: "不要手动动",
  info: "说明"
};

export function App() {
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<DriveInfo | null>(null);
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<ScanNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrives()
      .then((items) => {
        setDrives(items);
        setSelectedDrive(items[0] ?? null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "读取盘符失败"));
  }, []);

  async function runScan(path: string, depth = 2) {
    setLoading(true);
    setError(null);
    try {
      const result = await scanPath(path, depth);
      setScan(result);
      setSelectedNode(result.root);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "扫描失败");
    } finally {
      setLoading(false);
    }
  }

  const currentDrive = selectedDrive;
  const ranking = useMemo(() => flatten(scan?.root).sort((a, b) => b.size - a.size).slice(0, 18), [scan]);
  const treemapChildren = scan?.root.children ?? [];

  function exportReport() {
    if (!scan) {
      return;
    }
    downloadHtmlReport(scan);
  }

  function exportJsonReport() {
    if (!scan) {
      return;
    }
    downloadJsonReport(scan);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">本地只读扫描</p>
          <h1>磁盘空间观察台</h1>
        </div>
        <div className="top-actions">
          <button className="icon-button" onClick={() => currentDrive && runScan(currentDrive.root)} disabled={!currentDrive || loading} title="重新扫描">
            {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          </button>
          <button className="soft-button" onClick={exportReport} disabled={!scan}>
            <Download size={16} />
            导出HTML报告
          </button>
          <button className="soft-button compact-action" onClick={exportJsonReport} disabled={!scan} title="导出原始 JSON 数据">
            JSON
          </button>
        </div>
      </header>

      <section className="drive-grid">
        {drives.map((drive) => {
          const usedPercent = drive.total > 0 ? (drive.used / drive.total) * 100 : 0;
          const active = selectedDrive?.root === drive.root;
          return (
            <button
              className={`drive-card ${active ? "active" : ""}`}
              key={drive.root}
              onClick={() => {
                setSelectedDrive(drive);
                setScan(null);
                setSelectedNode(null);
              }}
            >
              <div className="drive-title">
                <HardDrive size={19} />
                <strong>{drive.name} 盘</strong>
                <span>{drive.root}</span>
              </div>
              <div className="meter" aria-hidden="true">
                <span style={{ width: `${usedPercent}%` }} />
              </div>
              <div className="drive-meta">
                <span>已用 {formatBytes(drive.used)}</span>
                <span>剩余 {formatBytes(drive.free)}</span>
              </div>
            </button>
          );
        })}
      </section>

      <section className="scan-strip">
        <div>
          <strong>{currentDrive ? `${currentDrive.name} 盘` : "选择一个盘符"}</strong>
          <span>{scan ? `扫描耗时 ${scan.durationMs} ms · ${new Date(scan.root.scannedAt).toLocaleString()}` : "点击扫描后显示目录占用"}</span>
        </div>
        <button className="primary-button" onClick={() => currentDrive && runScan(currentDrive.root)} disabled={!currentDrive || loading}>
          {loading ? <Loader2 className="spin" size={17} /> : <FolderOpen size={17} />}
          {loading ? "扫描中" : "扫描所选盘"}
        </button>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="workspace">
        <section className="panel visual-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Treemap</p>
              <h2>空间块视图</h2>
            </div>
            <span>{scan ? formatBytes(scan.root.size) : "尚未扫描"}</span>
          </div>
          <Treemap nodes={treemapChildren} total={scan?.root.size ?? 0} onSelect={setSelectedNode} onDeepScan={(node) => runScan(node.path, 2)} />
        </section>

        <aside className="panel detail-panel">
          <NodeDetail node={selectedNode} rootSize={scan?.root.size ?? 0} onDeepScan={(node) => runScan(node.path, 2)} />
        </aside>
      </section>

      <section className="panel ranking-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Top list</p>
            <h2>占用排行榜</h2>
          </div>
        </div>
        <div className="rank-list">
          {ranking.map((node) => (
            <button className="rank-row" key={node.path} onClick={() => setSelectedNode(node)}>
              <span className={`risk-dot ${node.explanation.risk}`} />
              <span className="rank-name">{node.name}</span>
              <span className="rank-path">{shortPath(node.path)}</span>
              <strong>{formatBytes(node.size)}</strong>
            </button>
          ))}
          {!scan ? <div className="empty-state">选择盘符并开始扫描。</div> : null}
        </div>
      </section>
    </main>
  );
}

function Treemap({ nodes, total, onSelect, onDeepScan }: { nodes: ScanNode[]; total: number; onSelect: (node: ScanNode) => void; onDeepScan: (node: ScanNode) => void }) {
  const rects = layoutTreemap({ nodes, x: 0, y: 0, width: 100, height: 100, depth: 0 });

  if (rects.length === 0) {
    return <div className="empty-treemap">扫描后这里会显示最大的目录块。</div>;
  }

  return (
    <div className="treemap">
      {rects.map((rect, index) => {
        const percent = total > 0 ? (rect.node.size / total) * 100 : 0;
        const tileArea = rect.width * rect.height;
        const compact = rect.width < 12 || rect.height < 13 || tileArea < 190;
        const tiny = rect.width < 5 || rect.height < 5 || tileArea < 45;
        return (
          <button
            className={`tile risk-${rect.node.explanation.risk} ${compact ? "compact" : ""} ${tiny ? "tiny" : ""}`}
            key={rect.node.path}
            style={{
              left: `${rect.x}%`,
              top: `${rect.y}%`,
              width: `${rect.width}%`,
              height: `${rect.height}%`
            }}
            onClick={() => onSelect(rect.node)}
            onDoubleClick={() => onDeepScan(rect.node)}
            title={`${rect.node.path}\n${formatBytes(rect.node.size)} · ${formatPercent(percent)}\n双击深扫`}
          >
            <span className="tile-index">{index + 1}</span>
            {!compact ? (
              <>
                <strong>{rect.node.name}</strong>
                <small>{formatBytes(rect.node.size)}</small>
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function NodeDetail({ node, rootSize, onDeepScan }: { node: ScanNode | null; rootSize: number; onDeepScan: (node: ScanNode) => void }) {
  if (!node) {
    return (
      <div className="empty-state">
        <Info size={20} />
        扫描后点击目录查看说明。
      </div>
    );
  }

  const percent = rootSize > 0 ? (node.size / rootSize) * 100 : 0;
  const icon = node.explanation.risk === "danger" ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />;

  return (
    <div className="detail">
      <div className="detail-title">
        <span className={`risk-pill ${node.explanation.risk}`}>
          {icon}
          {riskText[node.explanation.risk]}
        </span>
        <h2>{node.name}</h2>
      </div>
      <p className="path-text">{node.path}</p>
      <div className="stat-grid">
        <div>
          <span>大小</span>
          <strong>{formatBytes(node.size)}</strong>
        </div>
        <div>
          <span>占比</span>
          <strong>{formatPercent(percent)}</strong>
        </div>
        <div>
          <span>文件数</span>
          <strong>{node.fileCount}</strong>
        </div>
        <div>
          <span>状态</span>
          <strong>{node.protected ? "受保护" : node.isLink ? "联接/链接" : "已读取"}</strong>
        </div>
      </div>
      <section className="explanation">
        <h3>{node.explanation.label}</h3>
        <p>{node.explanation.description}</p>
      </section>
      {node.type === "directory" && !node.isLink ? (
        <button className="soft-button wide" onClick={() => onDeepScan(node)}>
          <FolderOpen size={16} />
          深扫此目录
        </button>
      ) : null}
    </div>
  );
}

function flatten(root: ScanNode | undefined): ScanNode[] {
  if (!root) {
    return [];
  }
  const nodes: ScanNode[] = [];
  const visit = (node: ScanNode) => {
    nodes.push(node);
    node.children?.forEach(visit);
  };
  root.children?.forEach(visit);
  return nodes;
}

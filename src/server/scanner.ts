import { execFile } from "node:child_process";
import { readdir, lstat, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { explainPath } from "../shared/explain.js";
import type { DriveInfo, ScanNode } from "../shared/types.js";

const execFileAsync = promisify(execFile);

interface PowerShellDrive {
  Name: string;
  Root: string;
  Used: number | null;
  Free: number | null;
}

const MAX_CHILDREN = 2500;

export async function getDrives(): Promise<DriveInfo[]> {
  const script = [
    "Get-PSDrive -PSProvider FileSystem |",
    "Select-Object Name,Root,Used,Free |",
    "ConvertTo-Json -Compress"
  ].join(" ");

  const { stdout } = await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    script
  ]);

  const parsed = JSON.parse(stdout.trim()) as PowerShellDrive[] | PowerShellDrive;
  const drives = Array.isArray(parsed) ? parsed : [parsed];

  return drives
    .filter((drive) => typeof drive.Free === "number" && typeof drive.Used === "number")
    .map((drive) => {
      const used = drive.Used ?? 0;
      const free = drive.Free ?? 0;
      return {
        name: drive.Name,
        root: drive.Root,
        used,
        free,
        total: used + free
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function scanPath(targetPath: string, depth: number): Promise<ScanNode> {
  const safeDepth = Number.isFinite(depth) ? Math.max(0, Math.min(Math.floor(depth), 8)) : 2;
  return scanNode(path.resolve(targetPath), safeDepth, new Set<string>());
}

async function scanNode(targetPath: string, depth: number, ancestors: Set<string>): Promise<ScanNode> {
  const scannedAt = new Date().toISOString();
  const name = path.basename(targetPath) || targetPath;

  try {
    const stats = await lstat(targetPath);
    const isLink = stats.isSymbolicLink();
    const isDirectory = stats.isDirectory();

    if (isLink) {
      const linkType = await getLinkType(targetPath);
      return {
        name,
        path: targetPath,
        type: linkType,
        size: 0,
        fileCount: 0,
        skipped: true,
        protected: false,
        isLink: true,
        scannedAt,
        explanation: explainPath(targetPath, false, true)
      };
    }

    if (!isDirectory) {
      return {
        name,
        path: targetPath,
        type: "file",
        size: stats.size,
        fileCount: 1,
        skipped: false,
        protected: false,
        isLink: false,
        scannedAt,
        explanation: explainPath(targetPath)
      };
    }

    const normalized = targetPath.toLowerCase();
    if (ancestors.has(normalized)) {
      return makeSkippedDirectory(targetPath, "目录循环", scannedAt, true);
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(normalized);

    let entries;
    try {
      entries = await readdir(targetPath, { withFileTypes: true });
    } catch {
      return makeSkippedDirectory(targetPath, "无权限", scannedAt, true);
    }

    const visibleEntries = entries.slice(0, MAX_CHILDREN);
    const children = await Promise.all(
      visibleEntries.map((entry) => scanNode(path.join(targetPath, entry.name), depth - 1, nextAncestors))
    );

    const size = children.reduce((total, child) => total + child.size, 0);
    const fileCount = children.reduce((total, child) => total + child.fileCount, 0);
    const sortedChildren = children.sort((a, b) => b.size - a.size);
    const truncated = entries.length > MAX_CHILDREN;

    const directoryNode: ScanNode = {
      name,
      path: targetPath,
      type: "directory",
      size,
      fileCount,
      skipped: truncated,
      protected: false,
      isLink: false,
      scannedAt,
      explanation: explainPath(targetPath)
    };

    if (depth > 0) {
      directoryNode.children = sortedChildren;
    }

    return directoryNode;
  } catch {
    return makeSkippedDirectory(targetPath, "无法读取", scannedAt, true);
  }
}

async function getLinkType(targetPath: string): Promise<"file" | "directory"> {
  try {
    const targetStats = await stat(targetPath);
    return targetStats.isDirectory() ? "directory" : "file";
  } catch {
    return "directory";
  }
}

function makeSkippedDirectory(targetPath: string, reason: string, scannedAt: string, isProtected: boolean): ScanNode {
  return {
    name: path.basename(targetPath) || targetPath,
    path: targetPath,
    type: "directory",
    size: 0,
    fileCount: 0,
    skipped: true,
    protected: isProtected,
    isLink: false,
    scannedAt,
    explanation: {
      ...explainPath(targetPath, isProtected),
      label: reason
    }
  };
}

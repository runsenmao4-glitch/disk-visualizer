import type { DriveInfo, ScanResponse } from "../shared/types";

export async function fetchDrives(): Promise<DriveInfo[]> {
  const response = await fetch("/api/drives");
  if (!response.ok) {
    throw new Error("无法读取盘符信息");
  }
  const payload = (await response.json()) as { drives: DriveInfo[] };
  return payload.drives;
}

export async function scanPath(path: string, depth: number): Promise<ScanResponse> {
  const response = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, depth })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ error: "扫描失败" }))) as { error?: string };
    throw new Error(payload.error ?? "扫描失败");
  }

  return (await response.json()) as ScanResponse;
}

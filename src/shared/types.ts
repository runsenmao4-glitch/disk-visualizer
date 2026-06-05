export type RiskLevel = "safe" | "caution" | "danger" | "info";

export interface Explanation {
  label: string;
  risk: RiskLevel;
  description: string;
}

export interface DriveInfo {
  name: string;
  root: string;
  used: number;
  free: number;
  total: number;
}

export interface ScanNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  fileCount: number;
  skipped: boolean;
  protected: boolean;
  isLink: boolean;
  scannedAt: string;
  explanation: Explanation;
  children?: ScanNode[];
}

export interface ScanRequest {
  path: string;
  depth: number;
}

export interface ScanResponse {
  root: ScanNode;
  durationMs: number;
}

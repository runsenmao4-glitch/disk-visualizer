export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[index]}`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${Math.max(0, Math.min(100, value)).toFixed(1)}%`;
}

export function shortPath(path: string): string {
  return path.length > 64 ? `${path.slice(0, 28)}...${path.slice(-30)}` : path;
}

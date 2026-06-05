import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { explainPath } from "../shared/explain.js";
import type { ScanRequest } from "../shared/types.js";
import { getDrives, scanPath } from "./scanner.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../../dist");

app.use(express.json({ limit: "1mb" }));

app.get("/api/drives", async (_request, response) => {
  try {
    response.json({ drives: await getDrives() });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "无法读取盘符信息" });
  }
});

app.post("/api/scan", async (request, response) => {
  const body = request.body as Partial<ScanRequest>;
  if (typeof body.path !== "string" || body.path.trim() === "") {
    response.status(400).json({ error: "path 必须是非空字符串" });
    return;
  }

  const startedAt = performance.now();
  try {
    const root = await scanPath(body.path, typeof body.depth === "number" ? body.depth : 2);
    response.json({ root, durationMs: Math.round(performance.now() - startedAt) });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "扫描失败" });
  }
});

app.get("/api/explain", (request, response) => {
  const targetPath = String(request.query.path ?? "");
  response.json({ explanation: explainPath(targetPath) });
});

app.use(express.static(distPath));
app.use((_request, response) => {
  response.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Disk visualizer is running at http://127.0.0.1:${port}`);
});

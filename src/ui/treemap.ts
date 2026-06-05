import type { ScanNode } from "../shared/types";

export interface TreemapRect {
  node: ScanNode;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

interface LayoutInput {
  nodes: ScanNode[];
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export function layoutTreemap(input: LayoutInput): TreemapRect[] {
  const nodes = input.nodes.filter((node) => node.size > 0).slice(0, 36);
  const total = nodes.reduce((sum, node) => sum + node.size, 0);
  if (total <= 0 || input.width <= 0 || input.height <= 0) {
    return [];
  }

  const rects: TreemapRect[] = [];
  const area = input.width * input.height;
  const weighted = nodes.map((node) => ({ node, area: (node.size / total) * area }));
  squarify(weighted, [], { x: input.x, y: input.y, width: input.width, height: input.height }, rects, input.depth);

  return rects;
}

interface WeightedNode {
  node: ScanNode;
  area: number;
}

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function squarify(nodes: WeightedNode[], row: WeightedNode[], rect: LayoutRect, output: TreemapRect[], depth: number): void {
  if (nodes.length === 0) {
    if (row.length > 0) {
      layoutRow(row, rect, output, depth);
    }
    return;
  }

  const [next, ...rest] = nodes;
  if (!next) {
    return;
  }

  const shortSide = Math.max(0.0001, Math.min(rect.width, rect.height));
  const candidate = [...row, next];
  if (row.length === 0 || worstAspect(candidate, shortSide) <= worstAspect(row, shortSide)) {
    squarify(rest, candidate, rect, output, depth);
    return;
  }

  const nextRect = layoutRow(row, rect, output, depth);
  squarify(nodes, [], nextRect, output, depth);
}

function worstAspect(row: WeightedNode[], side: number): number {
  if (row.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const areas = row.map((item) => item.area);
  const sum = areas.reduce((total, value) => total + value, 0);
  const max = Math.max(...areas);
  const min = Math.max(0.0001, Math.min(...areas));
  const sideSquared = side * side;
  const sumSquared = sum * sum;
  return Math.max((sideSquared * max) / sumSquared, sumSquared / (sideSquared * min));
}

function layoutRow(row: WeightedNode[], rect: LayoutRect, output: TreemapRect[], depth: number): LayoutRect {
  const rowArea = row.reduce((total, item) => total + item.area, 0);
  const horizontal = rect.width >= rect.height;

  if (horizontal) {
    const rowHeight = Math.min(rect.height, rowArea / Math.max(0.0001, rect.width));
    let cursorX = rect.x;
    row.forEach((item, index) => {
      const isLast = index === row.length - 1;
      const width = isLast ? rect.x + rect.width - cursorX : item.area / Math.max(0.0001, rowHeight);
      output.push({ node: item.node, x: cursorX, y: rect.y, width, height: rowHeight, depth });
      cursorX += width;
    });
    return { x: rect.x, y: rect.y + rowHeight, width: rect.width, height: Math.max(0, rect.height - rowHeight) };
  }

  const rowWidth = Math.min(rect.width, rowArea / Math.max(0.0001, rect.height));
  let cursorY = rect.y;
  row.forEach((item, index) => {
    const isLast = index === row.length - 1;
    const height = isLast ? rect.y + rect.height - cursorY : item.area / Math.max(0.0001, rowWidth);
    output.push({ node: item.node, x: rect.x, y: cursorY, width: rowWidth, height, depth });
    cursorY += height;
  });
  return { x: rect.x + rowWidth, y: rect.y, width: Math.max(0, rect.width - rowWidth), height: rect.height };
}

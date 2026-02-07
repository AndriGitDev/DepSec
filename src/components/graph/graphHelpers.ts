import type { Vulnerability, PackageMetadata } from "@/types";

export interface GraphNode {
  id: string;
  name: string;
  type: "root" | "prod" | "dev" | "transitive";
  vulnCount: number;
  downloads: number;
  riskLevel: "safe" | "warning" | "critical";
}

export interface GraphLink {
  source: string;
  target: string;
}

export function getRiskColor(level: "safe" | "warning" | "critical"): string {
  switch (level) {
    case "safe": return "#00ff41";
    case "warning": return "#ffaa00";
    case "critical": return "#ff3333";
  }
}

export function getNodeSize(downloads: number): number {
  if (downloads <= 0) return 3;
  return Math.max(3, Math.min(8, Math.log10(downloads + 1) * 1.2));
}

export function getRiskLevel(vulnCount: number): "safe" | "warning" | "critical" {
  if (vulnCount === 0) return "safe";
  if (vulnCount <= 2) return "warning";
  return "critical";
}

export function buildGraphData(
  depNames: string[],
  depTypes: Record<string, "prod" | "dev">,
  vulnerabilities: Record<string, Vulnerability[]>,
  downloadCounts: Record<string, number>,
  rootName: string,
  packageMetadata?: Record<string, PackageMetadata>
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodeSet = new Set<string>(depNames);
  const nodes: GraphNode[] = [
    {
      id: "root",
      name: rootName,
      type: "root",
      vulnCount: 0,
      downloads: 0,
      riskLevel: "safe",
    },
  ];

  const links: GraphLink[] = [];
  const linkSet = new Set<string>();

  const addLink = (source: string, target: string) => {
    const key = `${source}->${target}`;
    if (!linkSet.has(key)) {
      linkSet.add(key);
      links.push({ source, target });
    }
  };

  // Add direct dependency nodes
  for (const name of depNames) {
    const vulnCount = (vulnerabilities[name] ?? []).length;
    nodes.push({
      id: name,
      name,
      type: depTypes[name] ?? "prod",
      vulnCount,
      downloads: downloadCounts[name] ?? 0,
      riskLevel: getRiskLevel(vulnCount),
    });
    addLink("root", name);
  }

  // Add sub-dependency links from metadata
  if (packageMetadata) {
    const transitiveNodes = new Set<string>();

    for (const name of depNames) {
      const meta = packageMetadata[name];
      if (!meta?.directDeps) continue;

      for (const subDep of meta.directDeps) {
        if (subDep === name) continue; // skip self-refs

        if (nodeSet.has(subDep)) {
          // Both are direct deps — add a cross-link
          addLink(name, subDep);
        } else if (transitiveNodes.size < 40) {
          // Add as a transitive node (capped to keep graph readable)
          if (!transitiveNodes.has(subDep)) {
            transitiveNodes.add(subDep);
            nodeSet.add(subDep);
            nodes.push({
              id: subDep,
              name: subDep,
              type: "transitive",
              vulnCount: 0,
              downloads: 0,
              riskLevel: "safe",
            });
          }
          addLink(name, subDep);
        }
      }
    }
  }

  return { nodes, links };
}

export function drawNeonNode(
  node: GraphNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number
) {
  const baseSize = node.type === "root" ? 6 : node.type === "transitive" ? 2 : getNodeSize(node.downloads);
  // Scale by 1/globalScale so nodes stay a consistent pixel size on screen
  const size = baseSize / globalScale;
  const color = node.type === "root" ? "#00ff41" : node.type === "transitive" ? "#00ff4166" : getRiskColor(node.riskLevel);
  const x = (node as unknown as { x: number }).x;
  const y = (node as unknown as { y: number }).y;

  // Outer glow
  ctx.beginPath();
  ctx.arc(x, y, size + 3 / globalScale, 0, 2 * Math.PI);
  ctx.fillStyle = `${color}18`;
  ctx.fill();

  // Middle glow
  ctx.beginPath();
  ctx.arc(x, y, size + 1.5 / globalScale, 0, 2 * Math.PI);
  ctx.fillStyle = `${color}33`;
  ctx.fill();

  // Core
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  // Label — always show at reasonable zoom, or for root
  const showLabel = globalScale > 0.8 || node.type === "root";
  if (showLabel) {
    const fontSize = node.type === "root" ? 12 / globalScale : 10 / globalScale;
    ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;
    ctx.fillStyle = "#66ffaa";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(node.name, x, y + size + 2 / globalScale);
  }
}

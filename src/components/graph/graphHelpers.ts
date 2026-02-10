import type { Vulnerability, PackageMetadata, Dependency } from "@/types";

export interface GraphNode {
  id: string;
  name: string;
  type: "root" | "prod" | "dev" | "transitive";
  vulnCount: number;
  downloads: number;
  riskLevel: "safe" | "warning" | "critical";
  depth: number;
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

export function getNodeSize(downloads: number, depth: number = 0): number {
  if (downloads <= 0) return Math.max(2, 3 - depth * 0.5);
  const base = Math.max(3, Math.min(8, Math.log10(downloads + 1) * 1.2));
  return Math.max(2, base - depth * 0.3);
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
  packageMetadata?: Record<string, PackageMetadata>,
  dependencies?: Dependency[],
  dependencyTree?: Map<string, string[]>
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
      depth: -1,
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

  // Build depth map from dependencies if provided
  const depthMap = new Map<string, number>();
  if (dependencies) {
    for (const dep of dependencies) {
      depthMap.set(dep.name, dep.depth ?? 0);
    }
  }

  // Get direct deps
  const directDeps = dependencies 
    ? dependencies.filter(d => d.isDirect !== false || (d.depth ?? 0) === 0).map(d => d.name)
    : depNames;

  // Add direct dependency nodes first
  for (const name of directDeps) {
    const vulnCount = (vulnerabilities[name] ?? []).length;
    const depth = depthMap.get(name) ?? 0;
    nodes.push({
      id: name,
      name,
      type: depTypes[name] ?? "prod",
      vulnCount,
      downloads: downloadCounts[name] ?? 0,
      riskLevel: getRiskLevel(vulnCount),
      depth,
    });
    addLink("root", name);
  }

  // Add transitive dependencies if we have a dependency tree
  if (dependencyTree && dependencyTree.size > 0) {
    const transitiveDeps = dependencies 
      ? dependencies.filter(d => d.isDirect === false && (d.depth ?? 0) > 0)
      : [];
    
    // Add transitive nodes (limit to prevent graph explosion)
    const maxTransitive = 50;
    let transitiveCount = 0;
    
    for (const dep of transitiveDeps) {
      if (transitiveCount >= maxTransitive) break;
      if (nodeSet.has(dep.name)) continue; // Already added as direct
      
      const vulnCount = (vulnerabilities[dep.name] ?? []).length;
      nodes.push({
        id: dep.name,
        name: dep.name,
        type: "transitive",
        vulnCount,
        downloads: downloadCounts[dep.name] ?? 0,
        riskLevel: getRiskLevel(vulnCount),
        depth: dep.depth ?? 1,
      });
      nodeSet.add(dep.name);
      transitiveCount++;
    }

    // Add links between dependencies based on the tree
    for (const [parent, children] of dependencyTree) {
      if (!nodeSet.has(parent)) continue;
      for (const child of children) {
        if (nodeSet.has(child) && child !== parent) {
          addLink(parent, child);
        }
      }
    }
  }

  // Fallback: Add sub-dependency links from metadata if no dependency tree
  if (!dependencyTree && packageMetadata) {
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
              depth: 1,
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
  const isTransitive = node.type === "transitive";
  const depth = node.depth ?? 0;
  const baseSize = node.type === "root" ? 6 : getNodeSize(node.downloads, depth);
  // Scale by 1/globalScale so nodes stay a consistent pixel size on screen
  const size = baseSize / globalScale;
  
  // Adjust color opacity based on depth
  const opacityMultiplier = isTransitive ? Math.max(0.3, 1 - depth * 0.15) : 1;
  const color = node.type === "root" 
    ? "#00ff41" 
    : getRiskColor(node.riskLevel);
  
  const x = (node as unknown as { x: number }).x;
  const y = (node as unknown as { y: number }).y;

  // Outer glow (reduced for transitive)
  if (!isTransitive || depth <= 2) {
    ctx.beginPath();
    ctx.arc(x, y, size + 3 / globalScale, 0, 2 * Math.PI);
    ctx.fillStyle = `${color}${Math.round(0x18 * opacityMultiplier).toString(16).padStart(2, '0')}`;
    ctx.fill();
  }

  // Middle glow
  ctx.beginPath();
  ctx.arc(x, y, size + 1.5 / globalScale, 0, 2 * Math.PI);
  ctx.fillStyle = `${color}${Math.round(0x33 * opacityMultiplier).toString(16).padStart(2, '0')}`;
  ctx.fill();

  // Core
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fillStyle = isTransitive ? `${color}${Math.round(0xff * opacityMultiplier).toString(16).padStart(2, '0')}` : color;
  ctx.fill();

  // Label — show for direct deps and root, or at high zoom
  const showLabel = !isTransitive && (globalScale > 0.8 || node.type === "root");
  if (showLabel) {
    const fontSize = node.type === "root" ? 12 / globalScale : 10 / globalScale;
    ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;
    ctx.fillStyle = "#66ffaa";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(node.name, x, y + size + 2 / globalScale);
  }
}

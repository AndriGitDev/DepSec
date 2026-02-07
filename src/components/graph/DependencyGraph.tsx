"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type {
  ParsedPackageJson,
  PackageMetadata,
  Vulnerability,
} from "@/types";
import {
  buildGraphData,
  drawNeonNode,
  getRiskColor,
  type GraphNode,
} from "./graphHelpers";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center font-mono text-xs text-phosphor-dim/40">
      Loading graph...
    </div>
  ),
});

interface DependencyGraphProps {
  parsed: ParsedPackageJson;
  vulnerabilities: Record<string, Vulnerability[]>;
  downloadCounts: Record<string, number>;
  packageMetadata?: Record<string, PackageMetadata>;
}

export function DependencyGraph({
  parsed,
  vulnerabilities,
  downloadCounts,
  packageMetadata,
}: DependencyGraphProps) {
  const graphRef = useRef<unknown>(null);
  const [filterRisk, setFilterRisk] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphWidth, setGraphWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setGraphWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const depTypes: Record<string, "prod" | "dev"> = {};
    for (const dep of parsed.dependencies) {
      depTypes[dep.name] = dep.type;
    }

    const data = buildGraphData(
      parsed.dependencies.map((d) => d.name),
      depTypes,
      vulnerabilities,
      downloadCounts,
      parsed.name ?? "package.json",
      packageMetadata
    );

    if (filterRisk) {
      const filteredNodes = data.nodes.filter(
        (n) => n.type === "root" || n.riskLevel === filterRisk
      );
      const nodeIds = new Set(filteredNodes.map((n) => n.id));
      const filteredLinks = data.links.filter(
        (l) =>
          nodeIds.has(typeof l.source === "string" ? l.source : (l.source as unknown as GraphNode).id) &&
          nodeIds.has(typeof l.target === "string" ? l.target : (l.target as unknown as GraphNode).id)
      );
      return { nodes: filteredNodes, links: filteredLinks };
    }

    return data;
  }, [parsed, vulnerabilities, downloadCounts, packageMetadata, filterRisk]);

  // Configure forces once the graph instance is available
  useEffect(() => {
    const fg = graphRef.current as {
      d3Force?: (name: string, force?: unknown) => unknown;
    } | null;
    if (!fg?.d3Force) return;

    const charge = fg.d3Force("charge") as { strength?: (v: number) => void; distanceMax?: (v: number) => void } | null;
    if (charge) {
      charge.strength?.(-200);
      charge.distanceMax?.(300);
    }
    const link = fg.d3Force("link") as { distance?: (v: number) => void } | null;
    if (link) {
      link.distance?.(80);
    }
  }, [graphData]);

  const handleZoomIn = useCallback(() => {
    const fg = graphRef.current as { zoom?: (k?: number, ms?: number) => number; } | null;
    if (fg && typeof fg.zoom === "function") {
      const current = fg.zoom();
      fg.zoom(current * 1.8, 300);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const fg = graphRef.current as { zoom?: (k?: number, ms?: number) => number; } | null;
    if (fg && typeof fg.zoom === "function") {
      const current = fg.zoom();
      fg.zoom(current / 1.8, 300);
    }
  }, []);

  const handleFit = useCallback(() => {
    const fg = graphRef.current as { zoomToFit?: (ms: number, px: number) => void } | null;
    if (fg && typeof fg.zoomToFit === "function") {
      fg.zoomToFit(400, 40);
    }
  }, []);

  return (
    <div className="border border-phosphor-dim/20 bg-black overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-phosphor-dim/10">
        <span className="font-mono text-[10px] uppercase tracking-wider text-phosphor-dim">
          Dependency Graph
        </span>
        <div className="flex items-center gap-2">
          {/* Risk filter */}
          {(["safe", "warning", "critical"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFilterRisk(filterRisk === level ? null : level)}
              className={`px-2 py-0.5 font-mono text-[10px] border transition-all ${
                filterRisk === level
                  ? "border-current bg-current/10"
                  : "border-phosphor-dim/20 hover:border-current"
              }`}
              style={{ color: getRiskColor(level) }}
            >
              {level}
            </button>
          ))}

          <div className="w-px h-4 bg-phosphor-dim/20 mx-1" />

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 text-phosphor-dim hover:text-phosphor transition-colors"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 text-phosphor-dim hover:text-phosphor transition-colors"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFit}
            className="p-1 text-phosphor-dim hover:text-phosphor transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Graph */}
      <div ref={containerRef} className="h-[450px]">
        <ForceGraph2D
          ref={graphRef as React.RefObject<never>}
          graphData={graphData}
          nodeCanvasObject={(node: unknown, ctx: CanvasRenderingContext2D, globalScale: number) =>
            drawNeonNode(node as GraphNode, ctx, globalScale)
          }
          nodePointerAreaPaint={(node: unknown, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const n = node as GraphNode & { x: number; y: number };
            ctx.beginPath();
            ctx.arc(n.x, n.y, 10 / globalScale, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkColor={() => "#00aa2a30"}
          linkWidth={1}
          backgroundColor="#000000"
          width={graphWidth}
          height={450}
          cooldownTicks={200}
          warmupTicks={50}
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.3}
          nodeLabel={(node: unknown) => {
            const n = node as GraphNode;
            return `${n.name} (${n.vulnCount} vulns, ${n.downloads.toLocaleString()} downloads/mo)`;
          }}
          onEngineStop={() => {
            const fg = graphRef.current as { zoomToFit?: (ms: number, px: number) => void } | null;
            fg?.zoomToFit?.(400, 40);
          }}
        />
      </div>
    </div>
  );
}

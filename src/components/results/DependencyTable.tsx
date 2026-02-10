"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Search, GitBranch, ChevronRight } from "lucide-react";
import type {
  ParsedPackageJson,
  Vulnerability,
  PackageMetadata,
} from "@/types";

interface DependencyTableProps {
  parsed: ParsedPackageJson;
  vulnerabilities: Record<string, Vulnerability[]>;
  metadata: Record<string, PackageMetadata>;
  downloadCounts: Record<string, number>;
}

type SortKey = "name" | "type" | "vulns" | "license" | "downloads" | "depth";
type SortDir = "asc" | "desc";
type DepFilter = "all" | "direct" | "transitive";

function getRiskBadge(vulnCount: number) {
  if (vulnCount === 0) return { text: "Clean", cls: "text-phosphor border-phosphor/30" };
  if (vulnCount <= 2) return { text: "Warning", cls: "text-warning border-warning/30" };
  return { text: "Critical", cls: "text-danger border-danger/30" };
}

function getDepthIndicator(depth: number) {
  if (depth === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-phosphor-dim/60">
      {Array.from({ length: Math.min(depth, 3) }).map((_, i) => (
        <ChevronRight key={i} className="h-2.5 w-2.5" />
      ))}
      {depth > 3 && <span className="text-[9px]">+{depth - 3}</span>}
    </span>
  );
}

export function DependencyTable({
  parsed,
  vulnerabilities,
  metadata,
  downloadCounts,
}: DependencyTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("vulns");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [depFilter, setDepFilter] = useState<DepFilter>("all");

  const hasTransitiveDeps = parsed.hasLockfile && (parsed.transitiveCount ?? 0) > 0;

  const rows = useMemo(() => {
    let items = parsed.dependencies.map((dep) => ({
      name: dep.name,
      version: dep.resolvedVersion || dep.versionSpecifier,
      specifier: dep.versionSpecifier,
      type: dep.type,
      depth: dep.depth ?? 0,
      isDirect: dep.isDirect !== false,
      vulnCount: (vulnerabilities[dep.name] ?? []).length,
      vulns: vulnerabilities[dep.name] ?? [],
      license: metadata[dep.name]?.license ?? "Unknown",
      downloads: downloadCounts[dep.name] ?? 0,
    }));

    // Apply depth filter
    if (depFilter === "direct") {
      items = items.filter((i) => i.isDirect);
    } else if (depFilter === "transitive") {
      items = items.filter((i) => !i.isDirect);
    }

    // Apply search filter
    if (search) {
      const lower = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(lower));
    }

    // Apply sorting
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "vulns":
          cmp = a.vulnCount - b.vulnCount;
          break;
        case "license":
          cmp = a.license.localeCompare(b.license);
          break;
        case "downloads":
          cmp = a.downloads - b.downloads;
          break;
        case "depth":
          cmp = a.depth - b.depth;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [parsed, vulnerabilities, metadata, downloadCounts, search, sortKey, sortDir, depFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortHeader = ({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(sortKeyVal)}
      className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-phosphor-dim hover:text-phosphor transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-phosphor-dim/50" />
          <input
            type="text"
            placeholder="Search dependencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-phosphor-dim/20 pl-9 pr-4 py-2.5 font-mono text-sm text-phosphor placeholder:text-phosphor-dim/30 focus:border-phosphor/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Depth filter (only show if we have transitive deps) */}
        {hasTransitiveDeps && (
          <div className="flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-phosphor-dim/50" />
            <div className="flex">
              {(["all", "direct", "transitive"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setDepFilter(filter)}
                  className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-colors ${
                    depFilter === filter
                      ? "bg-phosphor/10 text-phosphor border-phosphor/30"
                      : "text-phosphor-dim border-phosphor-dim/20 hover:border-phosphor/30"
                  } ${filter === "all" ? "rounded-l" : ""} ${filter === "transitive" ? "rounded-r" : ""} ${filter !== "all" ? "border-l-0" : ""}`}
                >
                  {filter}
                  {filter === "direct" && ` (${parsed.directCount ?? parsed.dependencies.filter(d => d.isDirect !== false).length})`}
                  {filter === "transitive" && ` (${parsed.transitiveCount ?? 0})`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-phosphor-dim/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-phosphor-dim/20 bg-secondary/50">
                <th className="px-4 py-2.5 text-left">
                  <SortHeader label="Package" sortKeyVal="name" />
                </th>
                <th className="px-4 py-2.5 text-left">
                  <span className="font-mono text-xs uppercase tracking-wider text-phosphor-dim">
                    Version
                  </span>
                </th>
                <th className="px-4 py-2.5 text-left">
                  <SortHeader label="Type" sortKeyVal="type" />
                </th>
                {hasTransitiveDeps && (
                  <th className="px-4 py-2.5 text-left">
                    <SortHeader label="Depth" sortKeyVal="depth" />
                  </th>
                )}
                <th className="px-4 py-2.5 text-left">
                  <SortHeader label="Vulns" sortKeyVal="vulns" />
                </th>
                <th className="px-4 py-2.5 text-left">
                  <SortHeader label="License" sortKeyVal="license" />
                </th>
                <th className="px-4 py-2.5 text-right">
                  <SortHeader label="Downloads" sortKeyVal="downloads" />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const badge = getRiskBadge(row.vulnCount);
                return (
                  <tr
                    key={row.name}
                    className="border-b border-phosphor-dim/10 hover:bg-phosphor/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-phosphor">
                      <div className="flex items-center gap-1">
                        {getDepthIndicator(row.depth)}
                        <span className={row.isDirect ? "" : "text-phosphor-dim/70"}>
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-phosphor-dim">
                      {row.version}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-xs uppercase px-2 py-1 border ${
                          row.type === "prod"
                            ? "text-phosphor border-phosphor/20"
                            : "text-phosphor-dim border-phosphor-dim/20"
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    {hasTransitiveDeps && (
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs px-2 py-1 border ${
                          row.isDirect
                            ? "text-phosphor border-phosphor/30"
                            : "text-phosphor-dim/60 border-phosphor-dim/20"
                        }`}>
                          {row.isDirect ? "direct" : `L${row.depth}`}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {row.vulnCount > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className={`font-mono text-xs uppercase px-2 py-1 border ${badge.cls}`}>
                            {row.vulnCount} {badge.text}
                          </span>
                          {/* Show remediation hint if available */}
                          {row.vulns.some(v => v.fixedVersion) && (
                            <span className="font-mono text-xs text-phosphor-dim/60">
                              Fix: upgrade to {row.vulns.find(v => v.fixedVersion)?.fixedVersion}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-phosphor-dim/50">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-phosphor-dim">
                      {row.license}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-phosphor-dim">
                      {row.downloads.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={hasTransitiveDeps ? 7 : 6}
                    className="px-4 py-8 text-center font-mono text-sm text-phosphor-dim/40"
                  >
                    No dependencies match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 font-mono text-sm text-phosphor-dim/50">
        {rows.length} of {parsed.totalCount} dependencies shown
        {hasTransitiveDeps && depFilter === "all" && (
          <span> ({parsed.directCount} direct, {parsed.transitiveCount} transitive)</span>
        )}
      </p>
    </div>
  );
}

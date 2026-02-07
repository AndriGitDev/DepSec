"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Search } from "lucide-react";
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

type SortKey = "name" | "type" | "vulns" | "license" | "downloads";
type SortDir = "asc" | "desc";

function getRiskBadge(vulnCount: number) {
  if (vulnCount === 0) return { text: "Clean", cls: "text-phosphor border-phosphor/30" };
  if (vulnCount <= 2) return { text: "Warning", cls: "text-warning border-warning/30" };
  return { text: "Critical", cls: "text-danger border-danger/30" };
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

  const rows = useMemo(() => {
    let items = parsed.dependencies.map((dep) => ({
      name: dep.name,
      version: dep.versionSpecifier,
      type: dep.type,
      vulnCount: (vulnerabilities[dep.name] ?? []).length,
      license: metadata[dep.name]?.license ?? "Unknown",
      downloads: downloadCounts[dep.name] ?? 0,
    }));

    if (search) {
      const lower = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(lower));
    }

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
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [parsed, vulnerabilities, metadata, downloadCounts, search, sortKey, sortDir]);

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
      className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-phosphor-dim hover:text-phosphor transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-phosphor-dim/50" />
        <input
          type="text"
          placeholder="Search dependencies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black border border-phosphor-dim/20 pl-9 pr-4 py-2 font-mono text-xs text-phosphor placeholder:text-phosphor-dim/30 focus:border-phosphor/50 focus:outline-none transition-colors"
        />
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
                  <span className="font-mono text-[10px] uppercase tracking-wider text-phosphor-dim">
                    Version
                  </span>
                </th>
                <th className="px-4 py-2.5 text-left">
                  <SortHeader label="Type" sortKeyVal="type" />
                </th>
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
                    <td className="px-4 py-2.5 font-mono text-xs text-phosphor">
                      {row.name}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-phosphor-dim">
                      {row.version}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`font-mono text-[10px] uppercase px-1.5 py-0.5 border ${
                          row.type === "prod"
                            ? "text-phosphor border-phosphor/20"
                            : "text-phosphor-dim border-phosphor-dim/20"
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {row.vulnCount > 0 ? (
                        <span className={`font-mono text-[10px] uppercase px-1.5 py-0.5 border ${badge.cls}`}>
                          {row.vulnCount} {badge.text}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-phosphor-dim/50">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-phosphor-dim">
                      {row.license}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-phosphor-dim">
                      {row.downloads.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center font-mono text-xs text-phosphor-dim/40"
                  >
                    No dependencies match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-2 font-mono text-[10px] text-phosphor-dim/40">
        {rows.length} of {parsed.totalCount} dependencies shown
      </p>
    </div>
  );
}

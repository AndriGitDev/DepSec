import Link from "next/link";
import { Shield } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-phosphor-dim/30 bg-black/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <Shield className="h-5 w-5 text-phosphor group-hover:drop-shadow-[0_0_8px_rgba(0,255,65,0.6)] transition-all" />
          <span className="font-display text-sm font-bold tracking-[3px] uppercase text-phosphor text-glow">
            DepSec
          </span>
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-phosphor-dim hover:text-phosphor transition-colors"
        >
          v0.1.0
        </a>
      </div>
    </header>
  );
}

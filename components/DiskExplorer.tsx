"use client";

import { Folder, FileCode2, RotateCcw } from "lucide-react";
import { DiskTreeNode } from "@/lib/types";

function Node({ node, depth = 0 }: { node: DiskTreeNode; depth?: number }) {
  if (node.type === "folder") {
    return (
      <div>
        <div
          className="flex items-center gap-1.5 py-1 font-mono text-[11px] text-mist"
          style={{ paddingLeft: depth * 12 }}
        >
          <Folder size={12} className="text-plasma-soft" />
          {node.name}
        </div>
        {node.children?.map((child) => (
          <Node key={child.path} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-1.5 py-1 font-mono text-[11px] text-chalk/80"
      style={{ paddingLeft: depth * 12 }}
    >
      <FileCode2 size={12} className="text-signal/80" />
      {node.name}
    </div>
  );
}

export default function DiskExplorer({
  tree,
  onReset
}: {
  tree: DiskTreeNode[];
  onReset: () => void;
}) {
  return (
    <div className="glass flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-mist">Sanal Disk</span>
        <button
          onClick={onReset}
          title="Diski sıfırla"
          className="text-mist transition-colors hover:text-signal"
        >
          <RotateCcw size={13} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tree.length === 0 ? (
          <p className="text-[11px] leading-relaxed text-mist/70">
            Henüz dosya yok. Agent bir şey ürettiğinde burada belirecek.
          </p>
        ) : (
          tree.map((node) => <Node key={node.path} node={node} />)
        )}
      </div>
    </div>
  );
}

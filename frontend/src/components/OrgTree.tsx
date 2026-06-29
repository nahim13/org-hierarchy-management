'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PositionTreeNode } from '@/types/position';

interface OrgTreeProps {
  nodes: PositionTreeNode[];
  onAddChild: (parent: PositionTreeNode) => void;
  onDelete: (node: PositionTreeNode) => void;
}

export function OrgTree({ nodes, onAddChild, onDelete }: OrgTreeProps) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  depth,
  onAddChild,
  onDelete,
}: {
  node: PositionTreeNode;
  depth: number;
  onAddChild: (parent: PositionTreeNode) => void;
  onDelete: (node: PositionTreeNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className="group flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 shadow-card"
        style={{ marginLeft: depth * 20 }}
      >
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          disabled={!hasChildren}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-ink/40 hover:bg-surface disabled:opacity-0"
        >
          {hasChildren ? (expanded ? '▾' : '▸') : null}
        </button>

        <div className="min-w-0 flex-1">
          <Link
            href={`/positions/${node.id}`}
            className="truncate text-sm font-medium text-ink hover:text-accent"
          >
            {node.name}
          </Link>
          <div className="flex items-center gap-2 text-xs text-ink/45">
            {node.department && <span>{node.department}</span>}
            <span className="font-mono">L{node.level}</span>
            {hasChildren && (
              <span>
                {node.children.length} direct report
                {node.children.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onAddChild(node)}
            className="focus-ring rounded-md border border-line px-2 py-1 text-xs font-medium text-ink/70 hover:border-accent hover:text-accent"
          >
            + Add child
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="focus-ring rounded-md border border-line px-2 py-1 text-xs font-medium text-ink/70 hover:border-red-400 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <ul className="mt-1 space-y-1 border-l border-dashed border-line pl-0">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

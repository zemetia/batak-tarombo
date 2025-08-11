
'use client';
import { useCallback } from 'react';
import { useStore, getStraightPath, EdgeProps, BaseEdge } from 'reactflow';

function getOffset(el: HTMLElement | null) {
  if (!el) {
    return { x: 0, y: 0 };
  }
  const elRect = el.getBoundingClientRect();
  return {
    x: elRect.width / 2,
    y: elRect.height / 2,
  };
}

export function FloatingEdge({ id, source, target, markerEnd, style }: EdgeProps) {
  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }
  
  const sourceOffset = getOffset(document.querySelector(`[data-nodeid="${source}"]`));
  const targetOffset = getOffset(document.querySelector(`[data-nodeid="${target}"]`));

  const sourceX = sourceNode.position.x + sourceOffset.x;
  const sourceY = sourceNode.position.y + sourceOffset.y;
  const targetX = targetNode.position.x + targetOffset.x;
  const targetY = targetNode.position.y + targetOffset.y;

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{ ...style, stroke: 'hsl(var(--primary))', strokeWidth: 1.5 }}
    />
  );
}

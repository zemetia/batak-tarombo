
'use client';
import { cn } from '@/lib/utils';
import { Handle, Position, NodeProps } from 'reactflow';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Ancestor } from '@/lib/data';
import { Button } from './ui/button';
import { MinusSquare, PlusSquare } from 'lucide-react';

interface CustomNodeData {
    label: string;
    generation?: number;
    onClick: (data: Ancestor) => void;
    onToggleCollapse: (nodeId: string) => void;
    rawAncestor: Ancestor;
    isSelected: boolean;
    isCollapsed: boolean;
    hasChildren: boolean;
}

export const CustomNode = React.memo(({ data, id }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} className="!bg-primary" />
      <div
        onClick={() => data.onClick(data.rawAncestor)}
        className={cn(
          'w-[220px] p-3 shadow-md rounded-lg transition-all duration-200 cursor-pointer',
          'flex items-center gap-4 relative',
          'bg-card border-2',
          data.isSelected ? 'border-primary shadow-primary/30' : 'border-border hover:border-primary/70'
        )}
      >
        <Avatar className="w-12 h-12">
            <AvatarImage src={`https://placehold.co/100x100.png`} />
            <AvatarFallback className="text-lg">
                {data.label.charAt(0)}
            </AvatarFallback>
        </Avatar>
        <div className="text-left overflow-hidden">
            <p className="font-bold font-headline text-base truncate">{data.label}</p>
            {data.generation && <p className="text-xs text-muted-foreground">Generation {data.generation}</p>}
        </div>
         {data.hasChildren && (
            <Button
                variant="ghost"
                size="icon"
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 bg-background border rounded-full z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    data.onToggleCollapse(id);
                }}
            >
                {data.isCollapsed ? <PlusSquare className="w-3 h-3" /> : <MinusSquare className="w-3 h-3" />}
            </Button>
        )}
      </div>
       <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} className="!bg-primary" />
    </>
  );
});

CustomNode.displayName = 'CustomNode';

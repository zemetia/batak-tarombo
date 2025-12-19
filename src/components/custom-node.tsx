
'use client';
import { cn } from '@/lib/utils';
import { Handle, Position, NodeProps } from 'reactflow';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Ancestor } from '@/lib/data';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MinusSquare, PlusSquare, Zap, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';

interface CustomNodeData {
    label: string;
    generation?: number;
    onClick: (data: Ancestor) => void;
    onToggleCollapse: (nodeId: string) => void;
    onHighlightPath: (ancestorId: string) => void;
    rawAncestor: Ancestor;
    isSelected: boolean;
    isCollapsed: boolean;
    isHighlighted: boolean;
    hasChildren: boolean;
}

export const CustomNode = React.memo(({ data, id }: NodeProps<CustomNodeData>) => {
  const t = useTranslations('CustomNode');
  const hasWife = data.rawAncestor.wife && data.rawAncestor.wife.trim() !== '';
  const isFounder = data.generation === 1;
  
  return (
    <>
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top" 
        isConnectable={false} 
        className={cn(
          "!w-2 !h-2 !border-2",
          data.isHighlighted ? "!bg-primary !border-primary" : "!bg-muted-foreground !border-muted-foreground"
        )}
      />
      <div
        onClick={() => data.onClick(data.rawAncestor)}
        onDoubleClick={() => data.onHighlightPath(data.rawAncestor.id)}
        className={cn(
          'w-[220px] p-3 shadow-lg rounded-lg transition-all duration-300 cursor-pointer group',
          'flex items-center gap-3 relative overflow-hidden',
          'bg-card border-2 hover:shadow-xl transform hover:scale-105',
          data.isSelected ? 'border-primary shadow-primary/30 ring-2 ring-primary/20' : 'border-border hover:border-primary/70',
          data.isHighlighted ? 'bg-primary/5 border-primary shadow-primary/40 ring-2 ring-primary/30' : '',
          isFounder ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-300' : ''
        )}
      >
        {/* Founder Crown */}
        {isFounder && (
          <Crown className="absolute top-1 right-1 w-4 h-4 text-amber-500" />
        )}
        
        {/* Highlight Indicator */}
        {data.isHighlighted && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 to-primary animate-pulse" />
        )}
        
        <Avatar className={cn(
          "w-12 h-12 ring-2 ring-offset-1 transition-all duration-200",
          data.isSelected ? "ring-primary" : "ring-border",
          data.isHighlighted ? "ring-primary ring-offset-primary/10" : ""
        )}>
            <AvatarImage src={`https://placehold.co/100x100.png`} />
            <AvatarFallback className={cn(
              "text-lg font-bold",
              isFounder ? "bg-amber-100 text-amber-800" : "bg-muted"
            )}>
                {data.label.charAt(0)}
            </AvatarFallback>
        </Avatar>
        
        <div className="text-left overflow-hidden flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold font-headline text-base truncate">{data.label}</p>
              {hasWife && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      M
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('marriedTo', {name: data.rawAncestor.wife})}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isFounder && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 border-amber-300 text-amber-700">
                      Founder
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('founderDesc')}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {data.generation && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {t('generation', {gen: data.generation})}
                {data.isHighlighted && <Zap className="w-3 h-3 text-primary animate-pulse" />}
              </p>
            )}
        </div>
        
        {/* Hover Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onHighlightPath(data.rawAncestor.id);
                }}
              >
                <Zap className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('highlightPath')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Collapse/Expand Button */}
        {data.hasChildren && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full z-10",
                      "bg-background border-2 shadow-sm hover:shadow-md transition-all duration-200",
                      data.isHighlighted ? "border-primary bg-primary/5" : "border-border"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onToggleCollapse(id);
                    }}
                >
                    {data.isCollapsed ? <PlusSquare className="w-3 h-3" /> : <MinusSquare className="w-3 h-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{data.isCollapsed ? t('expand') : t('collapse')}</p>
              </TooltipContent>
            </Tooltip>
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom" 
        isConnectable={false} 
        className={cn(
          "!w-2 !h-2 !border-2",
          data.isHighlighted ? "!bg-primary !border-primary" : "!bg-muted-foreground !border-muted-foreground"
        )}
      />
    </>
  );
});

CustomNode.displayName = 'CustomNode';

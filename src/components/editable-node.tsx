
'use client';
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { Ancestor } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, MinusSquare, PlusSquare, ArrowUp, ArrowDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTranslations } from 'next-intl';


interface EditableNodeData extends Ancestor {
  onEdit: (person: Ancestor) => void;
  onAddChild: (person: Ancestor) => void;
  onDelete: (person: Ancestor) => void;
  onToggleCollapse: (nodeId: string) => void;
  onReorder: (personId: string, direction: 'up' | 'down') => void;
  isNew?: boolean;
  isEdited?: boolean;
  isCollapsed: boolean;
  hasChildren: boolean;
  hasSiblings: { up: boolean, down: boolean };
}

export const EditableNode = React.memo(({ data, id }: NodeProps<EditableNodeData>) => {
  const t = useTranslations('EditableNode');
  const { onEdit, onAddChild, onDelete, onToggleCollapse, onReorder, isNew, isEdited, isCollapsed, hasChildren, hasSiblings, ...person } = data;

  return (
    <>
      <Handle type="target" position={Position.Top} id="top" isConnectable={true} className="!bg-primary" />
      <div
        className={cn(
          'w-[240px] h-[80px] p-3 shadow-lg rounded-lg transition-all duration-200',
          'flex items-center gap-3 relative',
          'bg-card border-2',
          isNew ? 'border-green-500 bg-green-500/10' : 'border-border',
          isEdited ? 'border-yellow-500 bg-yellow-500/10' : 'border-border'
        )}
      >
        <div className="absolute top-1/2 -left-3 -translate-y-1/2 flex flex-col gap-1 z-20">
            <Button variant="outline" size="icon" className='h-6 w-6' onClick={() => onReorder(person.id, 'up')} disabled={!hasSiblings.up}>
                <ArrowUp className='w-4 h-4' />
            </Button>
             <Button variant="outline" size="icon" className='h-6 w-6' onClick={() => onReorder(person.id, 'down')} disabled={!hasSiblings.down}>
                <ArrowDown className='w-4 h-4' />
            </Button>
        </div>

        <div className="text-left overflow-hidden flex-grow">
          <p className="font-bold font-headline text-lg truncate">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.wife ? t('wife', {name: data.wife}) : t('noWife')}
          </p>
           {data.generation && <p className="text-xs text-muted-foreground">{t('generation', {gen: data.generation})}</p>}
        </div>

        {hasChildren && (
            <Button
                variant="ghost"
                size="icon"
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 bg-background border rounded-full z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleCollapse(id);
                }}
            >
                {isCollapsed ? <PlusSquare className="w-3 h-3" /> : <MinusSquare className="w-3 h-3" />}
            </Button>
        )}

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(person)}>
                    <Pencil className="mr-2 h-4 w-4" /> {t('actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddChild(person)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> {t('actions.addChild')}
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600 focus:text-red-600"
                    >
                         <Trash2 className="mr-2 h-4 w-4" /> {t('actions.delete')}
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('alert.title')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('alert.description', {name: person.name})}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('alert.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(person)} className='bg-red-600 hover:bg-red-700'>
                        {t('alert.confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={true} className="!bg-primary" />
    </>
  );
});

EditableNode.displayName = 'EditableNode';


'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionMode,
  Position,
  Node,
  Edge,
  MiniMap,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { getLineageData, updatePerson, addPerson, deletePerson, getAllAncestors as fetchAllAncestors, reorderSiblings } from '@/lib/actions';
import { type Ancestor } from '@/lib/data';
import { EditableNode } from '@/components/editable-node';
import { PersonForm, PersonFormData } from '@/components/person-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const nodeTypes = {
  editable: EditableNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 240;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });
  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

const fitViewOptions = { padding: 0.2 };

// Helper to get all descendant IDs for a given node
const getDescendantIds = (personId: string, allPeople: Ancestor[]): Set<string> => {
    const descendants = new Set<string>();
    const queue: string[] = [personId];
    const personMap = new Map(allPeople.map(p => [p.id, p]));

    const findChildren = (parentId: string) => {
        return allPeople.filter(p => p.fatherId === parentId).map(p => p.id);
    };

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (currentId !== personId) { // Exclude the person themselves from the descendant list
            descendants.add(currentId);
        }
        const children = findChildren(currentId);
        queue.push(...children);
    }
    return descendants;
};


export default function EditTreePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Partial<Ancestor> | null>(null);
  const [lineageData, setLineageData] = useState<Ancestor | null>(null);
  const [allAncestors, setAllAncestors] = useState<Ancestor[]>([]);
  const { toast } = useToast();
  const [newNodes, setNewNodes] = useState<Set<string>>(new Set());
  const [editedNodes, setEditedNodes] = useState<Set<string>>(new Set());
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );
  
  const refetchData = useCallback(async () => {
    const data = await getLineageData();
    const all = await fetchAllAncestors();
    setLineageData(data);
    setAllAncestors(all as Ancestor[]);
  }, []);

  useEffect(() => {
    refetchData();
  }, [refetchData]);
  
  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
            newSet.delete(nodeId);
        } else {
            newSet.add(nodeId);
        }
        return newSet;
    });
  }, []);

  const handleReorder = useCallback(async (personId: string, direction: 'up' | 'down') => {
      try {
          await reorderSiblings(personId, direction);
          toast({
              title: "Success",
              description: "Reordered successfully."
          });
          refetchData();
      } catch (error) {
          toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to reorder."
          });
      }
  }, [refetchData, toast]);


  const createNodesAndEdges = useCallback(() => {
    if (allAncestors.length === 0) return { initialNodes: [], initialEdges: [] };

    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    
    const allAncestorsMap = new Map(allAncestors.map(p => [p.id, p]));
    const childrenMap = new Map<string, Ancestor[]>();

    allAncestors.forEach(p => {
        if(p.fatherId) {
            if(!childrenMap.has(p.fatherId)) {
                childrenMap.set(p.fatherId, []);
            }
            childrenMap.get(p.fatherId)!.push(p);
        }
    });

    const traverse = (anc: Ancestor) => {
      const children = (childrenMap.get(anc.id) || []).sort((a,b) => (a.birthOrder ?? 0) - (b.birthOrder ?? 0));
      const siblings = (childrenMap.get(anc.fatherId!) || []).sort((a,b) => (a.birthOrder ?? 0) - (b.birthOrder ?? 0));
      const myIndex = siblings.findIndex(s => s.id === anc.id);

      initialNodes.push({
        id: anc.id,
        type: 'editable',
        position: { x: 0, y: 0 },
        data: {
          ...anc,
          onEdit: handleEdit,
          onAddChild: handleAddChild,
          onDelete: handleDelete,
          onToggleCollapse: handleToggleCollapse,
          onReorder: handleReorder,
          isNew: newNodes.has(anc.id),
          isEdited: editedNodes.has(anc.id),
          isCollapsed: collapsedNodes.has(anc.id),
          hasChildren: children.length > 0,
          hasSiblings: {
              up: myIndex > 0,
              down: myIndex < siblings.length - 1,
          }
        },
      });

      const isCollapsed = collapsedNodes.has(anc.id);

      if (children.length > 0 && !isCollapsed) {
        children.forEach(child => {
            initialEdges.push({
              id: `e-${anc.id}-${child.id}`,
              source: anc.id,
              target: child.id,
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
            });
            traverse(child);
        });
      }
    };
    
    const rootNodes = allAncestors.filter(p => !p.fatherId).sort((a,b) => (a.birthOrder ?? 0) - (b.birthOrder ?? 0));
    rootNodes.forEach(root => traverse(root));
    
    return { initialNodes, initialEdges };
  }, [allAncestors, newNodes, editedNodes, collapsedNodes, handleToggleCollapse, handleReorder]);

 useEffect(() => {
    if (allAncestors.length === 0) return;
    const { initialNodes, initialEdges } = createNodesAndEdges();
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [allAncestors, createNodesAndEdges, setNodes, setEdges]);


  const handleEdit = (person: Ancestor) => {
    setEditingPerson(person);
    setIsFormOpen(true);
  };

  const handleAddChild = (father: Ancestor) => {
    const children = allAncestors.filter(p => p.fatherId === father.id);
    setEditingPerson({
      name: '',
      generation: father.generation + 1,
      fatherId: father.id,
      birthOrder: children.length + 1,
    });
    setIsFormOpen(true);
  };
  
  const handleAddRoot = () => {
     const roots = allAncestors.filter(p => !p.fatherId);
    setEditingPerson({
      name: '',
      generation: 1,
      fatherId: null,
      birthOrder: roots.length + 1,
    });
    setIsFormOpen(true);
  };
  
  const handleDelete = async (person: Ancestor) => {
      try {
        await deletePerson(person.id);
        toast({
            title: "Success",
            description: `Successfully deleted ${person.name}.`
        })
        refetchData();
      } catch (error) {
           toast({
            variant: 'destructive',
            title: "Error",
            description: `Failed to delete ${person.name}. It may have children.`
        })
      }
  }

  const handleFormSubmit = async (data: PersonFormData) => {
    try {
      if (editingPerson?.id) { // Editing existing person
        await updatePerson(editingPerson.id, data);
        setEditedNodes(prev => new Set(prev).add(editingPerson!.id as string));
        toast({
          title: 'Success',
          description: 'Person updated successfully.',
        });
      } else { // Adding new person
        const payload: Omit<Ancestor, 'id' | 'children'> = {
          name: data.name,
          generation: editingPerson?.generation || 1,
          wife: data.wife,
          description: data.description,
          fatherId: editingPerson?.fatherId || null,
          birthOrder: data.birthOrder,
        }
        const newPerson = await addPerson(payload);
        setNewNodes(prev => new Set(prev).add(newPerson.id));
        toast({
          title: 'Success',
          description: 'Person added successfully.',
        });
      }
      refetchData();
      setIsFormOpen(false);
      setEditingPerson(null);
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Could not save the person. Please try again.';
        toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: errorMessage,
        });
    }
  };

  const potentialFathers = useMemo(() => {
    if (!editingPerson?.id) {
        return allAncestors;
    }
    const descendantIds = getDescendantIds(editingPerson.id, allAncestors);
    descendantIds.add(editingPerson.id); // Also exclude the person themselves
    return allAncestors.filter(p => !descendantIds.has(p.id));
  }, [editingPerson, allAncestors]);


  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col">
       <header className="p-4 border-b bg-background z-10">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold font-headline">Edit Family Tree</h1>
                <div className='flex gap-2'>
                    <Button onClick={handleAddRoot} disabled={nodes.some(n => n.data.generation === 1 && !editingPerson)}>
                        <PlusCircle className="mr-2" /> Add Root Person
                    </Button>
                </div>
            </div>
        </header>
      <div className="flex-grow w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={fitViewOptions}
          connectionMode={ConnectionMode.Loose}
          className="bg-background"
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>

      <PersonForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        personData={editingPerson}
        potentialFathers={potentialFathers}
      />
    </div>
  );
}

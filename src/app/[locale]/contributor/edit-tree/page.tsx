
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
  Panel,
  Connection,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { getLineageData, updatePerson, addPerson, deletePerson, getAllAncestors as fetchAllAncestors, reorderSiblings, getActiveProposal, updateProposedPerson, addProposedPerson, deleteProposedPerson, reorderProposedSiblings } from '@/lib/actions';
import { type Ancestor } from '@/lib/data';
import { useSearchParams } from 'next/navigation';
import { EditableNode } from '@/components/editable-node';
import { PersonForm, PersonFormData } from '@/components/person-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Save, Users, TreePine, Undo2, Redo2, Eye, EyeOff, History, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTranslations } from 'next-intl';


const nodeTypes = {
  editable: EditableNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 240;
const nodeHeight = 80;

// Layout configurations for edit mode
const EDIT_LAYOUT_CONFIGS = {
  compact: { rankdir: 'TB', nodesep: 40, ranksep: 70 },
  comfortable: { rankdir: 'TB', nodesep: 50, ranksep: 80 },
  spacious: { rankdir: 'TB', nodesep: 70, ranksep: 100 }
};

type EditLayoutType = keyof typeof EDIT_LAYOUT_CONFIGS;

interface EditAction {
  id: string;
  type: 'add' | 'edit' | 'delete' | 'reorder';
  personData?: Partial<Ancestor>;
  timestamp: Date;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], layoutConfig = EDIT_LAYOUT_CONFIGS.comfortable) => {
  dagreGraph.setGraph(layoutConfig);
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
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('proposalId');
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Partial<Ancestor> | null>(null);
  const [lineageData, setLineageData] = useState<Ancestor | null>(null);
  const [allAncestors, setAllAncestors] = useState<Ancestor[]>([]);
  const [activeProposal, setActiveProposal] = useState<any>(null);
  const [isProposalMode, setIsProposalMode] = useState(false);
  const { toast } = useToast();
  const [newNodes, setNewNodes] = useState<Set<string>>(new Set());
  const [editedNodes, setEditedNodes] = useState<Set<string>>(new Set());
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [layoutType, setLayoutType] = useState<EditLayoutType>('comfortable');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showBackground, setShowBackground] = useState(true);
  const [editHistory, setEditHistory] = useState<EditAction[]>([]);
  const [selectedTab, setSelectedTab] = useState('tree');
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('EditTreePage');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );
  
  const refetchData = useCallback(async () => {
    if (proposalId) {
      // Load proposal data instead of global data
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const proposal = await getActiveProposal(user.id);
          if (proposal && proposal.id === proposalId) {
            setActiveProposal(proposal);
            setIsProposalMode(true);
            // Convert proposed persons to ancestor format
            const proposedAncestors = proposal.proposedPersons.map((p: any) => ({
              id: p.id,
              name: p.name,
              generation: p.generation,
              wife: p.wife,
              description: p.description,
              birthOrder: p.birthOrder,
              fatherId: p.fatherId
            }));
            setAllAncestors(proposedAncestors);
          }
        }
      } catch (error) {
        console.error('Error loading proposal data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load proposal data.'
        });
      }
    } else {
      // Load global data
      const data = await getLineageData();
      const all = await fetchAllAncestors();
      setLineageData(data);
      setAllAncestors(all as Ancestor[]);
      setIsProposalMode(false);
    }
  }, [proposalId, toast]);

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

  const handleCollapseAll = useCallback(() => {
    const allParents = new Set<string>();
    allAncestors.forEach(ancestor => {
      const hasChildren = allAncestors.some(a => a.fatherId === ancestor.id);
      if (hasChildren) {
        allParents.add(ancestor.id);
      }
    });
    setCollapsedNodes(allParents);
  }, [allAncestors]);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
  }, []);

  const addToHistory = useCallback((action: Omit<EditAction, 'id' | 'timestamp'>) => {
    const newAction: EditAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setEditHistory(prev => [newAction, ...prev.slice(0, 9)]); // Keep last 10 actions
  }, []);

  const handleReorder = useCallback(async (personId: string, direction: 'up' | 'down') => {
      setIsLoading(true);
      try {
          if (isProposalMode) {
            await reorderProposedSiblings(personId, direction);
          } else {
            await reorderSiblings(personId, direction);
          }
          const person = allAncestors.find(a => a.id === personId);
          addToHistory({ type: 'reorder', personData: person });
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
      } finally {
        setIsLoading(false);
      }
  }, [refetchData, toast, allAncestors, addToHistory, isProposalMode]);


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
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges, EDIT_LAYOUT_CONFIGS[layoutType]);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [allAncestors, createNodesAndEdges, setNodes, setEdges, layoutType]);


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
      setIsLoading(true);
      try {
        if (isProposalMode) {
          await deleteProposedPerson(person.id);
        } else {
          await deletePerson(person.id);
        }
        addToHistory({ type: 'delete', personData: person });
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
      } finally {
        setIsLoading(false);
      }
  }

  const handleFormSubmit = async (data: PersonFormData) => {
    setIsLoading(true);
    try {
      const payload = {
          name: data.name,
          generation: editingPerson?.generation || 0, // Placeholder, backend recalculates
          wife: data.wife,
          description: data.description,
          fatherId: data.fatherId || null,
          birthOrder: data.birthOrder,
      };

      if (editingPerson?.id) { // Editing existing person
        if (isProposalMode) {
          await updateProposedPerson(editingPerson.id, payload);
          // Note for Proposal Mode: The proposal system stores 'newData' JSON. 
          // If we want the PROPOSAL to show the correct generation immediately in UI, we might need a fetch or local calc.
          // However, the 'applyRequest' will enforce correctness. 
          // For UI consistency in "Pre-approval", we might still want to guess it, but let's stick to the plan of trusting backend or refresh.
          
        } else {
          await updatePerson(editingPerson.id, payload);
        }
        setEditedNodes(prev => new Set(prev).add(editingPerson!.id as string));
        addToHistory({ type: 'edit', personData: { ...editingPerson, ...payload } });
        toast({
          title: 'Success',
          description: 'Person updated successfully.',
        });
      } else { // Adding new person
        let newPerson;
        if (isProposalMode && activeProposal) {
          newPerson = await addProposedPerson({
            ...payload,
            dataSubmissionId: activeProposal.id
          });
        } else {
          newPerson = await addPerson(payload);
        }
        
        setNewNodes(prev => new Set(prev).add(newPerson.id));
        addToHistory({ type: 'add', personData: newPerson });
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
    } finally {
      setIsLoading(false);
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


  const editStats = useMemo(() => {
    return {
      totalNodes: allAncestors.length,
      newNodes: newNodes.size,
      editedNodes: editedNodes.size,
      generations: allAncestors.length > 0 ? Math.max(...allAncestors.map(a => a.generation)) : 0
    };
  }, [allAncestors, newNodes, editedNodes]);

  return (
    <TooltipProvider>
      <div className="w-full h-[calc(100vh-4rem)] flex flex-col">
         <header className="p-4 border-b bg-background/95 backdrop-blur-sm z-10 sticky top-0">
              <div className="container mx-auto">
                  <div className="flex justify-between items-center mb-4">
                      <div>
                        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                          <TreePine className="w-6 h-6 text-primary" />
                          {isProposalMode ? t('header.editProposal', {name: activeProposal?.ancestorName}) : t('header.editTree')}
                        </h1>
                        {isProposalMode && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                              {t('header.proposalMode')}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{t('stats.people', {count: editStats.totalNodes})}</span>
                          <Separator orientation="vertical" className="h-4" />
                          <span>{t('stats.generations', {count: editStats.generations})}</span>
                          {editStats.newNodes > 0 && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                {t('stats.new', {count: editStats.newNodes})}
                              </Badge>
                            </>
                          )}
                          {editStats.editedNodes > 0 && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                              {t('stats.edited', {count: editStats.editedNodes})}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className='flex gap-2'>
                          <Button 
                            onClick={handleAddRoot} 
                            disabled={isLoading || (nodes.some(n => n.data.generation === 1) && !editingPerson)}
                          >
                              <PlusCircle className="mr-2 w-4 h-4" /> {t('header.addRoot')}
                          </Button>
                      </div>
                  </div>
                  
                  <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
                      <TabsTrigger value="tree" className="flex items-center gap-2">
                        <TreePine className="w-4 h-4" />
                        {t('tabs.tree')}
                      </TabsTrigger>
                      <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        {t('tabs.history', {count: editHistory.length})}
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        {t('tabs.settings')}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
              </div>
          </header>
        
        <div className="flex-1 w-full h-full">
          <Tabs value={selectedTab} className="w-full h-full flex flex-col">
            <TabsContent value="tree" className="flex-1 mt-0">
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
                {showBackground && <Background />}
                <Controls />
                {showMiniMap && <MiniMap nodeStrokeWidth={3} zoomable pannable />}
                
                {/* Enhanced Control Panel */}
                <Panel position="top-left" className="m-2">
                  <Card className="p-3 bg-background/95 backdrop-blur-sm border shadow-lg">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-medium">{t('controls.visible', {count: nodes.length})}</span>
                      </div>
                      
                      {/* Layout Controls */}
                      <div className="flex gap-1">
                        {Object.keys(EDIT_LAYOUT_CONFIGS).map((layout) => (
                          <Button
                            key={layout}
                            variant={layoutType === layout ? "default" : "outline"}
                            size="sm"
                            onClick={() => setLayoutType(layout as EditLayoutType)}
                            className="text-xs px-2 py-1 h-7"
                          >
                            {layout.charAt(0).toUpperCase()}
                          </Button>
                        ))}
                      </div>
                      
                      {/* View Controls */}
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleExpandAll}
                              className="px-2 py-1 h-7"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('controls.expandAll')}</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCollapseAll}
                              className="px-2 py-1 h-7"
                            >
                              <EyeOff className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('controls.collapseAll')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </Card>
                </Panel>
              </ReactFlow>
            </TabsContent>
            
            <TabsContent value="history" className="flex-1 mt-0 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    {t('history.recent')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {t('history.empty')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {editHistory.map((action, index) => (
                        <div key={action.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <Badge variant="outline">
                            {action.type}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium">
                              {action.personData?.name || 'Unknown person'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {action.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="flex-1 mt-0 p-4">
              <div className="grid gap-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.display')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label>{t('settings.minimap')}</label>
                      <Button
                        variant={showMiniMap ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowMiniMap(!showMiniMap)}
                      >
                        {showMiniMap ? t('settings.enabled') : t('settings.disabled')}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label>{t('settings.background')}</label>
                      <Button
                        variant={showBackground ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowBackground(!showBackground)}
                      >
                        {showBackground ? t('settings.enabled') : t('settings.disabled')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.statistics')}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">{editStats.totalNodes}</div>
                      <div className="text-sm text-muted-foreground">{t('settings.totalPeople')}</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">{editStats.generations}</div>
                      <div className="text-sm text-muted-foreground">{t('settings.totalGenerations')}</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{editStats.newNodes}</div>
                      <div className="text-sm text-muted-foreground">{t('settings.newAdditions')}</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{editStats.editedNodes}</div>
                      <div className="text-sm text-muted-foreground">{t('settings.modified')}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <PersonForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          personData={editingPerson}
          potentialFathers={potentialFathers}
        />
      </div>
    </TooltipProvider>
  );
}

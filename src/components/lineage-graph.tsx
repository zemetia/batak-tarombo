
'use client';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  useReactFlow,
} from 'reactflow';
import dagre from 'dagre';

import 'reactflow/dist/style.css';

import { CustomNode } from './custom-node';
import { type Ancestor } from '@/lib/data';
import { AncestorProfile } from './ancestor-profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge'; // Unused
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TriangleAlert, Maximize, Minimize, Eye, EyeOff, Users, Filter, Layers, TreePine } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { cn } from '@/lib/utils'; // Unused

const nodeTypes = {
  custom: CustomNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 60;

// Enhanced layout configuration
const LAYOUT_CONFIGS = {
  compact: { rankdir: 'TB', nodesep: 30, ranksep: 60 },
  comfortable: { rankdir: 'TB', nodesep: 40, ranksep: 80 },
  spacious: { rankdir: 'TB', nodesep: 60, ranksep: 100 }
};

type LayoutType = keyof typeof LAYOUT_CONFIGS;

const getLayoutedElements = (nodes: Node[], edges: Edge[], layoutConfig = LAYOUT_CONFIGS.comfortable) => {
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

interface LineageGraphProps {
    searchQuery: string;
    initialData: Ancestor;
}

interface GraphStats {
    totalNodes: number;
    visibleNodes: number;
    maxGeneration: number;
    minGeneration: number;
}

export function LineageGraph({ searchQuery, initialData }: LineageGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedAncestor, setSelectedAncestor] = useState<Ancestor | null>(null);
  const selectedAncestorRef = useRef<Ancestor | null>(null); // Ref to access current selected without triggering effect
  
  const [generationStartNode, setGenerationStartNode] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [layoutType, setLayoutType] = useState<LayoutType>('comfortable');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showBackground, setShowBackground] = useState(true);
  const [showGenNumbers, setShowGenNumbers] = useState(true);
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());
  const [graphStats, setGraphStats] = useState<GraphStats>({ totalNodes: 0, visibleNodes: 0, maxGeneration: 0, minGeneration: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Sync ref with state
  useEffect(() => {
    selectedAncestorRef.current = selectedAncestor;
  }, [selectedAncestor]);

  // Separate effect for selection highlighting to avoid re-layout/fitView
  useEffect(() => {
    setNodes((nds) => nds.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isSelected: node.id === selectedAncestor?.id
      }
    })));
  }, [selectedAncestor, setNodes]);

  const handleFullscreen = () => {
    if (reactFlowWrapper.current) {
        if (!document.fullscreenElement) {
            reactFlowWrapper.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  const handleNodeClick = useCallback((ancestor: Ancestor) => {
    setSelectedAncestor(ancestor);
    // Selection update handled by separate effect
  }, []);

  const handleStartGenerationFrom = useCallback((ancestorId: string) => {
      setGenerationStartNode(ancestorId);
  }, []);

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
    const traverse = (ancestor: Ancestor) => {
      if (ancestor.children && ancestor.children.length > 0) {
        allParents.add(ancestor.id);
        ancestor.children.forEach(traverse);
      }
    };
    if (initialData) traverse(initialData);
    setCollapsedNodes(allParents);
  }, [initialData]);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
  }, []);

  const handleHighlightPath = useCallback((ancestorId: string) => {
    if (!initialData) return;
    
    const getPathToRoot = (root: Ancestor, targetId: string, path: string[] = []): string[] | null => {
      const currentPath = [...path, root.id];
      if (root.id === targetId) return currentPath;
      
      if (root.children) {
        for (const child of root.children) {
          const result = getPathToRoot(child, targetId, currentPath);
          if (result) return result;
        }
      }
      return null;
    };

    const pathIds = getPathToRoot(initialData, ancestorId);
    setHighlightedPath(new Set(pathIds || []));
  }, [initialData]);

  const mainLineageIds = useMemo(() => {
    const ids: string[] = [];
    let current: Ancestor | undefined = initialData;
    while(current) {
        ids.push(current.id);
        current = current.children?.[0];
    }
    return ids;
  }, [initialData]);

  const filterLineage = useCallback((root: Ancestor, query: string): Ancestor | null => {
    const lowerCaseQuery = query.toLowerCase();
    const matchingNodes: Ancestor[] = [];
    
    const findMatches = (ancestor: Ancestor) => {
        if (ancestor.name.toLowerCase().includes(lowerCaseQuery)) {
            matchingNodes.push(ancestor);
        }
        if (ancestor.children) {
            ancestor.children.forEach(findMatches);
        }
    };
    
    findMatches(root);

    if (matchingNodes.length === 0) return null;

    // For simplicity, we focus on the first match and its direct lineage.
    const mainMatch = matchingNodes[0];
    const pathToMainMatch: string[] = [];
    
    const findPath = (ancestor: Ancestor, targetId: string, currentPath: string[]): boolean => {
        currentPath.push(ancestor.id);
        if (ancestor.id === targetId) return true;
        if (ancestor.children) {
            for (const child of ancestor.children) {
                if (findPath(child, targetId, currentPath)) return true;
            }
        }
        currentPath.pop();
        return false;
    };

    findPath(root, mainMatch.id, pathToMainMatch);

    const buildFilteredTree = (ancestor: Ancestor, path: Set<string>): Ancestor | null => {
        if (!path.has(ancestor.id)) return null;

        let children: Ancestor[] = [];
        if (ancestor.id === mainMatch.id) {
            // If this is the matched node, include all its children
            children = ancestor.children?.map(c => ({...c})) || [];
        } else if (ancestor.children) {
            // Otherwise, only include children that are on the path
            children = ancestor.children.map(child => buildFilteredTree(child, path)).filter(Boolean) as Ancestor[];
        }
        
        return { ...ancestor, children };
    };

    return buildFilteredTree(root, new Set(pathToMainMatch));
  }, []);

  // Main Layout Effect
  useEffect(() => {
    if (!initialData) return;

    let startAncestor: Ancestor | null = initialData;
    if (generationStartNode) {
        const findStart = (anc: Ancestor): Ancestor | null => {
            if (anc.id === generationStartNode) return anc;
            if (anc.children) {
                for (const child of anc.children) {
                    const found = findStart(child);
                    if (found) return found;
                }
            }
            return null;
        }
        startAncestor = findStart(initialData) || initialData;
    }
    
    let filteredData = searchQuery ? filterLineage(initialData, searchQuery) : startAncestor;

    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    const isSelected = (ancestor: Ancestor) => selectedAncestorRef.current?.id === ancestor.id;

    const getGenerationOffset = (root: Ancestor, startId: string | null): number => {
        if (!startId) return 0;
        
        const findNode = (node: Ancestor, id: string): {node: Ancestor, path: Ancestor[]} | null => {
            if (node.id === id) return {node, path: [node]};
            if (node.children) {
                for (const child of node.children) {
                    const result = findNode(child, id);
                    if (result) {
                        return {node: result.node, path: [node, ...result.path]};
                    }
                }
            }
            return null;
        }

        const startNodeInfo = findNode(root, startId);
        if (startNodeInfo) {
            return 1 - startNodeInfo.node.generation;
        }
        return 0;
    };

    const generationOffset = getGenerationOffset(initialData, generationStartNode) || 0;

    const createNode = (ancestor: Ancestor): Node => {
      const newGen = ancestor.generation + generationOffset;
      const displayGeneration = generationStartNode ? newGen >= 1 : true;
      const isCollapsed = collapsedNodes.has(ancestor.id);
      const isHighlighted = highlightedPath.has(ancestor.id);
      
      return {
        id: ancestor.id,
        type: 'custom',
        position: { x: 0, y: 0 }, // Position will be set by dagre
        data: {
            label: ancestor.name,
            generation: showGenNumbers && displayGeneration ? newGen : undefined,
            onClick: handleNodeClick,
            onToggleCollapse: handleToggleCollapse,
            onHighlightPath: handleHighlightPath,
            rawAncestor: ancestor,
            isSelected: isSelected(ancestor),
            isCollapsed: isCollapsed,
            isHighlighted: isHighlighted,
            hasChildren: !!ancestor.children && ancestor.children.length > 0
        },
      }
    };

    const createEdge = (sourceId: string, targetId: string): Edge => {
      const isHighlighted = highlightedPath.has(sourceId) && highlightedPath.has(targetId);
      return {
        id: `e-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        type: 'smoothstep',
        animated: isHighlighted,
        style: {
          stroke: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          strokeWidth: isHighlighted ? 3 : 2,
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'
        },
      }
    };

    const traverse = (ancestor: Ancestor) => {
      allNodes.push(createNode(ancestor));
      const isCollapsed = collapsedNodes.has(ancestor.id);
      if (ancestor.children && !isCollapsed) {
        ancestor.children.forEach(child => {
          allEdges.push(createEdge(ancestor.id, child.id));
          traverse(child);
        });
      }
    };

    if (filteredData) {
        traverse(filteredData);
    }
    
    if (allNodes.length === 0 && searchQuery) {
        setNodes([]);
        setEdges([]);
    } else {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(allNodes, allEdges, LAYOUT_CONFIGS[layoutType]);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        
        // Calculate stats
        const generations = allNodes.map(n => n.data.generation).filter(Boolean);
        setGraphStats({
          totalNodes: allNodes.length,
          visibleNodes: allNodes.length,
          maxGeneration: Math.max(...generations, 0),
          minGeneration: Math.min(...generations, 0)
        });
        
        // FIT VIEW LOGIC: Only strictly when structure changes significantly or search changes.
        // We do basic fit view, but we can refine it.
        // Using setTimeout to allow render
        const mainLineageNodes = layoutedNodes.filter(n => mainLineageIds.includes(n.id));
        setTimeout(() => fitView({ nodes: mainLineageNodes.length > 0 ? mainLineageNodes : undefined, padding: 0.2, minZoom: 0.5 }), 50);
    }
    // Removed selectedAncestor from dependencies to prevent reset on click
  }, [
    handleNodeClick, 
    searchQuery, 
    setNodes, 
    setEdges, 
    generationStartNode, 
    initialData, 
    collapsedNodes, 
    layoutType, 
    showGenNumbers, 
    highlightedPath, 
    handleHighlightPath, 
    fitView, 
    mainLineageIds,
    handleToggleCollapse,
    filterLineage
  ]);
  
  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedAncestor(null);
      // Clean up selection will happen via the selection effect
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full h-full rounded-lg border bg-card relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          // Remove default fitView prop to manually control it
          connectionMode={ConnectionMode.Loose}
          className="bg-background"
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          maxZoom={1.5}
        >
          {showBackground && <Background />}
          {/* Controls positioned clean at bottom right */}
          <Controls position="top-left" className="mt-20 ml-2" showInteractive={false} />
          
          {/* Consolidated Control Panel - Bottom Center/Left to avoid overlap */}
          <Panel position="bottom-center" className="m-4 flex gap-4">
             {/* Graph Stats & Filters */}
            <Card className="p-2 bg-background/95 backdrop-blur-sm border shadow-lg flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm px-2">
                  <TreePine className="w-4 h-4 text-primary" />
                  <span className="font-medium whitespace-nowrap">{graphStats.visibleNodes} nodes</span>
                </div>
                
                <Separator orientation="vertical" className="h-4" />

                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleExpandAll} className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Expand all</p></TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleCollapseAll} className="h-8 w-8">
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Collapse all</p></TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant={showGenNumbers ? "default" : "ghost"} size="icon" onClick={() => setShowGenNumbers(!showGenNumbers)} className="h-8 w-8">
                        <Layers className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Toggle Generations</p></TooltipContent>
                  </Tooltip>

                   <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant={showMiniMap ? "default" : "ghost"} size="icon" onClick={() => setShowMiniMap(!showMiniMap)} className="h-8 w-8">
                        <Users className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Toggle Minimap</p></TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant={showBackground ? "default" : "ghost"} size="icon" onClick={() => setShowBackground(!showBackground)} className="h-8 w-8">
                        <Filter className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Toggle Grid</p></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleFullscreen} className="h-8 w-8">
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</p></TooltipContent>
                    </Tooltip>
                </div>
            </Card>

            {/* Layout Switcher */}
             <Card className="p-2 bg-background/95 backdrop-blur-sm border shadow-lg flex items-center gap-1">
                  {Object.keys(LAYOUT_CONFIGS).map((layout) => (
                    <Tooltip key={layout}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={layoutType === layout ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setLayoutType(layout as LayoutType)}
                          className="text-xs px-2 py-1 h-7"
                        >
                          {layout.charAt(0).toUpperCase()}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{layout.charAt(0).toUpperCase() + layout.slice(1)} layout</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
            </Card>

            {highlightedPath.size > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setHighlightedPath(new Set())}>
                Clear Path
                </Button>
            )}
          </Panel>
          
          {showMiniMap && (
              <Panel position="bottom-right" className="m-2">
                 <div className="border rounded-lg overflow-hidden shadow-lg bg-background">
                     <MiniMap nodeStrokeWidth={3} zoomable pannable style={{height: 120, width: 160}} />
                 </div>
              </Panel>
          )}

          {nodes.length === 0 && searchQuery && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
               <Alert className="max-w-md">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>No Ancestor Found</AlertTitle>
                  <AlertDescription>
                      No results found for &quot;{searchQuery}&quot;. Please try another name.
                  </AlertDescription>
              </Alert>
            </div>
          )}
        </ReactFlow>
        <AncestorProfile
          ancestor={selectedAncestor}
          isOpen={!!selectedAncestor}
          onOpenChange={handleSheetOpenChange}
          onStartGenerationFrom={handleStartGenerationFrom}
        />
      </div>
    </TooltipProvider>
  );
};

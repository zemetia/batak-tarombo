
'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  useReactFlow,
  Panel,
} from 'reactflow';
import dagre from 'dagre';

import 'reactflow/dist/style.css';

import { CustomNode } from './custom-node';
import { type Ancestor } from '@/lib/data';
import { AncestorProfile } from './ancestor-profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 60;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 80 });
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

// This is a new component that will handle the centering logic.
const ViewportCenter = ({ mainLineageIds }: { mainLineageIds: string[] }) => {
  const { getNodes, setNodes, fitView } = useReactFlow();
  const nodes = getNodes();

  useEffect(() => {
    if (nodes.length === 0 || mainLineageIds.length === 0) return;

    // Find the nodes that are part of the main lineage
    const mainLineageNodes = mainLineageIds
      .map(id => nodes.find(node => node.id === id))
      .filter(Boolean) as Node[];

    if (mainLineageNodes.length === 0) return;

    // Calculate the average X position of the main lineage
    const totalX = mainLineageNodes.reduce((sum, node) => sum + node.position.x + (node.width ? node.width / 2 : 0), 0);
    const averageX = totalX / mainLineageNodes.length;

    // Get the viewport center X
    const viewport = document.querySelector('.react-flow__viewport');
    const viewportCenterX = viewport ? viewport.clientWidth / 2 : 0;
    
    // Calculate the offset needed to center the lineage
    const offsetX = viewportCenterX - averageX;

    // Apply the offset to all nodes
    const shiftedNodes = getNodes().map(node => ({
        ...node,
        position: {
            ...node.position,
            x: node.position.x + offsetX
        }
    }));

    setNodes(shiftedNodes);

    // Fit the view to only the main lineage nodes
    setTimeout(() => {
        fitView({
            nodes: mainLineageNodes.map(n => ({ id: n.id })),
            padding: 0.2,
            duration: 300,
        });
    }, 10);

  }, [nodes.length, mainLineageIds.join(',')]); // Rerun when nodes or the lineage changes

  return null;
};


interface LineageGraphProps {
    searchQuery: string;
    initialData: Ancestor;
}

export function LineageGraph({ searchQuery, initialData }: LineageGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedAncestor, setSelectedAncestor] = useState<Ancestor | null>(null);
  const [generationStartNode, setGenerationStartNode] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

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
    setNodes(currentNodes =>
        currentNodes.map(n => ({
            ...n,
            data: { ...n.data, isSelected: n.id === ancestor.id }
        }))
    );
  }, [setNodes]);

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

  const filterLineage = useCallback((ancestor: Ancestor, query: string): Ancestor | null => {
    if (!query) {
      return ancestor;
    }

    const lowerCaseQuery = query.toLowerCase();
    
    // Find all nodes that match the search query
    const matchingNodes: Ancestor[] = [];
    const traverseForMatches = (current: Ancestor) => {
      if (current.name.toLowerCase().includes(lowerCaseQuery)) {
        matchingNodes.push(current);
      }
      if (current.children) {
        current.children.forEach(traverseForMatches);
      }
    };
    traverseForMatches(ancestor);
    
    if (matchingNodes.length === 0) return null;
    
    const primaryMatch = matchingNodes[0];

    const getPathToRoot = (root: Ancestor, targetId: string): Ancestor[] | null => {
      if (root.id === targetId) return [root];
      if (root.children) {
        for (const child of root.children) {
          const path = getPathToRoot(child, targetId);
          if (path) return [root, ...path];
        }
      }
      return null;
    };

    const pathToMatch = getPathToRoot(ancestor, primaryMatch.id);

    if (!pathToMatch) return null;

    // Reconstruct the tree with only the path and the children of the matched node
    const buildFilteredTree = (path: Ancestor[]): Ancestor => {
        const root = { ...path[0], children: [] };
        let currentNode = root;

        for (let i = 1; i < path.length; i++) {
            const nextNodeInPath = { ...path[i], children: [] };
            if (i === path.length - 1) { // This is the matched node
                const originalNode = path[i];
                // Deep copy children to avoid issues with shared references
                nextNodeInPath.children = originalNode.children ? JSON.parse(JSON.stringify(originalNode.children)) : [];
            }
            currentNode.children = [nextNodeInPath];
            currentNode = nextNodeInPath;
        }
        
        return root;
    };

    return buildFilteredTree(pathToMatch);
  }, []);

  const mainLineageIds = useMemo(() => {
    const ids: string[] = [];
    let currentNode: Ancestor | undefined = initialData;
    while(currentNode) {
        ids.push(currentNode.id);
        currentNode = currentNode.children?.[0];
    }
    return ids;
  }, [initialData]);

  useEffect(() => {
    if (!initialData) return;

    let filteredData = filterLineage(initialData, searchQuery);
    
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    const isSelected = (ancestor: Ancestor) => selectedAncestor?.id === ancestor.id;

    let startAncestor: Ancestor | null = null;
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
        startAncestor = filteredData ? findStart(filteredData) : null;
        if(startAncestor) filteredData = startAncestor;
    }

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
      
      return {
        id: ancestor.id,
        type: 'custom',
        position: { x: 0, y: 0 }, // Position will be set by dagre
        data: {
            label: ancestor.name,
            generation: displayGeneration ? newGen : undefined,
            onClick: handleNodeClick,
            onToggleCollapse: handleToggleCollapse,
            rawAncestor: ancestor,
            isSelected: isSelected(ancestor),
            isCollapsed: isCollapsed,
            hasChildren: !!ancestor.children && ancestor.children.length > 0
        },
      }
    };

    const createEdge = (sourceId: string, targetId: string): Edge => ({
        id: `e-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
    });

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
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(allNodes, allEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }
  }, [handleNodeClick, selectedAncestor, searchQuery, filterLineage, setNodes, setEdges, generationStartNode, initialData, collapsedNodes, handleToggleCollapse]);
  
  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedAncestor(null);
       setNodes(currentNodes =>
        currentNodes.map(n => ({
            ...n,
            data: { ...n.data, isSelected: false }
        }))
    );
    }
  };

  return (
    <div className="w-full h-full rounded-lg border bg-card relative">
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
        <ViewportCenter mainLineageIds={mainLineageIds} />
      </ReactFlow>
      <AncestorProfile
        ancestor={selectedAncestor}
        isOpen={!!selectedAncestor}
        onOpenChange={handleSheetOpenChange}
        onStartGenerationFrom={handleStartGenerationFrom}
      />
    </div>
  );
};

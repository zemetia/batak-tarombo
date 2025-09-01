
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, ChevronRight } from 'lucide-react';
import { getAllAncestors } from '@/lib/actions';
import { type Ancestor } from '@/lib/data';

interface AncestorSelectorProps {
  onSelect: (ancestor: Ancestor) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface AncestorWithDescendants extends Ancestor {
  descendantsCount: number;
  hasChildren: boolean;
}

export function AncestorSelector({ onSelect, onCancel, isLoading = false }: AncestorSelectorProps) {
  const [ancestors, setAncestors] = useState<AncestorWithDescendants[]>([]);
  const [filteredAncestors, setFilteredAncestors] = useState<AncestorWithDescendants[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAncestor, setSelectedAncestor] = useState<AncestorWithDescendants | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAncestors();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = ancestors.filter(ancestor => 
        ancestor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ancestor.generation.toString().includes(searchTerm)
      );
      setFilteredAncestors(filtered);
    } else {
      setFilteredAncestors(ancestors);
    }
  }, [searchTerm, ancestors]);

  const loadAncestors = async () => {
    try {
      const allPeople = await getAllAncestors() as Ancestor[];
      
      // Create a map for quick lookup
      const peopleMap = new Map<string, Ancestor>();
      allPeople.forEach(person => {
        peopleMap.set(person.id, person);
      });

      // Calculate descendants count for each person
      const ancestorsWithDescendants: AncestorWithDescendants[] = allPeople.map(person => {
        const descendants = getDescendantsCount(person.id, allPeople);
        const hasChildren = allPeople.some(p => p.fatherId === person.id);
        
        return {
          ...person,
          descendantsCount: descendants,
          hasChildren
        };
      }).filter(ancestor => 
        // Only show ancestors who have children or are potential marga heads
        ancestor.hasChildren || ancestor.generation <= 4
      ).sort((a, b) => {
        // Sort by generation first, then by descendants count (desc), then by name
        if (a.generation !== b.generation) {
          return a.generation - b.generation;
        }
        if (a.descendantsCount !== b.descendantsCount) {
          return b.descendantsCount - a.descendantsCount;
        }
        return a.name.localeCompare(b.name);
      });

      setAncestors(ancestorsWithDescendants);
      setFilteredAncestors(ancestorsWithDescendants);
    } catch (error) {
      console.error('Error loading ancestors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDescendantsCount = (ancestorId: string, allPeople: Ancestor[]): number => {
    const children = allPeople.filter(person => person.fatherId === ancestorId);
    let count = children.length;
    
    children.forEach(child => {
      count += getDescendantsCount(child.id, allPeople);
    });
    
    return count;
  };

  const handleSelect = () => {
    if (selectedAncestor) {
      onSelect(selectedAncestor);
    }
  };

  const getGenerationLabel = (generation: number) => {
    switch (generation) {
      case 1: return 'Founder';
      case 2: return '2nd Gen';
      case 3: return '3rd Gen';
      case 4: return '4th Gen';
      default: return `${generation}th Gen`;
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col h-full">
            <div className="text-center py-8 flex-1 flex flex-col justify-center items-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading ancestors...</p>
            </div>
        </div>
    );
  }

  return (
     <div className="flex flex-col h-full">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search ancestors by name or generation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Ancestor Info */}
        {selectedAncestor && (
          <Card className="border-primary mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedAncestor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedAncestor.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{getGenerationLabel(selectedAncestor.generation)}</Badge>
                      <span>•</span>
                      <span>{selectedAncestor.descendantsCount} descendants</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ancestors List */}
        <ScrollArea className="flex-1 -mx-6">
          <div className="px-6 space-y-2">
            {filteredAncestors.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No ancestors found matching your search.' : 'No ancestors available.'}
                </p>
              </div>
            ) : (
              filteredAncestors.map((ancestor) => (
                <Card
                  key={ancestor.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedAncestor?.id === ancestor.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedAncestor(ancestor)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {ancestor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{ancestor.name}</h4>
                          {ancestor.wife && (
                            <p className="text-sm text-muted-foreground">
                              Married to {ancestor.wife}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            {getGenerationLabel(ancestor.generation)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ancestor.descendantsCount} descendants
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedAncestor || isLoading}
          >
            {isLoading ? 'Creating Proposal...' : 'Create Proposal'}
          </Button>
        </div>
      </div>
  );
}

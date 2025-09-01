
'use client';

import { LineageGraph } from '@/components/lineage-graph';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search, Users, TreePine, Sparkles, TrendingUp, Crown, Filter, X } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Ancestor } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { getLineageData, getAllAncestors } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { ReactFlowProvider } from 'reactflow';


export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Ancestor[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [generationFilter, setGenerationFilter] = useState<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [lineageData, setLineageData] = useState<Ancestor | null>(null);
  const [allAncestors, setAllAncestors] = useState<Ancestor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
        try {
          setIsLoading(true);
          const [lineage, ancestors] = await Promise.all([
              getLineageData(),
              getAllAncestors()
          ]);
          setLineageData(lineage);
          setAllAncestors(ancestors as Ancestor[]);
        } catch (error) {
          console.error('Failed to load data:', error);
        } finally {
          setIsLoading(false);
        }
    };
    fetchData();
    
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 1) {
      let filteredSuggestions = allAncestors.filter(ancestor =>
        ancestor.name.toLowerCase().includes(query.toLowerCase())
      );
      
      // Apply generation filter if set
      if (generationFilter) {
        filteredSuggestions = filteredSuggestions.filter(ancestor => 
          ancestor.generation === generationFilter
        );
      }
      
      // Sort by relevance (exact matches first, then by generation)
      filteredSuggestions.sort((a, b) => {
        const aExact = a.name.toLowerCase().startsWith(query.toLowerCase());
        const bExact = b.name.toLowerCase().startsWith(query.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.generation - b.generation;
      });
      
      setSuggestions(filteredSuggestions.slice(0, 8)); // Limit to 8 suggestions
      setIsSuggestionsVisible(true);
    } else {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = (ancestor: Ancestor) => {
    setSearchQuery(ancestor.name);
    setSuggestions([]);
    setIsSuggestionsVisible(false);
    
    // Add to search history
    const newHistory = [ancestor.name, ...searchHistory.filter(h => h !== ancestor.name)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setIsSuggestionsVisible(false);
    setGenerationFilter(null);
  };
  
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
      setIsSuggestionsVisible(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (allAncestors.length === 0) return null;
    
    const generations = [...new Set(allAncestors.map(a => a.generation))].sort((a, b) => a - b);
    
    return {
      totalPeople: allAncestors.length,
      generations: generations.length,
      maxGeneration: Math.max(...generations),
    };
  }, [allAncestors]);


  return (
    <div className="w-full h-[calc(100vh-4rem)] relative">
       <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex justify-between items-start">
            {/* Search - takes up center space */}
            <div ref={searchContainerRef} className="relative max-w-2xl mx-auto w-full pointer-events-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for an ancestor..."
                  className={cn(
                    "w-full pl-12 pr-20 py-5 text-md rounded-full shadow-lg transition-all duration-200",
                    "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    searchQuery && "pr-32"
                  )}
                  aria-label="Search for an ancestor"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => { if(searchQuery) setIsSuggestionsVisible(true)}}
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {generationFilter && (
                    <Badge variant="outline" className="text-xs">
                      Gen {generationFilter}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0"
                        onClick={() => setGenerationFilter(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className={cn(
                      "h-8 w-8 rounded-full",
                      showAdvancedSearch && "bg-primary/10 text-primary"
                    )}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearSearch}
                      className="h-8 w-8 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {showAdvancedSearch && (
                <Card className="absolute top-full mt-2 w-full z-30 shadow-xl border-primary/20">
                  <CardHeader className="pb-3">
                    <h3 className="font-semibold text-sm">Filter by Generation</h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {stats && Array.from({length: stats.maxGeneration}, (_, i) => i + 1).map(gen => (
                        <Button
                          key={gen}
                          variant={generationFilter === gen ? "default" : "outline"}
                          size="sm"
                          onClick={() => setGenerationFilter(generationFilter === gen ? null : gen)}
                          className="text-xs"
                        >
                          Gen {gen}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {isSuggestionsVisible && suggestions.length > 0 && (
                <Card className="absolute top-full mt-2 w-full z-20 shadow-xl max-h-80 overflow-y-auto">
                    <ul className="divide-y">
                      {suggestions.map(ancestor => (
                        <li
                          key={ancestor.id}
                          className="p-4 hover:bg-accent/50 flex items-center gap-4 cursor-pointer transition-colors duration-150"
                          onClick={() => handleSuggestionClick(ancestor)}
                        >
                          <Avatar className="w-10 h-10 border ring-2 ring-primary/10">
                            <AvatarFallback className="bg-primary/10">
                              {ancestor.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{ancestor.name}</p>
                                {ancestor.generation === 1 && (
                                  <Crown className="w-3 h-3 text-amber-500" />
                                )}
                                {ancestor.wife && (
                                  <Badge variant="secondary" className="text-xs">Married</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Generation {ancestor.generation}</span>
                                {ancestor.wife && (
                                  <>
                                    <span>•</span>
                                    <span>Wife: {ancestor.wife}</span>
                                  </>
                                )}
                              </div>
                          </div>
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        </li>
                      ))}
                    </ul>
                </Card>
              )}
              
              {!searchQuery && searchHistory.length > 0 && (
                <Card className="absolute top-full mt-2 w-full z-15 shadow-lg">
                  <CardHeader className="pb-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">Recent Searches</h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.map((query, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery(query)}
                          className="text-xs h-7 px-2"
                        >
                          {query}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Statistics Bar */}
            {stats && (
              <div className="pointer-events-auto">
                <Card className="p-3 bg-primary/5 border-primary/20 shadow-md">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-medium">{stats.totalPeople}</span>
                      <span className="text-muted-foreground">People</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                      <TreePine className="w-4 h-4 text-primary" />
                      <span className="font-medium">{stats.generations}</span>
                      <span className="text-muted-foreground">Generations</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-full">
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading lineage data...</p>
            </div>
          </div>
        ) : lineageData ? (
           <ReactFlowProvider>
            <LineageGraph searchQuery={searchQuery} initialData={lineageData} />
          </ReactFlowProvider>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center">
              <TreePine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No lineage data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

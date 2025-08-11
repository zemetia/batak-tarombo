
'use client';

import { LineageGraph } from '@/components/lineage-graph';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Ancestor } from '@/lib/data';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { getLineageData, getAllAncestors } from '@/lib/actions';


export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Ancestor[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [lineageData, setLineageData] = useState<Ancestor | null>(null);
  const [allAncestors, setAllAncestors] = useState<Ancestor[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
        const [lineage, ancestors] = await Promise.all([
            getLineageData(),
            getAllAncestors()
        ]);
        setLineageData(lineage);
        setAllAncestors(ancestors as Ancestor[]);
    };
    fetchData();
  }, []);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 1) {
      const filteredSuggestions = allAncestors.filter(ancestor =>
        ancestor.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
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


  return (
    <div className="w-full flex flex-col" style={{height: 'calc(100vh - 4rem)'}}>
       <div className="bg-background/80 backdrop-blur-sm z-10 pt-8 pb-6 border-b">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
          <div className='w-full items-center flex justify-center'>
            <Image
              src='/images/tarombo.png'
              alt='tarombo'
              width={500}
              height={100}
            />
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            Explore the rich family history of the Batak people. Search for your ancestors and discover your roots.
          </p>
          <div ref={searchContainerRef} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for an ancestor..."
                className="w-full pl-12 pr-4 py-7 text-lg rounded-full shadow-lg"
                aria-label="Search for an ancestor"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => { if(searchQuery) setIsSuggestionsVisible(true)}}
              />
            </div>
             {isSuggestionsVisible && suggestions.length > 0 && (
              <Card className="absolute top-full mt-2 w-full z-20 shadow-xl max-h-80 overflow-y-auto">
                  <ul className="divide-y">
                    {suggestions.map(ancestor => (
                       <li
                        key={ancestor.id}
                        className="p-4 hover:bg-accent flex items-center gap-4 cursor-pointer"
                        onClick={() => handleSuggestionClick(ancestor)}
                      >
                         <Avatar className="w-10 h-10 border">
                           <AvatarFallback>{ancestor.name.charAt(0)}</AvatarFallback>
                         </Avatar>
                         <div>
                            <p className="font-semibold">{ancestor.name}</p>
                            <p className="text-sm text-muted-foreground">Generation {ancestor.generation}</p>
                         </div>
                      </li>
                    ))}
                  </ul>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-full">
        {lineageData ? (
          <LineageGraph searchQuery={searchQuery} initialData={lineageData} />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <p>Loading lineage data...</p>
          </div>
        )}
      </div>
    </div>
  );
}

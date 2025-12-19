'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { Ancestor } from '@/lib/data';
import { User, Users, PlayCircle, Heart } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useTranslations } from 'next-intl';

interface AncestorProfileProps {
  ancestor: Ancestor | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStartGenerationFrom: (ancestorId: string) => void;
}

export function AncestorProfile({
  ancestor,
  isOpen,
  onOpenChange,
  onStartGenerationFrom,
}: AncestorProfileProps) {
  const t = useTranslations('AncestorProfile');
  if (!ancestor) return null;

  const handleStartGeneration = () => {
    onStartGenerationFrom(ancestor!.id);
    onOpenChange(false);
  };


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[540px] p-0 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="relative h-48">
            <Image
              src="https://placehold.co/600x400"
              alt={`${ancestor.name}'s legacy`}
              layout="fill"
              objectFit="cover"
              className="bg-muted"
              data-ai-hint="lineage tradition"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>
          <div className="relative -mt-16 px-6 z-10">
            <SheetHeader className="flex-row items-end space-x-4">
               <Avatar className="w-24 h-24 border-4 border-background ring-2 ring-primary">
                <AvatarImage src={`https://placehold.co/100x100.png`} />
                <AvatarFallback className="text-3xl">
                  {ancestor.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="pb-2">
                <SheetTitle className="text-3xl font-headline">{ancestor.name}</SheetTitle>
                <SheetDescription>
                  {ancestor.generation && t('generation', {gen: ancestor.generation})}
                </SheetDescription>
              </div>
            </SheetHeader>
          </div>
          
          <div className="p-6 space-y-6">
              <Button onClick={handleStartGeneration} className="w-full">
                <PlayCircle className="mr-2 h-4 w-4" />
                {t('startGeneration')}
              </Button>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold font-headline mb-3 flex items-center">
                  <User className="w-5 h-5 mr-3 text-primary" />
                  {t('about')}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    {t('descDefault', {name: ancestor.name})}
                </p>
              </div>

              {ancestor.wife && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold font-headline mb-3 flex items-center">
                      <Heart className="w-5 h-5 mr-3 text-primary" />
                      {t('wife')}
                    </h3>
                    <p className="text-muted-foreground text-sm">{ancestor.wife}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h3 className="text-lg font-semibold font-headline mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-3 text-primary" />
                  {t('children')}
                </h3>
                {ancestor.children && ancestor.children.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ancestor.children.map((child) => (
                      <div key={child.id} className="flex items-center space-x-3 p-2 rounded-md transition-colors border bg-accent/50">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src="https://placehold.co/100x100" />
                          <AvatarFallback>
                             {child.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{child.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t('noChildren')}</p>
                )}
              </div>
          </div>
        </ScrollArea>
        <SheetFooter className="p-4 border-t bg-background">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>{t('close')}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

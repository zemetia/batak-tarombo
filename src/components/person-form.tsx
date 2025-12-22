
'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Ancestor } from '@/lib/data';
import { useEffect } from 'react';
import { ComboBox } from './ui/combobox';
import { useTranslations } from 'next-intl';



// Define type based on a base schema if needed, but since we use dynamic schema inside, 
// we might need to define a static type or infer from the inner one. 
// However, for the props interface, we can just use a manual type or keep the interface compatible.
export type PersonFormData = {
  name: string;
  gender: 'MALE' | 'FEMALE';
  wife?: string;
  description?: string;
  fatherId?: string | null;
  birthOrder?: number;
};

interface PersonFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: PersonFormData) => void;
  personData: Partial<Ancestor> | null;
  potentialFathers: Ancestor[];
}

export function PersonForm({ isOpen, onOpenChange, onSubmit, personData, potentialFathers }: PersonFormProps) {
  const t = useTranslations('PersonForm');
  
  const formSchema = z.object({
    name: z.string().min(2, { message: t('validation.nameMin') }),
    gender: z.enum(['MALE', 'FEMALE']),
    wife: z.string().optional(),
    description: z.string().optional(),
    fatherId: z.string().nullable().optional(),
    birthOrder: z.number().int().optional(),
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PersonFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      gender: 'MALE',
      wife: '',
      description: '',
      birthOrder: 0,
    },
  });

  // Re-define schema inside component to use translations, or handle validation message differently. 
  // Since zod schema is defined outside, I successfully moved it inside or I can invoke another hook or pass message.
  // Actually, standard practice with next-intl and zod is to use useTranslations inside component. I moved schema define inside.


  useEffect(() => {
    if (personData) {
      reset({
        name: personData.name || '',
        gender: personData.gender || 'MALE',
        wife: personData.wife || '',
        description: personData.description || '',
        fatherId: personData.fatherId,
        birthOrder: personData.birthOrder || 0,
      });
    } else {
        reset({
            name: '',
            gender: 'MALE',
            wife: '',
            description: '',
            fatherId: null,
            birthOrder: 0,
        });
    }
  }, [personData, reset, isOpen]);

  const formTitle = personData?.id ? t('titles.edit', {name: personData.name || ''}) : t('titles.add');
  const formDescription = personData?.id
    ? t('titles.editDesc')
    : personData?.fatherId
    ? t('titles.addChildDesc', {generation: personData.generation || 0})
    : t('titles.addRootDesc');
    
  const fatherOptions = [
    { value: "null", label: t('options.root') },
    ...potentialFathers.map((ancestor) => ({
      value: ancestor.id,
      label: ancestor.name,
    })),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{formTitle}</DialogTitle>
            <DialogDescription>{formDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('labels.name')}</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" {...field} value={field.value ?? ''} />}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gender">{t('labels.gender')}</Label>
               <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <select
                    id="gender"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="MALE">{t('options.male')}</option>
                    <option value="FEMALE">{t('options.female')}</option>
                  </select>
                )}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="fatherId">{t('labels.father')}</Label>
                <Controller
                name="fatherId"
                control={control}
                render={({ field }) => (
                    <ComboBox
                        options={fatherOptions}
                        value={field.value ?? "null"}
                        onChange={field.onChange}
                        placeholder={t('placeholders.selectFather')}
                        searchPlaceholder={t('placeholders.searchFather')}
                        notfoundText={t('placeholders.noFather')}
                    />
                )}
                />
            </div>
          
            <div className="grid gap-2">
              <Label htmlFor="wife">{t('labels.wife')}</Label>
              <Controller
                name="wife"
                control={control}
                render={({ field }) => <Input id="wife" {...field} value={field.value ?? ''} />}
              />
            </div>

             <div className="grid gap-2">
              <Label htmlFor="birthOrder">{t('labels.birthOrder')}</Label>
              <Controller
                name="birthOrder"
                control={control}
                render={({ field }) => <Input id="birthOrder" type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t('labels.description')}</Label>
               <Controller
                name="description"
                control={control}
                render={({ field }) => <Textarea id="description" {...field} value={field.value ?? ''} />}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('buttons.cancel')}</Button>
            <Button type="submit">{t('buttons.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


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

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  wife: z.string().optional(),
  description: z.string().optional(),
  fatherId: z.string().nullable().optional(),
  birthOrder: z.number().int().optional(),
});

export type PersonFormData = z.infer<typeof formSchema>;

interface PersonFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: PersonFormData) => void;
  personData: Partial<Ancestor> | null;
  potentialFathers: Ancestor[];
}

export function PersonForm({ isOpen, onOpenChange, onSubmit, personData, potentialFathers }: PersonFormProps) {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PersonFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      wife: '',
      description: '',
      fatherId: null,
      birthOrder: 0,
    },
  });

  useEffect(() => {
    if (personData) {
      reset({
        name: personData.name || '',
        wife: personData.wife || '',
        description: personData.description || '',
        fatherId: personData.fatherId,
        birthOrder: personData.birthOrder || 0,
      });
    } else {
        reset({
            name: '',
            wife: '',
            description: '',
            fatherId: null,
            birthOrder: 0,
        });
    }
  }, [personData, reset, isOpen]);

  const formTitle = personData?.id ? `Edit ${personData.name}` : 'Add New Person';
  const formDescription = personData?.id
    ? "Make changes to this person's profile."
    : personData?.fatherId
    ? `Adding a new child for generation ${personData.generation}.`
    : 'Add a new root person to the lineage.';
    
  const fatherOptions = [
    { value: "null", label: "None (Root Person)" },
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
              <Label htmlFor="name">Name</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" {...field} />}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="fatherId">Father</Label>
                <Controller
                name="fatherId"
                control={control}
                render={({ field }) => (
                    <ComboBox
                        options={fatherOptions}
                        value={field.value ?? "null"}
                        onChange={field.onChange}
                        placeholder="Select father..."
                        searchPlaceholder="Search for father..."
                        notfoundText="No father found."
                    />
                )}
                />
            </div>
          
            <div className="grid gap-2">
              <Label htmlFor="wife">Wife</Label>
              <Controller
                name="wife"
                control={control}
                render={({ field }) => <Input id="wife" {...field} />}
              />
            </div>

             <div className="grid gap-2">
              <Label htmlFor="birthOrder">Birth Order</Label>
              <Controller
                name="birthOrder"
                control={control}
                render={({ field }) => <Input id="birthOrder" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
               <Controller
                name="description"
                control={control}
                render={({ field }) => <Textarea id="description" {...field} />}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

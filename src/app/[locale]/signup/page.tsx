'use client';

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { registerContributor } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useTranslations } from "next-intl"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    birthday: undefined as Date | undefined,
    whatsapp: '',
    address: '',
    city: '',
    country: '',
    facebook: '',
    instagram: '',
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations('SignupPage');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleBirthdayChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, birthday: date }));
    setIsCalendarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const contributorData = {
          ...formData,
          birthday: formData.birthday ? new Date(formData.birthday) : null
      }
      
      const newContributor = await registerContributor(contributorData);
      
      toast({
        title: t('toasts.success'),
        description: t('toasts.successDesc', {name: newContributor.fullName}),
      });
      
      localStorage.setItem('user', JSON.stringify({ 
        id: newContributor.id, 
        name: newContributor.fullName, 
        email: newContributor.email,
        role: 'contributor'
      }));
      
      router.push('/contributor');
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: t('toasts.failed'),
        description: t('toasts.failedDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background py-12">
      <Card className="mx-auto max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/images/icons/logo_tarombo_batak.png" alt="Tarombo Batak Logo" width={64} height={64} className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-headline">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullName">{t('labels.fullName')}</Label>
                <Input id="fullName" placeholder={t('placeholders.fullName')} required value={formData.fullName} onChange={handleInputChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="grid gap-2">
                      <Label htmlFor="birthday">{t('labels.birthday')}</Label>
                       <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                          <PopoverTrigger asChild>
                          <Button
                              variant={"outline"}
                              className={cn(
                              "justify-start text-left font-normal",
                              !formData.birthday && "text-muted-foreground"
                              )}
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.birthday ? format(formData.birthday, "PPP") : <span>{t('labels.pickDate')}</span>}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={formData.birthday}
                              onSelect={handleBirthdayChange}
                              initialFocus
                              fromYear={1920}
                              toYear={new Date().getFullYear()}
                          />
                          </PopoverContent>
                      </Popover>
                  </div>
                   <div className="grid gap-2">
                      <Label htmlFor="whatsapp">{t('labels.whatsapp')}</Label>
                      <Input id="whatsapp" type="tel" placeholder={t('placeholders.whatsapp')} value={formData.whatsapp} onChange={handleInputChange} />
                  </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">{t('labels.address')}</Label>
                <Textarea id="address" placeholder={t('placeholders.address')} value={formData.address} onChange={handleInputChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="city">{t('labels.city')}</Label>
                  <Input id="city" placeholder={t('placeholders.city')} value={formData.city} onChange={handleInputChange}/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">{t('labels.country')}</Label>
                  <Input id="country" placeholder={t('placeholders.country')} value={formData.country} onChange={handleInputChange}/>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="facebook">{t('labels.facebook')}</Label>
                  <Input id="facebook" placeholder="facebook.com/username" value={formData.facebook} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instagram">{t('labels.instagram')}</Label>
                  <Input id="instagram" placeholder="@username" value={formData.instagram} onChange={handleInputChange}/>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t('labels.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('placeholders.email')}
                  required
                  value={formData.email} onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">{t('labels.password')}</Label>
                <Input id="password" type="password" required value={formData.password} onChange={handleInputChange}/>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('buttons.creating') : t('buttons.create')}
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm">
            {t('haveAccount')}{" "}
            <Link href="/login" className="underline">
              {t('login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

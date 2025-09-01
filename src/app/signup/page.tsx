'use client';

import Link from "next/link"
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
        title: "Registration Successful",
        description: `Welcome, ${newContributor.fullName}! Your account has been created.`,
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
        title: "Registration Failed",
        description: "An account with this email may already exist.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background py-12">
      <Card className="mx-auto max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="inline-block bg-primary/10 p-3 rounded-full mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Contributor Registration</CardTitle>
          <CardDescription>
            Create an account to start contributing to the lineage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Enter your full name" required value={formData.fullName} onChange={handleInputChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="grid gap-2">
                      <Label htmlFor="birthday">Birthday</Label>
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
                              {formData.birthday ? format(formData.birthday, "PPP") : <span>Pick a date</span>}
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
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input id="whatsapp" type="tel" placeholder="+62 123 4567 890" value={formData.whatsapp} onChange={handleInputChange} />
                  </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" placeholder="Enter your full address" value={formData.address} onChange={handleInputChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="e.g. Jakarta" value={formData.city} onChange={handleInputChange}/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" placeholder="e.g. Indonesia" value={formData.country} onChange={handleInputChange}/>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="facebook">Facebook (Optional)</Label>
                  <Input id="facebook" placeholder="facebook.com/username" value={formData.facebook} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instagram">Instagram (Optional)</Label>
                  <Input id="instagram" placeholder="@username" value={formData.instagram} onChange={handleInputChange}/>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={formData.email} onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={formData.password} onChange={handleInputChange}/>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create an account'}
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

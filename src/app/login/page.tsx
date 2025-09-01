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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, ShieldCheck } from "lucide-react"
import { useState } from "react";
import { login, adminLogin } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const [contributorEmail, setContributorEmail] = useState('');
  const [contributorPassword, setContributorPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleContributorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const contributor = await login(contributorEmail, contributorPassword);
      if (contributor) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${contributor.fullName}!`,
        });
        localStorage.setItem('user', JSON.stringify({ 
          id: contributor.id, 
          name: contributor.fullName, 
          email: contributor.email,
          role: 'contributor'
        }));
        router.push('/contributor');
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const admin = await adminLogin(adminEmail, adminPassword);
      if (admin) {
        toast({
          title: "Admin Login Successful",
          description: `Welcome back, ${admin.name}!`,
        });
        localStorage.setItem('user', JSON.stringify({ 
          id: admin.id, 
          name: admin.name, 
          email: admin.email,
          role: 'admin'
        }));
        router.push('/admin');
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid admin credentials.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>
            Choose your account type and login below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contributor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contributor" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contributor
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="contributor" className="space-y-4">
              <form onSubmit={handleContributorSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contributor-email">Email</Label>
                    <Input
                      id="contributor-email"
                      type="email"
                      placeholder="contributor@example.com"
                      required
                      value={contributorEmail}
                      onChange={(e) => setContributorEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contributor-password">Password</Label>
                    <Input 
                      id="contributor-password" 
                      type="password" 
                      required 
                      value={contributorPassword}
                      onChange={(e) => setContributorPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login as Contributor'}
                  </Button>
                </div>
              </form>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline">
                  Sign up
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@example.com"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input 
                      id="admin-password" 
                      type="password" 
                      required 
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login as Admin'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

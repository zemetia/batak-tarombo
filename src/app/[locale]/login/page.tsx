'use client';

import { useTranslations } from "next-intl";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, ShieldCheck } from "lucide-react"
import { useState } from "react";
import { login, adminLogin } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { FirebaseLogin } from "@/components/auth/firebase-login";


export default function LoginPage() {
  const [contributorEmail, setContributorEmail] = useState('');
  const [contributorPassword, setContributorPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations('LoginPage');

  const handleContributorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const contributor = await login(contributorEmail, contributorPassword);
      if (contributor) {
        toast({
          title: t('toast.successTitle'),
          description: t('toast.successDesc', {name: contributor.profile?.fullName || contributor.email}),
        });
        localStorage.setItem('user', JSON.stringify({ 
          id: contributor.id, 
          name: contributor.name, 
          email: contributor.email,
          role: 'contributor'
        }));
        router.push('/contributor');
      } else {
        toast({
          variant: "destructive",
          title: t('toast.failTitle'),
          description: t('toast.failDesc'),
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('toast.errorTitle'),
        description: t('toast.errorDesc'),
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
          title: t('toast.successTitle'),
          description: t('toast.successDesc', {name: admin.name}),
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
          title: t('toast.failTitle'),
          description: t('toast.failDesc'),
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('toast.errorTitle'),
        description: t('toast.errorDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
      <Card className="mx-auto max-w-md w-full">
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
          <div className="flex justify-center mb-6">
            <FirebaseLogin />
          </div>

          <Tabs defaultValue="contributor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contributor" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('contributor')}
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {t('admin')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="contributor" className="space-y-4">
              <form onSubmit={handleContributorSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contributor-email">{t('email')}</Label>
                    <Input
                      id="contributor-email"
                      type="email"
                      placeholder={t('placeholderEmail')}
                      required
                      value={contributorEmail}
                      onChange={(e) => setContributorEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contributor-password">{t('password')}</Label>
                    <Input 
                      id="contributor-password" 
                      type="password" 
                      required 
                      value={contributorPassword}
                      onChange={(e) => setContributorPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('loading') : t('submitContributor')}
                  </Button>
                </div>
              </form>
              <div className="text-center text-sm">
                {t('noAccount')}{" "}
                <Link href="/signup" className="underline">
                  {t('signup')}
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="admin-email">{t('email')}</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder={t('placeholderEmail')}
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="admin-password">{t('password')}</Label>
                    <Input 
                      id="admin-password" 
                      type="password" 
                      required 
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('loading') : t('submitAdmin')}
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

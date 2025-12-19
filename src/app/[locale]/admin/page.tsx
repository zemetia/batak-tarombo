

'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminUsers, getContributors, getDataSubmissions, createAdmin, updateSubmissionStatus } from '@/lib/actions';
import { MoreHorizontal, Pencil, ShieldCheck, Trash2, UserPlus, CheckCircle, XCircle, Clock, MessageSquare, Users, FileText, User, Phone, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface Admin {
  id: string;
  email: string;
  profile?: { fullName: string } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Contributor {
  id: string;
  email: string;
  profile?: { fullName: string; whatsapp?: string | null; city?: string | null; country?: string | null } | null;
  whatsapp: string | null;
  city: string | null;
  country: string | null;
  createdAt: Date | string;
  _count: {
    submissions: number;
  };
}

interface Submission {
  id: string;
  ancestorName: string;
  fatherName: string | null;
  status: string;
  changesDetail: string;
  taromboProve: string;
  adminNotes: string | null;
  submittedAt: Date | string;
  reviewedAt: Date | string | null;
  submittedBy: {
    email: string;
    profile?: { fullName: string; whatsapp?: string | null } | null;
    whatsapp: string | null;
  };
  reviewedBy: {
    email: string;
    profile?: { fullName: string } | null;
  } | null;
}

interface User {
  id: string;
  email: string;
  profile?: { fullName: string } | null;
  role: string;
  name?: string; // Optional for backward combat
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminUsers, setAdminUsers] = useState<Admin[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('AdminPage');
  
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [reviewData, setReviewData] = useState({
    status: '',
    adminNotes: ''
  });

  const statusConfig = {
    waiting: { icon: Clock, color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', label: t('status.waiting') },
    in_review: { icon: MessageSquare, color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', label: t('status.in_review') },
    accepted: { icon: CheckCircle, color: 'bg-green-500/10 text-green-700 border-green-500/20', label: t('status.accepted') },
    accepted_with_discuss: { icon: CheckCircle, color: 'bg-green-500/10 text-green-700 border-green-500/20', label: t('status.accepted_with_discuss') },
    rejected: { icon: XCircle, color: 'bg-red-500/10 text-red-700 border-red-500/20', label: t('status.rejected') },
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [adminsData, contributorsData, submissionsData] = await Promise.all([
        getAdminUsers(),
        getContributors(),
        getDataSubmissions()
      ]);
      setAdminUsers(adminsData);
      setContributors(contributorsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createAdmin(newAdmin);
      toast({
        title: t('toasts.adminCreated'),
        description: t('toasts.adminCreatedDesc'),
      });
      setNewAdmin({ name: '', email: '', password: '' });
      setIsAddAdminOpen(false);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('toasts.createFailed'),
        description: t('toasts.createFailedDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !user) return;
    
    setIsLoading(true);
    try {
      await updateSubmissionStatus(
        selectedSubmission.id,
        reviewData.status as any,
        user.id,
        reviewData.adminNotes || undefined
      );
      
      toast({
        title: t('toasts.reviewSubmitted'),
        description: t('toasts.reviewSubmittedDesc', {status: reviewData.status}),
      });
      
      setReviewData({ status: '', adminNotes: '' });
      setIsReviewOpen(false);
      setSelectedSubmission(null);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('toasts.reviewFailed'),
        description: t('toasts.reviewFailedDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReviewData({
      status: submission.status,
      adminNotes: submission.adminNotes || ''
    });
    setIsReviewOpen(true);
  };

  if (!user) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="bg-background relative min-h-screen">
      {/* Batak Pattern Background Overlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none z-0" 
        style={{
          backgroundImage: 'url(/images/batak-pattern-bg.png)',
          backgroundSize: '300px',
          backgroundRepeat: 'repeat'
        }}
      />

       {/* Hero Section */}
       <div className="relative z-10 bg-[#7B1E1E] text-white py-16 mb-8">
         <div className="absolute inset-0 overflow-hidden">
             <Image
                src="/images/lake-toba.png"
                alt="Lake Toba"
                fill
                className="object-cover opacity-20"
                priority
             />
         </div>
         <div className="container mx-auto px-4 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-headline font-bold text-white">
                            {t('header.title')}
                        </h1>
                    </div>
                    <p className="text-xl max-w-2xl opacity-90 leading-relaxed pl-3 border-l-4 border-white/30">
                        {t('header.welcome', {name: user.profile?.fullName || user.email})}
                    </p>
                </div>
            </div>
         </div>
      </div>

      <div className="container mx-auto px-4 pb-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
                { title: t('cards.admins'), icon: ShieldCheck, value: adminUsers.length, color: "text-blue-500" },
                { title: t('cards.contributors'), icon: Users, value: contributors.length, color: "text-green-500" },
                { title: t('cards.pending'), icon: Clock, value: submissions.filter(s => s.status === 'waiting' || s.status === 'in_review').length, color: "text-orange-500" },
                { title: t('cards.total'), icon: FileText, value: submissions.length, color: "text-[#7B1E1E]" },
            ].map((card, idx) => (
                <Card key={idx} className="border-[#7B1E1E]/20 relative overflow-hidden group hover:border-[#7B1E1E] transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-[#7B1E1E] transition-colors">{card.title}</CardTitle>
                        <card.icon className={cn("h-4 w-4 transition-colors", card.color)} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-headline">{card.value}</div>
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#7B1E1E]/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <Tabs defaultValue="submissions" className="space-y-6">
          <div className="flex justify-between items-center">
             <TabsList className="bg-muted/50 p-1 border border-[#7B1E1E]/10">
                <TabsTrigger value="submissions" className="data-[state=active]:bg-[#7B1E1E] data-[state=active]:text-white">{t('tabs.submissions')}</TabsTrigger>
                <TabsTrigger value="contributors" className="data-[state=active]:bg-[#7B1E1E] data-[state=active]:text-white">{t('tabs.contributors')}</TabsTrigger>
                <TabsTrigger value="admins" className="data-[state=active]:bg-[#7B1E1E] data-[state=active]:text-white">{t('tabs.admins')}</TabsTrigger>
              </TabsList>
              
              {/* Add Admin Button moved here for cleaner layout, only visible on admins tab effectively */}
              <div className="hidden md:block">
                  {/* Just a placeholder if needed, or we can conditionally render the button here based on active tab state if we tracked it */}
              </div>
          </div>

          <TabsContent value="submissions">
             <Card className="border-[#7B1E1E]/20 shadow-sm">
                <CardHeader className="bg-muted/20 border-b border-border/40">
                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#7B1E1E]" />
                        {t('tabs.submissions')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-none border-0">
                        <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                            <TableHead className="font-bold">{t('table.ancestor')}</TableHead>
                            <TableHead className="hidden lg:table-cell font-bold">{t('table.father')}</TableHead>
                            <TableHead className="hidden md:table-cell font-bold">{t('table.submittedBy')}</TableHead>
                            <TableHead className="font-bold">{t('table.status')}</TableHead>
                            <TableHead className="text-right font-bold">{t('table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.map((submission) => {
                                const statusInfo = statusConfig[submission.status as keyof typeof statusConfig] || statusConfig.waiting;
                                const StatusIcon = statusInfo.icon;
                                return (
                                    <TableRow key={submission.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="font-headline text-base text-[#7B1E1E]">{submission.ancestorName}</div>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                                        {submission.fatherName || '-'}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{submission.submittedBy.profile?.fullName || submission.submittedBy.email}</span>
                                        <span className="text-xs text-muted-foreground">{submission.submittedBy.email}</span>
                                        {submission.submittedBy.whatsapp && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {submission.submittedBy.whatsapp}
                                        </span>
                                        )}
                                    </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("gap-x-1.5 font-normal px-2.5 py-1", statusInfo.color)}>
                                            <StatusIcon className="h-3 w-3" />
                                            {statusInfo.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openReviewDialog(submission)}
                                        className="hover:bg-[#7B1E1E] hover:text-white border-[#7B1E1E]/20"
                                    >
                                        {t('buttons.review')}
                                    </Button>
                                    </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributors">
            <Card className="border-[#7B1E1E]/20 shadow-sm">
                <CardHeader className="bg-muted/20 border-b border-border/40">
                     <CardTitle className="font-headline text-xl flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#7B1E1E]" />
                        {t('tabs.contributors')}
                    </CardTitle>
                </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                        <TableHead className="font-bold">{t('table.name')}</TableHead>
                        <TableHead className="hidden md:table-cell font-bold">{t('table.email')}</TableHead>
                        <TableHead className="hidden lg:table-cell font-bold">{t('table.location')}</TableHead>
                        <TableHead className="hidden md:table-cell font-bold">{t('table.submissions')}</TableHead>
                        <TableHead className="hidden lg:table-cell font-bold">{t('table.joined')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contributors.map((contributor) => (
                        <TableRow key={contributor.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span className="text-base text-[#7B1E1E]">{contributor.profile?.fullName || 'Unknown'}</span>
                                {contributor.whatsapp && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {contributor.whatsapp}
                                </span>
                                )}
                            </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                            {contributor.email}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {contributor.city && contributor.country 
                                ? `${contributor.city}, ${contributor.country}` 
                                : contributor.city || contributor.country || '-'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary" className="bg-[#7B1E1E]/10 text-[#7B1E1E]">
                                {contributor._count.submissions}
                            </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-xs font-mono">
                            {new Date(contributor.createdAt).toLocaleDateString()}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
              <div className="flex justify-between items-center mb-4">
                  <div /> {/* Spacer */}
                  <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                    <DialogTrigger asChild>
                    <Button className="bg-[#7B1E1E] hover:bg-[#5a1616]">
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t('buttons.addAdmin')}
                    </Button>
                    </DialogTrigger>
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-headline text-xl text-[#7B1E1E]">{t('dialog.addAdmin.title')}</DialogTitle>
                        <DialogDescription>
                        {t('dialog.addAdmin.desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddAdmin}>
                        <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="admin-name">{t('dialog.addAdmin.fullName')}</Label>
                            <Input
                            id="admin-name"
                            value={newAdmin.name}
                            onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                            required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="admin-email">{t('dialog.addAdmin.email')}</Label>
                            <Input
                            id="admin-email"
                            type="email"
                            value={newAdmin.email}
                            onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                            required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="admin-password">{t('dialog.addAdmin.password')}</Label>
                            <Input
                            id="admin-password"
                            type="password"
                            value={newAdmin.password}
                            onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                            required
                            />
                        </div>
                        </div>
                        <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-[#7B1E1E] hover:bg-[#5a1616]">
                            {isLoading ? t('buttons.creating') : t('buttons.createAdmin')}
                        </Button>
                        </DialogFooter>
                    </form>
                    </DialogContent>
                </Dialog>
              </div>
            
            <Card className="border-[#7B1E1E]/20 shadow-sm">
                 <CardHeader className="bg-muted/20 border-b border-border/40">
                     <CardTitle className="font-headline text-xl flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#7B1E1E]" />
                        {t('tabs.admins')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                        <TableHead className="font-bold">{t('table.name')}</TableHead>
                        <TableHead className="hidden md:table-cell font-bold">{t('table.email')}</TableHead>
                        <TableHead className="font-bold">{t('table.role')}</TableHead>
                        <TableHead className="hidden lg:table-cell font-bold">{t('table.created')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {adminUsers.map((admin) => (
                        <TableRow key={admin.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-[#7B1E1E]">{admin.profile?.fullName || 'Unknown'}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                            {admin.email}
                            </TableCell>
                            <TableCell>
                            <Badge variant={'default'} className="bg-[#7B1E1E] hover:bg-[#5a1616]">
                                Admin
                            </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-xs font-mono">
                            {new Date(admin.createdAt).toLocaleDateString()}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="font-headline text-xl text-[#7B1E1E]">{t('dialog.review.title')}</DialogTitle>
                <DialogDescription>
                {t('dialog.review.desc')}
                </DialogDescription>
            </DialogHeader>
            {selectedSubmission && (
                <form onSubmit={handleReviewSubmission}>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t('dialog.review.ancestorName')}</Label>
                        <p className="text-lg font-headline font-bold text-[#7B1E1E] mt-1">{selectedSubmission.ancestorName}</p>
                    </div>
                    <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t('dialog.review.fatherName')}</Label>
                        <p className="text-lg font-medium mt-1">{selectedSubmission.fatherName || t('dialog.review.notSpecified')}</p>
                    </div>
                    </div>
                    
                    <div>
                    <Label className="text-base font-semibold">{t('dialog.review.submittedBy')}</Label>
                    <div className="flex items-center gap-3 mt-2 p-3 border rounded-md">
                        <div className="bg-[#7B1E1E]/10 p-2 rounded-full">
                            <User className="w-5 h-5 text-[#7B1E1E]" />
                        </div>
                        <div>
                            <p className="font-medium">{selectedSubmission.submittedBy.profile?.fullName || selectedSubmission.submittedBy.email}</p>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>{selectedSubmission.submittedBy.email}</span>
                                {selectedSubmission.submittedBy.whatsapp && (
                                <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {selectedSubmission.submittedBy.whatsapp}
                                </span>
                                )}
                            </div>
                        </div>
                    </div>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-base font-semibold">{t('dialog.review.changes')}</Label>
                        <div className="text-sm bg-muted p-4 rounded-md border border-border/50 min-h-[80px]">
                            {selectedSubmission.changesDetail}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-base font-semibold">{t('dialog.review.proof')}</Label>
                        {selectedSubmission.taromboProve ? (
                             <a href={selectedSubmission.taromboProve} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group">
                                <FileText className="w-4 h-4" />
                                <span className="underline decoration-dotted group-hover:decoration-solid">{selectedSubmission.taromboProve}</span>
                            </a>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No proof provided</p>
                        )}
                       
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="grid gap-2">
                        <Label htmlFor="review-status" className="font-semibold">{t('dialog.review.status')}</Label>
                        <Select value={reviewData.status} onValueChange={(value) => setReviewData(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger className="h-10">
                            <SelectValue placeholder={t('status.placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="waiting">{t('status.waiting')}</SelectItem>
                            <SelectItem value="in_review">{t('status.in_review')}</SelectItem>
                            <SelectItem value="accepted">{t('status.accepted')}</SelectItem>
                            <SelectItem value="accepted_with_discuss">{t('status.accepted_with_discuss')}</SelectItem>
                            <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="admin-notes" className="font-semibold">{t('dialog.review.notes')}</Label>
                        <Textarea
                            id="admin-notes"
                            placeholder={t('dialog.review.notesPlaceholder')}
                            value={reviewData.adminNotes}
                            onChange={(e) => setReviewData(prev => ({ ...prev, adminNotes: e.target.value }))}
                            className="h-24"
                        />
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => setIsReviewOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-[#7B1E1E] hover:bg-[#5a1616]">
                    {isLoading ? t('buttons.updating') : t('buttons.updateStatus')}
                    </Button>
                </DialogFooter>
                </form>
            )}
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

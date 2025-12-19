
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
import { MoreHorizontal, Pencil, ShieldCheck, Trash2, UserPlus, CheckCircle, XCircle, Clock, MessageSquare, Users, FileText, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

interface Admin {
  id: string;
  name: string;
  email: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Contributor {
  id: string;
  fullName: string;
  email: string;
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
    fullName: string;
    email: string;
    whatsapp: string | null;
  };
  reviewedBy: {
    name: string;
    email: string;
  } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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
    waiting: { icon: Clock, color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30', label: t('status.waiting') },
    in_review: { icon: MessageSquare, color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', label: t('status.in_review') },
    accepted: { icon: CheckCircle, color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30', label: t('status.accepted') },
    accepted_with_discuss: { icon: CheckCircle, color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30', label: t('status.accepted_with_discuss') },
    rejected: { icon: XCircle, color: 'bg-red-500/20 text-red-700 dark:text-red-500 border-red-500/30', label: t('status.rejected') },
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
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-primary" />
          {t('header.title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('header.welcome', {name: user.name})}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.admins')}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.contributors')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter(s => s.status === 'waiting' || s.status === 'in_review').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.total')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="submissions">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="submissions">{t('tabs.submissions')}</TabsTrigger>
          <TabsTrigger value="contributors">{t('tabs.contributors')}</TabsTrigger>
          <TabsTrigger value="admins">{t('tabs.admins')}</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-6">
           <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.ancestor')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('table.father')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('table.submittedBy')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                    const statusInfo = statusConfig[submission.status as keyof typeof statusConfig] || statusConfig.waiting;
                    const StatusIcon = statusInfo.icon;
                    return (
                        <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.ancestorName}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {submission.fatherName || '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="font-medium">{submission.submittedBy.fullName}</span>
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
                            <Badge variant="outline" className={cn("gap-x-1.5", statusInfo.color)}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusInfo.label}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewDialog(submission)}
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
        </TabsContent>

        <TabsContent value="contributors" className="mt-6">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('table.email')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('table.location')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('table.submissions')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('table.joined')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributors.map((contributor) => (
                  <TableRow key={contributor.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{contributor.fullName}</span>
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
                      <Badge variant="secondary">
                        {contributor._count.submissions}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {new Date(contributor.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
            <div className="flex justify-end mb-4">
              <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                <DialogTrigger asChild>
                  <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t('buttons.addAdmin')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('dialog.addAdmin.title')}</DialogTitle>
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
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? t('buttons.creating') : t('buttons.createAdmin')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('table.email')}</TableHead>
                  <TableHead>{t('table.role')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('table.created')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {admin.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={'default'}>
                        Admin
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('dialog.review.title')}</DialogTitle>
            <DialogDescription>
              {t('dialog.review.desc')}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <form onSubmit={handleReviewSubmission}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('dialog.review.ancestorName')}</Label>
                    <p className="text-sm font-medium">{selectedSubmission.ancestorName}</p>
                  </div>
                  <div>
                    <Label>{t('dialog.review.fatherName')}</Label>
                    <p className="text-sm font-medium">{selectedSubmission.fatherName || t('dialog.review.notSpecified')}</p>
                  </div>
                </div>
                <div>
                  <Label>{t('dialog.review.submittedBy')}</Label>
                  <div className="text-sm">
                    <p className="font-medium">{selectedSubmission.submittedBy.fullName}</p>
                    <p className="text-muted-foreground">{selectedSubmission.submittedBy.email}</p>
                    {selectedSubmission.submittedBy.whatsapp && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedSubmission.submittedBy.whatsapp}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>{t('dialog.review.changes')}</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedSubmission.changesDetail}</p>
                </div>
                <div>
                  <Label>{t('dialog.review.proof')}</Label>
                  <p className="text-sm">
                    <a href={selectedSubmission.taromboProve} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedSubmission.taromboProve}
                    </a>
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="review-status">{t('dialog.review.status')}</Label>
                  <Select value={reviewData.status} onValueChange={(value) => setReviewData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
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
                  <Label htmlFor="admin-notes">{t('dialog.review.notes')}</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder={t('dialog.review.notesPlaceholder')}
                    value={reviewData.adminNotes}
                    onChange={(e) => setReviewData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t('buttons.updating') : t('buttons.updateStatus')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

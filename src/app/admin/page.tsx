
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
    waiting: { icon: Clock, color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30', label: 'Waiting' },
    in_review: { icon: MessageSquare, color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', label: 'In Review' },
    accepted: { icon: CheckCircle, color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30', label: 'Accepted' },
    accepted_with_discuss: { icon: CheckCircle, color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30', label: 'Accepted (with Discussion)' },
    rejected: { icon: XCircle, color: 'bg-red-500/20 text-red-700 dark:text-red-500 border-red-500/30', label: 'Rejected' },
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
        title: "Admin Created",
        description: "New admin account has been created successfully.",
      });
      setNewAdmin({ name: '', email: '', password: '' });
      setIsAddAdminOpen(false);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Create Admin",
        description: "There was an error creating the admin account.",
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
        title: "Review Submitted",
        description: `Submission has been ${reviewData.status}.`,
      });
      
      setReviewData({ status: '', adminNotes: '' });
      setIsReviewOpen(false);
      setSelectedSubmission(null);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Review Failed",
        description: "There was an error updating the submission.",
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
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome, {user.name}. Manage users and lineage data submissions.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="submissions">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="submissions">Data Submissions</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="admins">Admin Users</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-6">
           <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ancestor Name</TableHead>
                  <TableHead className="hidden lg:table-cell">Father's Name</TableHead>
                  <TableHead className="hidden md:table-cell">Submitted By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                            Review
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
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead className="hidden md:table-cell">Submissions</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
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
                      Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Admin</DialogTitle>
                    <DialogDescription>
                      Create a new admin account with full system access.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAdmin}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="admin-name">Full Name</Label>
                        <Input
                          id="admin-name"
                          value={newAdmin.name}
                          onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="admin-email">Email</Label>
                        <Input
                          id="admin-email"
                          type="email"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="admin-password">Password</Label>
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
                        {isLoading ? 'Creating...' : 'Create Admin'}
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
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
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
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              Review and update the status of this lineage submission.
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <form onSubmit={handleReviewSubmission}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ancestor Name</Label>
                    <p className="text-sm font-medium">{selectedSubmission.ancestorName}</p>
                  </div>
                  <div>
                    <Label>Father's Name</Label>
                    <p className="text-sm font-medium">{selectedSubmission.fatherName || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <Label>Submitted By</Label>
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
                  <Label>Changes Detail</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedSubmission.changesDetail}</p>
                </div>
                <div>
                  <Label>Proof/Source</Label>
                  <p className="text-sm">
                    <a href={selectedSubmission.taromboProve} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedSubmission.taromboProve}
                    </a>
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="review-status">Status</Label>
                  <Select value={reviewData.status} onValueChange={(value) => setReviewData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="accepted_with_discuss">Accepted (with Discussion)</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add notes or feedback for the contributor..."
                    value={reviewData.adminNotes}
                    onChange={(e) => setReviewData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Status'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

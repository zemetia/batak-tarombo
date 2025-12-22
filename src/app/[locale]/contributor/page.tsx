

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GitBranch, User, Plus, Clock, CheckCircle, XCircle, MessageSquare, Upload, TreePine, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getSubmissionsByContributor, createSubmission, getActiveProposal, createProposal, cancelProposal, forkDescendantTree } from '@/lib/actions';
import { AncestorSelector } from '@/components/ancestor-selector';
import { type Ancestor } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Submission {
  id: string;
  ancestorName: string;
  fatherName: string | null;
  status: string;
  changesDetail: string;
  adminNotes: string | null;
  submittedAt: Date | string;
  reviewedBy: { profile: { fullName: string } | null } | null;
  selectedAncestorId?: string | null;
  proposalType?: string;
  _count?: {
    personRequests: number;
  };
}

interface ActiveProposal extends Submission {
  personRequests: any[];
}

export default function ContributorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeProposal, setActiveProposal] = useState<ActiveProposal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAncestorSelector, setShowAncestorSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('ContributorPage');
  
  const [newSubmission, setNewSubmission] = useState({
    ancestorName: '',
    fatherName: '',
    changesDetail: '',
    taromboProve: '',
    selectedAncestorId: ''
  });

  const statusConfig = {
    WAITING: { icon: Clock, color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', label: t('status.waiting') },
    PENDING: { icon: Clock, color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', label: t('status.waiting') },
    IN_REVIEW: { icon: MessageSquare, color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', label: t('status.in_review') },
    APPROVED: { icon: CheckCircle, color: 'bg-green-500/10 text-green-700 border-green-500/20', label: t('status.accepted') },
    ACCEPTED: { icon: CheckCircle, color: 'bg-green-500/10 text-green-700 border-green-500/20', label: t('status.accepted') },
    ACCEPTED_WITH_DISCUSS: { icon: CheckCircle, color: 'bg-green-500/10 text-green-700 border-green-500/20', label: t('status.accepted_with_discuss') },
    REJECTED: { icon: XCircle, color: 'bg-red-500/10 text-red-700 border-red-500/20', label: t('status.rejected') },
    CANCELLED: { icon: XCircle, color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', label: t('status.cancelled') },
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadUserData(parsedUser.id);
    }
  }, []);

  const loadUserData = async (contributorId: string) => {
    try {
      const [submissionsData, activeProposalData] = await Promise.all([
        getSubmissionsByContributor(contributorId),
        getActiveProposal(contributorId)
      ]);
      
      const mapRequestToSubmission = (req: any): Submission => ({
        id: req.id,
        ancestorName: req.title.replace(/^Changes to (.*?)'s lineage$/, '$1').replace(/^Changes to /, ''), 
        fatherName: null,
        status: req.status,
        changesDetail: req.description || '',
        adminNotes: req.adminNotes,
        submittedAt: req.submittedAt,
        reviewedBy: req.reviewedBy,
        selectedAncestorId: null,
        _count: req._count
      });

      setSubmissions((submissionsData as any[]).map(mapRequestToSubmission));
      
      if (activeProposalData) {
        const activeReq = activeProposalData as any;
        setActiveProposal({
           ...mapRequestToSubmission(activeReq),
           personRequests: activeReq.personRequests || []
        });
      } else {
        setActiveProposal(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleCreateProposal = (ancestor: Ancestor) => {
    setNewSubmission(prev => ({
      ...prev,
      ancestorName: ancestor.name,
      selectedAncestorId: ancestor.id
    }));
    setShowAncestorSelector(false);
    setIsDialogOpen(true);
  };

  const handleCancelProposal = async () => {
    if (!activeProposal || !user) return;
    
    setIsLoading(true);
    try {
      await cancelProposal(activeProposal.id, user.id);
      
      toast({
        title: t('toasts.cancelled'),
        description: t('toasts.cancelledDesc'),
      });
      
      loadUserData(user.id);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: "There was an error cancelling your proposal.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewProposal = () => {
    if (activeProposal) {
      // Show warning that they need to cancel current proposal first
      toast({
        variant: "destructive",
        title: t('activeProposal.exists'),
        description: t('activeProposal.existsDesc'),
      });
      return;
    }
    setShowAncestorSelector(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Create the proposal
      const proposal = await createProposal({
        changesDetail: newSubmission.changesDetail,
        taromboProve: newSubmission.taromboProve,
        ancestorName: newSubmission.ancestorName,
        selectedAncestorId: newSubmission.selectedAncestorId,
        contributorId: user.id
      });
      
      // Fork the descendant tree
      await forkDescendantTree(newSubmission.selectedAncestorId, proposal.id);
      
      toast({
        title: t('toasts.created'),
        description: t('toasts.createdDesc'),
      });
      
      setNewSubmission({
        ancestorName: '',
        fatherName: '',
        changesDetail: '',
        taromboProve: '',
        selectedAncestorId: ''
      });
      setIsDialogOpen(false);
      
      if (user.id) {
        loadUserData(user.id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Proposal Creation Failed",
        description: error.message || "There was an error creating your proposal.",
      });
    } finally {
      setIsLoading(false);
    }
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
             <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                    <User className="w-8 h-8 text-white" />
                 </div>
                 <h1 className="text-3xl md:text-5xl font-headline font-bold text-white">
                    {t('header.welcome', {name: user.name})}
                 </h1>
             </div>
            <p className="text-xl max-w-2xl opacity-90 leading-relaxed pl-3 border-l-4 border-white/30">
               {t('header.desc')}
            </p>
         </div>
      </div>
      
      <div className="container mx-auto px-4 pb-16 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {/* Active Proposal Card */}
            {activeProposal ? (
              <Card className="border-[#7B1E1E]/40 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#7B1E1E]" />
                <CardHeader className="bg-gradient-to-br from-[#7B1E1E]/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-[#7B1E1E]">
                    <GitBranch className="w-5 h-5" />
                    {t('activeProposal.title')}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {t.rich('activeProposal.desc', {ancestorName: activeProposal.ancestorName, bold: (chunks) => <strong className="text-foreground">{chunks}</strong>})}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("gap-x-1.5 px-3 py-1", statusConfig[activeProposal.status as keyof typeof statusConfig]?.color)}>
                      <Clock className="h-3.5 w-3.5" />
                      {statusConfig[activeProposal.status as keyof typeof statusConfig]?.label || activeProposal.status}
                    </Badge>
                  </div>
                  <div className="space-y-3 pt-2">
                    <Button asChild className="w-full bg-[#7B1E1E] hover:bg-[#5a1616] text-white">
                      <Link href={`/contributor/edit-tree?proposalId=${activeProposal.id}`}>
                        <GitBranch className="mr-2 h-4 w-4" />
                        {t('activeProposal.continue')}
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive" 
                      onClick={handleCancelProposal}
                      disabled={isLoading}
                    >
                      {t('activeProposal.cancel')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-[#7B1E1E]/20 hover:border-[#7B1E1E] transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group" onClick={handleStartNewProposal}>
                  <CardHeader className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#7B1E1E]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Plus className="w-6 h-6 text-[#7B1E1E]" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-headline group-hover:text-[#7B1E1E] transition-colors">{t('newProposal.title')}</CardTitle>
                        <CardDescription className="mt-2 text-base leading-relaxed">
                          {t('newProposal.desc')}
                        </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-[#7B1E1E] hover:bg-[#5a1616] group-hover:shadow-lg transition-all" onClick={(e) => { e.stopPropagation(); handleStartNewProposal(); }}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('newProposal.start')}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
            
            {/* Ancestor Selector Dialog */}
            <Dialog open={showAncestorSelector} onOpenChange={setShowAncestorSelector}>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                 <DialogHeader className="p-6 pb-0 bg-muted/30">
                  <DialogTitle className="flex items-center gap-3 text-2xl font-headline text-[#7B1E1E]">
                      <div className="p-2 rounded-full bg-[#7B1E1E]/10">
                        <TreePine className="w-6 h-6" />
                      </div>
                      {t('dialog.selectTitle')}
                  </DialogTitle>
                  <DialogDescription className="text-base pt-2">
                      {t('dialog.selectDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-hidden px-6 pb-6 pt-4">
                   <AncestorSelector 
                      onSelect={handleCreateProposal}
                      onCancel={() => setShowAncestorSelector(false)}
                      isLoading={isLoading}
                    />
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Proposal Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-headline text-[#7B1E1E]">{t('dialog.createTitle')}</DialogTitle>
                  <DialogDescription>
                      {t.rich('dialog.createDesc', {name: newSubmission.ancestorName, bold: (chunks) => <strong className="text-foreground">{chunks}</strong>})}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                      <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="ancestorName">{t('dialog.ancestorLabel')}</Label>
                          <Input
                            id="ancestorName"
                            value={newSubmission.ancestorName}
                            disabled
                            className="bg-muted font-medium"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="changesDetail">{t('dialog.changesLabel')}</Label>
                          <Textarea
                            id="changesDetail"
                            placeholder={t('dialog.changesPlaceholder')}
                            value={newSubmission.changesDetail}
                            onChange={(e) => setNewSubmission(prev => ({ ...prev, changesDetail: e.target.value }))}
                            required
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="taromboProve">{t('dialog.proofLabel')}</Label>
                          <Input
                            id="taromboProve"
                            placeholder={t('dialog.proofPlaceholder')}
                            value={newSubmission.taromboProve}
                            onChange={(e) => setNewSubmission(prev => ({ ...prev, taromboProve: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading} className="bg-[#7B1E1E] hover:bg-[#5a1616]">
                      {isLoading ? t('dialog.submitting') : t('dialog.submit')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="lg:col-span-2">
            <Card className="border-[#7B1E1E]/20 h-full">
              <CardHeader className="border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#7B1E1E]/10">
                        <Sparkles className="w-5 h-5 text-[#7B1E1E]" />
                    </div>
                    <div>
                        <CardTitle className="font-headline text-xl">{t('yourProposals.title')}</CardTitle>
                        <CardDescription>
                            {t('yourProposals.desc')}
                        </CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {submissions.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <GitBranch className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground font-medium">{t('yourProposals.empty')}</p>
                    <Button variant="link" onClick={handleStartNewProposal} className="text-[#7B1E1E] mt-2">
                        {t('newProposal.start')}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-none border-0">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[30%]">{t('table.ancestor')}</TableHead>
                          <TableHead className="hidden md:table-cell">{t('table.father')}</TableHead>
                          <TableHead>{t('table.status')}</TableHead>
                          <TableHead className="hidden lg:table-cell text-right">{t('table.submitted')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => {
                          const statusInfo = statusConfig[submission.status as keyof typeof statusConfig];
                          const StatusIcon = statusInfo?.icon || Clock;
                          return (
                            <TableRow key={submission.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium">
                                <div className="font-headline text-base">{submission.ancestorName}</div>
                                {submission.adminNotes && (
                                  <div className="text-xs text-muted-foreground mt-1 bg-muted p-1.5 rounded inline-block max-w-[200px] truncate">
                                    {t('table.note', {note: submission.adminNotes})}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground">
                                {submission.fatherName || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("gap-x-1.5 font-normal", statusInfo?.color)}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusInfo?.label || submission.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground text-right font-mono text-xs">
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GitBranch, User, Plus, Clock, CheckCircle, XCircle, MessageSquare, Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSubmissionsByContributor, createSubmission, getActiveProposal, createProposal, cancelProposal, forkDescendantTree } from '@/lib/actions';
import { AncestorSelector } from '@/components/ancestor-selector';
import { type Ancestor } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  reviewedBy: { name: string } | null;
  selectedAncestorId?: string | null;
  proposalType?: string;
}

interface ActiveProposal extends Submission {
  proposedPersons: any[];
}

export default function ContributorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeProposal, setActiveProposal] = useState<ActiveProposal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAncestorSelector, setShowAncestorSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [newSubmission, setNewSubmission] = useState({
    ancestorName: '',
    fatherName: '',
    changesDetail: '',
    taromboProve: '',
    selectedAncestorId: ''
  });

  const statusConfig = {
    waiting: { icon: Clock, color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30', label: 'Waiting' },
    in_review: { icon: MessageSquare, color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', label: 'In Review' },
    accepted: { icon: CheckCircle, color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30', label: 'Accepted' },
    accepted_with_discuss: { icon: CheckCircle, color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30', label: 'Accepted (with Discussion)' },
    rejected: { icon: XCircle, color: 'bg-red-500/20 text-red-700 dark:text-red-500 border-red-500/30', label: 'Rejected' },
    cancelled: { icon: XCircle, color: 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30', label: 'Cancelled' },
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
      setSubmissions(submissionsData);
      setActiveProposal(activeProposalData);
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
        title: "Proposal Cancelled",
        description: "Your proposal has been cancelled successfully.",
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
        title: "Active Proposal Exists",
        description: "Please cancel your current proposal before creating a new one.",
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
        title: "Proposal Created",
        description: "Your proposal has been created. You can now edit the family tree.",
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
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
          <User className="w-10 h-10 text-primary" />
          Welcome, {user.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your contributions and propose changes to the family tree.
        </p>
      </header>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Active Proposal Card */}
          {activeProposal ? (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-primary" />
                  Active Proposal
                </CardTitle>
                <CardDescription>
                  You have an active proposal for <strong>{activeProposal.ancestorName}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("gap-x-1.5", statusConfig[activeProposal.status as keyof typeof statusConfig]?.color)}>
                    <Clock className="h-3.5 w-3.5" />
                    {statusConfig[activeProposal.status as keyof typeof statusConfig]?.label || activeProposal.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href={`/contributor/edit-tree?proposalId=${activeProposal.id}`}>
                      <GitBranch className="mr-2 h-4 w-4" />
                      Continue Editing
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleCancelProposal}
                    disabled={isLoading}
                  >
                    Cancel Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Create New Proposal</CardTitle>
                  <CardDescription>
                    Select an ancestor to start editing their descendants.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={handleStartNewProposal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Proposal
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Ancestor Selector Dialog */}
          <Dialog open={showAncestorSelector} onOpenChange={setShowAncestorSelector}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
              <AncestorSelector 
                onSelect={handleCreateProposal}
                onCancel={() => setShowAncestorSelector(false)}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
          
          {/* Proposal Details Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Proposal Details</DialogTitle>
                <DialogDescription>
                  Provide details about your proposed changes to <strong>{newSubmission.ancestorName}</strong>'s descendants.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="ancestorName">Selected Ancestor</Label>
                        <Input
                          id="ancestorName"
                          value={newSubmission.ancestorName}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="changesDetail">Changes Detail *</Label>
                        <Textarea
                          id="changesDetail"
                          placeholder="Describe the changes or new information..."
                          value={newSubmission.changesDetail}
                          onChange={(e) => setNewSubmission(prev => ({ ...prev, changesDetail: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="taromboProve">Proof/Source URL *</Label>
                        <Input
                          id="taromboProve"
                          placeholder="Link to genealogy document or source"
                          value={newSubmission.taromboProve}
                          onChange={(e) => setNewSubmission(prev => ({ ...prev, taromboProve: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Submitting...' : 'Create Proposal'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Proposals</CardTitle>
              <CardDescription>
                Track the status of your submitted proposals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No proposals submitted yet.</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ancestor</TableHead>
                        <TableHead className="hidden md:table-cell">Father</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => {
                        const statusInfo = statusConfig[submission.status as keyof typeof statusConfig];
                        const StatusIcon = statusInfo?.icon || Clock;
                        return (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">
                              {submission.ancestorName}
                              {submission.adminNotes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Note: {submission.adminNotes}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {submission.fatherName || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-x-1.5", statusInfo?.color)}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusInfo?.label || submission.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">
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
  );
}


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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAdminUsers, getDataSubmissions } from '@/lib/actions';
import { MoreHorizontal, Pencil, ShieldCheck, Trash2, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Admin } from '@prisma/client';
import Link from 'next/link';

export default async function AdminPage() {
  const adminUsers = await getAdminUsers();
  const dataSubmissions = await getDataSubmissions();
  
  const statusConfig = {
      Pending: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
      Approved: { icon: CheckCircle, color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' },
      Rejected: { icon: XCircle, color: 'bg-red-500/20 text-red-700 dark:text-red-500 border-red-500/30' },
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage users and lineage data submissions.
          </p>
        </div>
      </header>
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="submissions">Data Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
            <div className="flex justify-end mb-4">
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={'default'}>
                        Admin
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/40">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

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
                {dataSubmissions.map((submission) => {
                    const statusInfo = statusConfig[submission.status as keyof typeof statusConfig];
                    const StatusIcon = statusInfo.icon;
                    return (
                        <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.ancestorName}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {submission.fatherName}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                            {submission.submittedBy}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn("gap-x-1.5", statusInfo.color)}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {submission.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

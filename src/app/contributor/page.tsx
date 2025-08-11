
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, User } from 'lucide-react';
import Link from 'next/link';

export default function ContributorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
          <User className="w-10 h-10 text-primary" />
          Contributor Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your contributions and edit the family tree.
        </p>
      </header>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Family Tree</CardTitle>
            <CardDescription>
              Visually add, edit, and manage the Batak lineage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/contributor/edit-tree">
                <GitBranch className="mr-2" />
                Open Tree Editor
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

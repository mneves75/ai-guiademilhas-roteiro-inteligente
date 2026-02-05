'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create workspace');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-lg py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create Workspace</CardTitle>
          <CardDescription>
            Create a new workspace to organize your team and projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Workspace Name
              </label>
              <Input
                id="name"
                placeholder="My Awesome Team"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium">
                Workspace URL
              </label>
              <div className="flex items-center">
                <span className="rounded-l-md border border-r-0 bg-muted px-3 py-2 text-sm text-muted-foreground">
                  app.shipped.dev/
                </span>
                <Input
                  id="slug"
                  className="rounded-l-none"
                  placeholder="my-team"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens allowed.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

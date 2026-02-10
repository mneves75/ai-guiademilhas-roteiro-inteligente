'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkspaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [workspace, setWorkspace] = useState<{ name: string; slug: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function fetchWorkspace() {
      const res = await fetch(`/api/workspaces/${id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.workspace);
        setRole(data.role);
        setName(data.workspace.name);
        setSlug(data.workspace.slug);
      }
      setIsLoading(false);
    }
    fetchWorkspace();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update workspace');
      }

      setSuccess('Workspace updated successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete workspace');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (isLoading) {
    return <div className="container py-8">Loading...</div>;
  }

  if (!workspace) {
    return <div className="container py-8">Workspace not found</div>;
  }

  const isOwner = role === 'owner';
  const canEdit = role === 'owner' || role === 'admin';

  return (
    <div className="container max-w-2xl py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Workspace Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Update your workspace name and URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Workspace Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-medium">
                  Workspace URL
                </label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  disabled={!canEdit}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              {canEdit && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage who has access to this workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/dashboard/workspaces/${id}/members`}>Manage Members</Link>
            </Button>
          </CardContent>
        </Card>

        {isOwner && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Permanently delete this workspace and all its data.</CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Workspace
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleDelete}>
                      Yes, Delete
                    </Button>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

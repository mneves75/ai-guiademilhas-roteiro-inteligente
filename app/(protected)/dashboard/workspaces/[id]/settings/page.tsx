'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';

export default function WorkspaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { locale } = useLocale();
  const t = m(locale);

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
        throw new Error(data.error || t.dashboard.workspaces.updateFailed);
      }

      setSuccess(t.dashboard.workspaces.updatedSuccess);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.somethingWentWrong);
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
        throw new Error(data.error || t.dashboard.workspaces.deleteFailed);
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.somethingWentWrong);
    }
  };

  if (isLoading) {
    return <div className="container py-8">{t.common.loading}</div>;
  }

  if (!workspace) {
    return <div className="container py-8">{t.dashboard.workspaces.workspaceNotFound}</div>;
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
        {t.dashboard.workspaces.backToDashboard}
      </Link>

      <h1 className="mb-6 text-2xl font-bold">{t.dashboard.workspaces.settingsTitle}</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.workspaces.general}</CardTitle>
            <CardDescription>{t.dashboard.workspaces.generalSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t.dashboard.workspaces.workspaceName}
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
                  {t.dashboard.workspaces.workspaceUrl}
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
                  {isSaving ? t.common.saving : t.common.saveChanges}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.workspaces.teamMembersTitle}</CardTitle>
            <CardDescription>{t.dashboard.workspaces.teamMembersSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/dashboard/workspaces/${id}/members`}>
                {t.dashboard.workspaces.manageMembers}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {isOwner && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t.dashboard.workspaces.dangerZone}
              </CardTitle>
              <CardDescription>{t.dashboard.workspaces.dangerSubtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t.dashboard.workspaces.deleteWorkspace}
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t.dashboard.workspaces.deleteConfirm}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleDelete}>
                      {t.dashboard.workspaces.yesDelete}
                    </Button>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      {t.common.cancel}
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

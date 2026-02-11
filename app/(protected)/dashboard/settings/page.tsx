'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { authClient } from '@/lib/auth-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';

export default function SettingsPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = m(locale);
  const ts = t.dashboard.settings;

  const { data: session, refetch } = authClient.useSession();
  const [name, setName] = useState(session?.user?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await authClient.updateUser({ name });
      if (result?.error) {
        throw new Error(result.error.message ?? ts.profile.failed);
      }
      setSuccess(ts.profile.saved);
      await refetch();
      router.refresh();
    } catch {
      setError(ts.profile.failed);
    } finally {
      setIsSaving(false);
    }
  };

  const avatarFallback = useMemo(() => {
    if (!session) return '';
    return (session.user.name ?? session.user.email).charAt(0).toUpperCase();
  }, [session]);

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/users/avatar', { method: 'POST', body: formData });
      const uploadData = (await uploadRes.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error ?? ts.avatar.uploadFailed);
      }

      const updateRes = await authClient.updateUser({ image: uploadData.url });
      if (updateRes?.error) {
        throw new Error(updateRes.error.message ?? ts.avatar.updateFailed);
      }
      await refetch();
      setSuccess(ts.avatar.updated);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : ts.avatar.uploadFailed);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    setError('');
    setSuccess('');
    try {
      const updateRes = await authClient.updateUser({ image: null });
      if (updateRes?.error) {
        throw new Error(updateRes.error.message ?? ts.avatar.removeFailed);
      }
      await refetch();
      setSuccess(ts.avatar.removed);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : ts.avatar.removeFailed);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      if (!currentPassword || !newPassword) {
        throw new Error(ts.password.required);
      }
      if (newPassword.length < 8) {
        throw new Error(ts.password.min8);
      }
      if (newPassword !== confirmPassword) {
        throw new Error(ts.password.mismatch);
      }

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(data?.error?.message ?? ts.password.changeFailed);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(ts.password.updated);
      await refetch();
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : ts.password.changeFailed);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{ts.title}</h1>
        <p className="text-muted-foreground">{ts.subtitle}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">{ts.tabs.profile}</TabsTrigger>
          <TabsTrigger value="account">{ts.tabs.account}</TabsTrigger>
          <TabsTrigger value="notifications">{ts.tabs.notifications}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{ts.profile.infoTitle}</CardTitle>
              <CardDescription>{ts.profile.infoSubtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{ts.profile.name}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={ts.profile.namePlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{ts.profile.email}</Label>
                  <Input id="email" value={session.user.email} disabled />
                  <p className="text-xs text-muted-foreground">{ts.profile.emailHelp}</p>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t.common.saving : t.common.saveChanges}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{ts.avatar.title}</CardTitle>
              <CardDescription>{ts.avatar.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={ts.avatar.alt}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold">
                      {avatarFallback}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        disabled={avatarUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleAvatarUpload(file);
                          e.currentTarget.value = '';
                        }}
                      />
                      <Button variant="outline" disabled={avatarUploading} asChild>
                        <span>{avatarUploading ? ts.avatar.uploading : ts.avatar.upload}</span>
                      </Button>
                    </label>
                    {session.user.image && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={avatarUploading}
                        onClick={() => void handleRemoveAvatar()}
                      >
                        {ts.avatar.remove}
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{ts.avatar.help}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{ts.password.title}</CardTitle>
              <CardDescription>{ts.password.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleChangePassword}>
                <div className="space-y-2">
                  <Label htmlFor="current-password">{ts.password.current}</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">{ts.password.new}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{ts.password.confirm}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
                <Button type="submit" disabled={passwordSaving}>
                  {passwordSaving ? ts.password.updating : ts.password.update}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{ts.connectedAccounts.title}</CardTitle>
              <CardDescription>{ts.connectedAccounts.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    G
                  </div>
                  <div>
                    <p className="font-medium">{ts.connectedAccounts.google}</p>
                    <p className="text-sm text-muted-foreground">
                      {ts.connectedAccounts.googleHint}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {ts.connectedAccounts.connect}
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    GH
                  </div>
                  <div>
                    <p className="font-medium">{ts.connectedAccounts.github}</p>
                    <p className="text-sm text-muted-foreground">
                      {ts.connectedAccounts.githubHint}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {ts.connectedAccounts.connect}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{ts.dangerZone.title}</CardTitle>
              <CardDescription>{ts.dangerZone.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">{ts.dangerZone.deleteAccount}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{ts.emailNotifications.title}</CardTitle>
              <CardDescription>{ts.emailNotifications.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ts.emailNotifications.productUpdates}</p>
                  <p className="text-sm text-muted-foreground">
                    {ts.emailNotifications.productUpdatesHint}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {ts.emailNotifications.enabled}
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ts.emailNotifications.securityAlerts}</p>
                  <p className="text-sm text-muted-foreground">
                    {ts.emailNotifications.securityAlertsHint}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {ts.emailNotifications.alwaysOn}
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ts.emailNotifications.teamActivity}</p>
                  <p className="text-sm text-muted-foreground">
                    {ts.emailNotifications.teamActivityHint}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {ts.emailNotifications.enabled}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

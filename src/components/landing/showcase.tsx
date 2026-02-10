'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';

function BrowserFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card-elevated overflow-hidden rounded-xl">
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
          <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
          <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="mx-auto flex h-6 w-56 items-center justify-center rounded-md bg-muted/50 text-xs text-muted-foreground">
          {title}
        </div>
      </div>
      <div className="bg-background/50 p-5 sm:p-6">{children}</div>
    </div>
  );
}

function DashboardPanel({ t }: { t: ReturnType<typeof m>['landing']['showcase']['dashboard'] }) {
  return (
    <BrowserFrame title="app.shipped.dev/dashboard">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {t.stats.map((stat, i) => (
          <div key={stat} className="rounded-xl border border-border/30 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">{stat}</p>
            <p className="mt-1 text-lg font-semibold">{t.statValues[i]}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border/20 bg-muted/10 p-3"
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted-foreground/10" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-28 rounded bg-foreground/10" />
              <div className="h-2.5 w-16 rounded bg-muted-foreground/10" />
            </div>
            <div className="h-5 w-14 rounded-full bg-primary/10 text-center text-xs leading-5 text-primary">
              {t.activeLabel}
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function TeamPanel({ t }: { t: ReturnType<typeof m>['landing']['showcase']['team'] }) {
  return (
    <BrowserFrame title="app.shipped.dev/team">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-32 rounded bg-foreground/10" />
        <div className="h-7 w-28 rounded-[10px] bg-primary/15 text-center text-xs leading-7 text-primary">
          {t.inviteButton}
        </div>
      </div>
      <div className="space-y-2">
        {t.members.map((member, i) => (
          <div
            key={member.name}
            className="flex items-center gap-3 rounded-lg border border-border/20 bg-muted/10 p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {member.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                i < 2 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {member.status}
            </span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function BillingPanel({ t }: { t: ReturnType<typeof m>['landing']['showcase']['billing'] }) {
  return (
    <BrowserFrame title="app.shipped.dev/billing">
      <div className="rounded-xl border border-border/30 bg-muted/20 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t.currentPlanLabel}</p>
            <p className="mt-1 text-xl font-semibold">{t.plan}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{t.price}</p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {t.status}
            </span>
          </div>
        </div>
        <div className="mt-4 h-px bg-border/40" />
        <p className="mt-3 text-xs text-muted-foreground">{t.nextBilling}</p>
      </div>
      <div className="mt-4 flex gap-3">
        <div className="h-9 flex-1 rounded-[10px] bg-muted/30 text-center text-sm leading-9 text-muted-foreground">
          {t.manageButton}
        </div>
        <div className="h-9 flex-1 rounded-[10px] bg-primary/15 text-center text-sm leading-9 text-primary">
          {t.upgradeButton}
        </div>
      </div>
    </BrowserFrame>
  );
}

export function Showcase() {
  const [activeTab, setActiveTab] = useState(0);
  const { locale } = useLocale();
  const t = m(locale).landing.showcase;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t.title}</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t.subtitle}</p>
        </div>

        <div className="mx-auto mb-8 flex max-w-md justify-center gap-1 rounded-full border bg-muted/30 p-1">
          {t.tabs.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                activeTab === i
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-4xl">
          {activeTab === 0 && <DashboardPanel t={t.dashboard} />}
          {activeTab === 1 && <TeamPanel t={t.team} />}
          {activeTab === 2 && <BillingPanel t={t.billing} />}
        </div>
      </div>
    </section>
  );
}

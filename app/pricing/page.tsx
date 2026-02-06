import Link from 'next/link';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { PLAN_CATALOG } from '@/lib/plan-catalog';
import { JsonLd } from '@/components/json-ld';

export default function PricingPage() {
  const plans = Object.values(PLAN_CATALOG);
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'https://shipped.dev';

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Pricing',
          url: `${url}/pricing`,
        }}
      />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-12 sm:px-6">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
          <p className="text-muted-foreground">
            Choose a plan for your workspace. Upgrade and manage billing from the dashboard.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login?callbackUrl=/dashboard/billing">Manage billing</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const highlighted = plan.id === 'pro';
            return (
              <Card key={plan.id} className={highlighted ? 'border-primary shadow-lg' : ''}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={highlighted ? 'default' : 'outline'} className="w-full">
                    <Link href="/signup">Start with {plan.name}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}

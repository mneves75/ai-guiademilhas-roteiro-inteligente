import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Features() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Everything here is intended to be copy-pasted into a real product.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Auth</CardTitle>
              <CardDescription>Sessions, providers, and safe defaults.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Build-time env validation avoids silent auth misconfiguration.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Stripe helpers and webhooks.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Stripe initialized at runtime to prevent build-time crashes.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Database</CardTitle>
              <CardDescription>Drizzle with multiple providers.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Lazy initialization to keep `next build` safe without DB env.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

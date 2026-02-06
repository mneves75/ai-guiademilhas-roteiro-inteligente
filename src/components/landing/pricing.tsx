import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function Pricing() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          This starter is open source. Pricing here is only sample UI.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Starter</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              For prototypes and internal tools.
              <div className="mt-4 text-3xl font-semibold text-foreground">$0</div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/signup">Use starter</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              For shipping a real SaaS with confidence.
              <div className="mt-4 text-3xl font-semibold text-foreground">$49</div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/signup">Start trial</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Custom needs and support.
              <div className="mt-4 text-3xl font-semibold text-foreground">Talk to us</div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/signup">Contact</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}

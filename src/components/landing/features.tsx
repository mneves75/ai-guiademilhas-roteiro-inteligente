import { Shield, Users, CreditCard, Mail, BarChart3, Zap } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Authentication',
    description: 'Better Auth with email/password, OAuth, and magic links out of the box.',
  },
  {
    icon: Users,
    title: 'Multi-Tenancy',
    description: 'Workspaces and teams with role-based access control.',
  },
  {
    icon: CreditCard,
    title: 'Stripe Payments',
    description: 'Subscriptions, one-time payments, and customer portal.',
  },
  {
    icon: Mail,
    title: 'Email System',
    description: 'Transactional emails with React Email and Resend.',
  },
  {
    icon: BarChart3,
    title: 'Admin Dashboard',
    description: 'User management, metrics, and impersonation for support.',
  },
  {
    icon: Zap,
    title: 'Performance',
    description: 'Server Components, edge runtime, and optimized builds.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Everything you need to ship
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Production-ready features so you can focus on what makes your product unique.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="glass-card rounded-2xl p-6">
              <feature.icon className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

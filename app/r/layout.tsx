import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function SharedReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">{children}</div>
      </main>
    </div>
  );
}

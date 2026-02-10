import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Policy',
};

function resolveContactEmail() {
  return process.env.SECURITY_CONTACT_EMAIL?.trim() || 'marcusneves2004@yahoo.com.br';
}

export default function SecurityPolicyPage() {
  const contactEmail = resolveContactEmail();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold">Security Policy</h1>

      <p className="text-muted-foreground">
        We take security vulnerabilities seriously. If you discover a security issue, please report
        it responsibly.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Reporting a Vulnerability</h2>
        <p className="text-muted-foreground">
          Do not open a public GitHub issue for security vulnerabilities.
        </p>
        <p className="text-muted-foreground">
          Contact:{' '}
          <a className="underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What to Include</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Description of the vulnerability</li>
          <li>Steps to reproduce</li>
          <li>Potential impact</li>
          <li>Suggested fix (if any)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Response Process</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Acknowledgment within 48 hours</li>
          <li>Severity and impact assessment</li>
          <li>Fix for confirmed issues</li>
          <li>Coordinated disclosure timing</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold" id="acknowledgments">
          Acknowledgments
        </h2>
        <p className="text-muted-foreground">
          We appreciate security researchers who help keep this project safe. Contributors who
          report valid vulnerabilities may be acknowledged here (with permission).
        </p>
      </section>
    </main>
  );
}

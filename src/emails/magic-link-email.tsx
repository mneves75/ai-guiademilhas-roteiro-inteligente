import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface MagicLinkEmailProps {
  signInUrl: string;
  expiresInMinutes?: number;
  supportUrl: string;
}

export function MagicLinkEmail({
  signInUrl,
  expiresInMinutes = 5,
  supportUrl,
}: MagicLinkEmailProps) {
  return (
    <BaseLayout preview="Your magic sign-in link">
      <Section style={content}>
        <Heading style={heading}>Sign in to Shipped</Heading>
        <Text style={paragraph}>
          Click the button below to sign in. This link expires in {expiresInMinutes} minutes.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={signInUrl}>
            Sign In
          </Button>
        </Section>
        <Text style={smallText}>If you didn&apos;t request this email, you can ignore it.</Text>
        <Text style={smallText}>
          If the button doesn&apos;t work, copy and paste this URL into your browser:
          <br />
          {signInUrl}
        </Text>
        <Text style={smallText}>Need help? Visit {supportUrl}.</Text>
      </Section>
    </BaseLayout>
  );
}

export default MagicLinkEmail;

const content = {
  padding: '24px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#1a1a1a',
  marginBottom: '24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4a4a4a',
  marginBottom: '16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 600,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
};

const smallText = {
  fontSize: '12px',
  color: '#8898aa',
  marginTop: '12px',
  wordBreak: 'break-all' as const,
};

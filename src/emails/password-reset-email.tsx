import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function PasswordResetEmail({
  name,
  resetUrl,
  expiresInMinutes = 60,
}: PasswordResetEmailProps) {
  return (
    <BaseLayout preview="Reset your Shipped password">
      <Section style={content}>
        <Heading style={heading}>Reset your password</Heading>
        <Text style={paragraph}>Hi {name},</Text>
        <Text style={paragraph}>
          We received a request to reset your password. Click the button below to choose a new
          password:
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={resetUrl}>
            Reset Password
          </Button>
        </Section>
        <Text style={paragraph}>
          This link will expire in {expiresInMinutes} minutes. If you didn&apos;t request a password
          reset, you can safely ignore this email.
        </Text>
        <Section style={warningBox}>
          <Text style={warningText}>
            ⚠️ If you didn&apos;t request this password reset, someone may be trying to access your
            account. Consider enabling two-factor authentication for extra security.
          </Text>
        </Section>
        <Text style={smallText}>
          If the button doesn&apos;t work, copy and paste this URL into your browser:
          <br />
          {resetUrl}
        </Text>
      </Section>
    </BaseLayout>
  );
}

export default PasswordResetEmail;

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

const warningBox = {
  backgroundColor: '#fff8e1',
  borderLeft: '4px solid #ffc107',
  padding: '12px 16px',
  marginTop: '24px',
  marginBottom: '24px',
};

const warningText = {
  fontSize: '14px',
  color: '#856404',
  margin: 0,
};

const smallText = {
  fontSize: '12px',
  color: '#8898aa',
  marginTop: '24px',
  wordBreak: 'break-all' as const,
};

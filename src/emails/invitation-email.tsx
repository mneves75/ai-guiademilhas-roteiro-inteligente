import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface InvitationEmailProps {
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}

export function InvitationEmail({
  inviterName,
  workspaceName,
  role,
  inviteUrl,
  expiresAt,
}: InvitationEmailProps) {
  const expiresFormatted = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <BaseLayout preview={`${inviterName} invited you to join ${workspaceName}`}>
      <Section style={content}>
        <Heading style={heading}>You&apos;ve been invited!</Heading>
        <Text style={paragraph}>
          <strong>{inviterName}</strong> has invited you to join <strong>{workspaceName}</strong> as
          a <strong>{role}</strong>.
        </Text>
        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>Workspace:</strong> {workspaceName}
          </Text>
          <Text style={infoText}>
            <strong>Role:</strong> {role}
          </Text>
          <Text style={infoText}>
            <strong>Expires:</strong> {expiresFormatted}
          </Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={inviteUrl}>
            Accept Invitation
          </Button>
        </Section>
        <Text style={paragraph}>
          If you don&apos;t want to join this workspace, you can ignore this email.
        </Text>
        <Text style={smallText}>
          This invitation will expire on {expiresFormatted}. After that, you&apos;ll need to request
          a new invitation.
        </Text>
      </Section>
    </BaseLayout>
  );
}

export default InvitationEmail;

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

const infoBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const infoText = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#4a4a4a',
  margin: '4px 0',
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
  marginTop: '24px',
};

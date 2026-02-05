import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface WelcomeEmailProps {
  name: string;
  loginUrl?: string;
}

export function WelcomeEmail({ name, loginUrl = 'https://shipped.dev/login' }: WelcomeEmailProps) {
  return (
    <BaseLayout preview={`Welcome to Shipped, ${name}!`}>
      <Section style={content}>
        <Heading style={heading}>Welcome to Shipped! 🚀</Heading>
        <Text style={paragraph}>Hi {name},</Text>
        <Text style={paragraph}>
          Thank you for signing up for Shipped. We&apos;re excited to have you on board!
        </Text>
        <Text style={paragraph}>
          With Shipped, you can launch your SaaS in days, not months. Here&apos;s what you can do:
        </Text>
        <ul style={list}>
          <li style={listItem}>Create workspaces and invite your team</li>
          <li style={listItem}>Set up authentication with multiple providers</li>
          <li style={listItem}>Manage subscriptions and billing</li>
          <li style={listItem}>Access the admin dashboard</li>
        </ul>
        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl}>
            Get Started
          </Button>
        </Section>
        <Text style={paragraph}>
          If you have any questions, just reply to this email. We&apos;re here to help!
        </Text>
        <Text style={paragraph}>
          Best,
          <br />
          The Shipped Team
        </Text>
      </Section>
    </BaseLayout>
  );
}

export default WelcomeEmail;

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

const list = {
  paddingLeft: '24px',
  marginBottom: '24px',
};

const listItem = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4a4a4a',
  marginBottom: '8px',
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

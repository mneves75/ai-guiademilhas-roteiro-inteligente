import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Shipped</Text>
          </Section>
          {children}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Shipped. All rights reserved.
            </Text>
            <Text style={footerText}>
              You received this email because you signed up for Shipped.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '24px',
  borderBottom: '1px solid #e6ebf1',
};

const logo = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#000000',
  margin: 0,
};

const footer = {
  padding: '24px',
  borderTop: '1px solid #e6ebf1',
};

const footerText = {
  fontSize: '12px',
  color: '#8898aa',
  margin: '4px 0',
};

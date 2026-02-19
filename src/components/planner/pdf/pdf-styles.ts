import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #e5e5e5',
    paddingBottom: 12,
  },
  brand: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  summary: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.5,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111827',
  },
  item: {
    fontSize: 10,
    marginBottom: 4,
    paddingLeft: 12,
    lineHeight: 1.4,
    color: '#374151',
  },
  tag: {
    fontSize: 8,
    fontWeight: 'bold',
    marginRight: 4,
  },
  link: {
    fontSize: 8,
    color: '#2563eb',
    textDecoration: 'underline',
    marginLeft: 4,
  },
  assumptions: {
    marginTop: 20,
    padding: 12,
    border: '1px dashed #9ca3af',
    borderRadius: 4,
  },
  assumptionsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: '#9ca3af',
  },
});

export const tagLabels: Record<string, string> = {
  tip: '[dica]',
  warning: '[atenção]',
  action: '[ação]',
  info: '[info]',
};

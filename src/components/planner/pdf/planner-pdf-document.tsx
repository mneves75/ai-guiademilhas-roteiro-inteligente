import { Document, Page, Text, View, Link } from '@react-pdf/renderer';
import type { PlannerReport, ReportItem } from '@/lib/planner/types';
import { isStructuredItem, getItemText } from '@/lib/planner/types';
import { styles, tagLabels } from './pdf-styles';

interface PlannerPdfDocumentProps {
  report: PlannerReport;
  locale?: string;
}

function PdfReportItem({ item }: { item: ReportItem }) {
  if (!isStructuredItem(item)) {
    return (
      <Text style={styles.item}>
        {'- '}
        {item}
      </Text>
    );
  }

  const tagIcon = item.tag ? tagLabels[item.tag] : '';

  return (
    <View style={styles.item}>
      <Text>
        {tagIcon ? `${tagIcon} ` : '- '}
        {item.text}
      </Text>
      {item.links?.map((link) => (
        <Link key={link.url} src={link.url} style={styles.link}>
          {link.label}
        </Link>
      ))}
    </View>
  );
}

export function PlannerPdfDocument({ report, locale = 'pt-BR' }: PlannerPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Guia de Milhas — Roteiro Inteligente</Text>
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.summary}>{report.summary}</Text>
        </View>

        {report.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, i) => (
              <PdfReportItem key={`${getItemText(item)}-${i}`} item={item} />
            ))}
          </View>
        ))}

        {report.assumptions.length > 0 && (
          <View style={styles.assumptions}>
            <Text style={styles.assumptionsTitle}>
              {locale === 'pt-BR' ? 'Assunções' : 'Assumptions'}
            </Text>
            {report.assumptions.map((item, i) => (
              <Text key={`assumption-${i}`} style={styles.item}>
                {'- '}
                {item}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.footer} fixed>
          guiademilhas.com.br — {locale === 'pt-BR' ? 'Gerado por IA' : 'AI Generated'}
        </Text>
      </Page>
    </Document>
  );
}

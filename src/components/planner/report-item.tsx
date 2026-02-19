import type { ReportItem } from '@/lib/planner/types';
import { isStructuredItem } from '@/lib/planner/types';

const tagStyles: Record<string, { icon: string; className: string }> = {
  tip: { icon: '\u{1F4A1}', className: 'text-blue-600 dark:text-blue-400' },
  warning: { icon: '\u26A0\uFE0F', className: 'text-amber-600 dark:text-amber-400' },
  action: { icon: '\u2192', className: 'text-green-600 dark:text-green-400 font-medium' },
  info: { icon: '\u2139', className: 'text-muted-foreground' },
};

export function ReportItemView({ item }: { item: ReportItem }) {
  if (!isStructuredItem(item)) {
    return <>{item}</>;
  }

  const tag = item.tag ? tagStyles[item.tag] : null;

  return (
    <span>
      {tag && <span className={tag.className}>{tag.icon} </span>}
      <span className={tag?.className}>{item.text}</span>
      {item.links && item.links.length > 0 && (
        <span className="ml-2 inline-flex gap-2">
          {item.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {link.label}
            </a>
          ))}
        </span>
      )}
    </span>
  );
}

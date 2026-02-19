import { getRequestLocale } from '@/lib/locale-server';
import PlannerForm from '@/components/planner/planner-form';

export default async function PlannerPage() {
  const locale = await getRequestLocale();
  return <PlannerForm locale={locale} />;
}

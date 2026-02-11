import { getRequestLocale } from '@/lib/locale-server';
import PlannerForm from './planner-form';

export default async function PlannerPage() {
  const locale = await getRequestLocale();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PlannerForm locale={locale} />
    </div>
  );
}

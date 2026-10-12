import { OpsCostsClient } from './ops-costs-client';
import { requireApprovedUser } from '@/lib/auth-guard';

export const metadata = { title: 'Ops Costs Lab' };

export default async function OpsCostsPage() {
  await requireApprovedUser();

  return <OpsCostsClient />;
}

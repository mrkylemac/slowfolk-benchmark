import { TrackerClient } from './tracker-client';
import { requireApprovedUser } from '@/lib/auth-guard';

export const metadata = { title: 'Financial Tracker' };

export default async function TrackerPage() {
  await requireApprovedUser();

  return <TrackerClient />;
}

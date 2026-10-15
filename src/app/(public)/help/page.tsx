import { redirect } from 'next/navigation';
import { getAllHelpDocs } from '@/lib/help-docs';

export default function HelpLandingPage() {
  const docs = getAllHelpDocs();
  const firstDoc = docs[0];

  if (firstDoc) {
    redirect(`/help/${firstDoc.slug}`);
  }

  // Fallback - should not happen if docs exist
  redirect('/');
}

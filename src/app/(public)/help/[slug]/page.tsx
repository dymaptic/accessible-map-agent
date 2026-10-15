import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PublicHeader } from '@/components/landing/PublicHeader';
import { Footer } from '@/components/landing/Footer';
import { getAllHelpDocs, getHelpDoc } from '@/lib/help-docs';
import { ReactNode } from 'react';

// Generate a URL-friendly slug from heading text for anchor links
function slugify(children: ReactNode): string {
  return String(children)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateStaticParams() {
  return getAllHelpDocs().map(doc => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getHelpDoc(slug);
  return { title: `${doc?.title || 'Help'} - Accessible Map Agent` };
}

export default async function HelpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getHelpDoc(slug);
  if (!doc) notFound();

  const allDocs = getAllHelpDocs();

  return (
    <div className="min-h-screen bg-dark-bg">
      <PublicHeader />

      {/* Hero-style Help Center Header - matches landing page pattern */}
      <section className="relative overflow-hidden bg-dark-bg pt-28 pb-8 sm:pt-32 sm:pb-14">
        {/* Background pattern - matches landing page Hero grid visual size */}
        <div className="absolute inset-0 opacity-5">
          <svg
            className="h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="grid-help"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100" height="40" fill="url(#grid-help)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-teal to-teal-dark rounded-lg flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-white" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Accessible Map Agent</h1>
                <span className="text-lg sm:text-xl font-medium text-gray-400">Help Center</span>
              </div>
            </div>
            <Link href="/" className="text-sm text-teal-light hover:text-coral hover:underline transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <nav className="bg-dark-bg border-y border-gray-700/50" aria-label="Help documentation">
        <div className="mx-auto max-w-7xl px-4">
          <ul className="flex flex-col sm:flex-row sm:justify-center gap-1" role="list">
            {allDocs.map(d => (
              <li key={d.slug} className="w-full sm:w-auto sm:flex-shrink-0">
                <Link
                  href={`/help/${d.slug}`}
                  className={`block px-4 py-3 sm:px-6 sm:py-4 text-base font-medium border-l-3 sm:border-l-0 sm:border-b-3 transition-colors ${
                    d.slug === slug
                      ? 'text-coral border-coral bg-gray-800/50 sm:bg-transparent'
                      : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/30 sm:hover:bg-transparent'
                  }`}
                  aria-current={d.slug === slug ? 'page' : undefined}
                >
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="bg-dark-bg-light">
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-teal-light prose-a:hover:text-coral prose-li:text-gray-300 prose-img:rounded-lg prose-img:border prose-img:border-gray-700 prose-code:text-coral-light prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none [&_blockquote_p:first-of-type::before]:content-none [&_blockquote_p:last-of-type::after]:content-none prose-hr:border-gray-700">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Add id attributes to headings for anchor link navigation
                h1: ({ children, ...props }) => {
                  const id = slugify(children);
                  return <h1 id={id} {...props}>{children}</h1>;
                },
                h2: ({ children, ...props }) => {
                  const id = slugify(children);
                  return <h2 id={id} {...props}>{children}</h2>;
                },
                h3: ({ children, ...props }) => {
                  const id = slugify(children);
                  return <h3 id={id} {...props}>{children}</h3>;
                },
                h4: ({ children, ...props }) => {
                  const id = slugify(children);
                  return <h4 id={id} {...props}>{children}</h4>;
                },
                img: ({ src, alt, ...props }) => {
                  // Transform ../../public/images/help/foo.png to /images/help/foo.png for web
                  const webSrc = typeof src === 'string' ? src.replace(/^\.\.\/\.\.\/public/, '') : src;
                  return <img src={webSrc} alt={alt} {...props} />;
                }
              }}
            >
              {doc.content}
            </ReactMarkdown>
          </article>

          {/* Prev/Next Navigation */}
          <div className="mt-12 flex justify-between border-t border-gray-700 pt-6">
            {doc.prev ? (
              <Link href={`/help/${doc.prev.slug}`} className="text-teal-light hover:text-coral transition-colors">
                &larr; {doc.prev.title}
              </Link>
            ) : <span />}
            {doc.next ? (
              <Link href={`/help/${doc.next.slug}`} className="text-teal-light hover:text-coral transition-colors">
                {doc.next.title} &rarr;
              </Link>
            ) : <span />}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

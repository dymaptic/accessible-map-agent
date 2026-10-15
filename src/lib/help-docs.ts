import fs from 'fs';
import path from 'path';

const HELP_DIR = path.join(process.cwd(), 'content/help');

export interface HelpDoc {
  slug: string;
  filename: string;
  title: string;
  content: string;
}

// Get all help docs, sorted by filename (numeric prefix determines order)
export function getAllHelpDocs(): HelpDoc[] {
  const files = fs.readdirSync(HELP_DIR)
    .filter(f => f.endsWith('.md'))
    .sort(); // 01-foo.md, 02-bar.md, etc.

  return files.map(filename => {
    const content = fs.readFileSync(path.join(HELP_DIR, filename), 'utf-8');
    const slug = filename.replace(/^\d+-/, '').replace(/\.md$/, ''); // Strip prefix and extension
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : slug;

    return { slug, filename, title, content };
  });
}

// Get a single doc by slug
export function getHelpDoc(slug: string): (HelpDoc & { prev: HelpDoc | null; next: HelpDoc | null }) | null {
  const docs = getAllHelpDocs();
  const index = docs.findIndex(d => d.slug === slug);
  if (index === -1) return null;

  return {
    ...docs[index],
    prev: index > 0 ? docs[index - 1] : null,
    next: index < docs.length - 1 ? docs[index + 1] : null,
  };
}

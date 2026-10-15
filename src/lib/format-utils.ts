/**
 * Shared format conversion utilities for map descriptions.
 *
 * Descriptions are stored as Markdown. These converters produce
 * HTML and plain-text variants for different consumption contexts.
 */

/**
 * Convert markdown to basic HTML.
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    // Lists
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    // Line breaks
    .replace(/\n\n/gim, "</p><p>")
    .replace(/\n/gim, "<br>");

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  // Wrap consecutive list items in ul
  html = html.replace(/(<li>.*<\/li>)+/g, "<ul>$&</ul>");

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
}

/**
 * Convert markdown to plain text optimised for screen readers.
 *
 * Design choices:
 *  - Headers become regular-case titles followed by a blank line,
 *    giving screen readers a natural pause between sections.
 *  - Bold / italic markers are stripped (inner text kept).
 *  - List items are indented with "  - " for a clean linear read.
 *  - Code-fenced blocks (``` … ```) are unwrapped; the compliance
 *    metadata hashtag block is removed entirely since it is not
 *    meaningful when read aloud.
 *  - Paragraph spacing is preserved via blank lines.
 */
export function markdownToPlainText(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let inCodeBlock = false;
  let isComplianceBlock = false;
  let inComplianceSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // --- skip entire Compliance Metadata section ---
    if (/^#{1,3}\s+compliance\s+metadata/i.test(line)) {
      inComplianceSection = true;
      continue;
    }
    if (inComplianceSection) {
      // A new header of equal or higher level ends the section
      if (/^#{1,3}\s/.test(line) && !/compliance\s+metadata/i.test(line)) {
        inComplianceSection = false;
        // fall through to process this line normally
      } else {
        continue;
      }
    }

    // --- code-fence handling ---
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        // Opening fence – peek ahead to decide if this is the
        // compliance metadata block (#MapALT …).
        inCodeBlock = true;
        isComplianceBlock = false;

        // Look at the next non-empty line inside the block
        for (let j = i + 1; j < lines.length; j++) {
          const peek = lines[j].trim();
          if (peek === "") continue;
          if (peek.startsWith("```")) break; // empty block
          if (peek.startsWith("#MapALT") || peek.startsWith("#ADA_TitleII")) {
            isComplianceBlock = true;
          }
          break;
        }
        continue; // skip the opening fence line itself
      } else {
        // Closing fence
        inCodeBlock = false;
        isComplianceBlock = false;
        continue;
      }
    }

    if (inCodeBlock) {
      // Drop compliance metadata lines; keep other code content as-is
      if (!isComplianceBlock) {
        out.push(line);
      }
      continue;
    }

    // --- headers ---
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      // Add a blank line before the header (unless we're at the start)
      if (out.length > 0 && out[out.length - 1] !== "") {
        out.push("");
      }
      out.push(h1[1]);
      out.push("");
      continue;
    }

    const h2 = line.match(/^## (.+)/);
    if (h2) {
      if (out.length > 0 && out[out.length - 1] !== "") {
        out.push("");
      }
      out.push(h2[1]);
      out.push("");
      continue;
    }

    const h3 = line.match(/^### (.+)/);
    if (h3) {
      if (out.length > 0 && out[out.length - 1] !== "") {
        out.push("");
      }
      out.push(h3[1]);
      out.push("");
      continue;
    }

    // --- list items ---
    const listMatch = line.match(/^[-*] (.+)/);
    if (listMatch) {
      out.push(`  - ${stripInlineMarkdown(listMatch[1])}`);
      continue;
    }

    // --- horizontal rules (---, ***, ___) ---
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      // Treat as a blank line (visual separator has no meaning when read aloud)
      if (out.length === 0 || out[out.length - 1] !== "") {
        out.push("");
      }
      continue;
    }

    // --- blank lines ---
    if (line.trim() === "") {
      // Avoid consecutive blank lines
      if (out.length === 0 || out[out.length - 1] !== "") {
        out.push("");
      }
      continue;
    }

    // --- regular text ---
    out.push(stripInlineMarkdown(line));
  }

  // Trim leading/trailing blank lines
  while (out.length > 0 && out[0] === "") out.shift();
  while (out.length > 0 && out[out.length - 1] === "") out.pop();

  return out.join("\n");
}

/**
 * Strip inline markdown (bold, italic) from a line of text.
 */
function stripInlineMarkdown(text: string): string {
  return (
    text
      // Bold **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      // Italic *text* or _text_
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      // Inline code `text`
      .replace(/`([^`]+)`/g, "$1")
  );
}

/** Default NDA template when company has not saved custom content in VMS settings. */
export const DEFAULT_NDA_TEMPLATE = `# Non-Disclosure Agreement

## Confidentiality Obligation

By entering the premises of **[Company Name]**, I ("the Visitor") acknowledge and agree to the following:

1. **Confidential Information**: Any information, whether written, oral, or visual, that I may access, observe, or receive during my visit is considered confidential.

2. **Non-Disclosure**: I agree not to disclose, publish, or otherwise reveal any confidential information to any third party during or after my visit without prior written consent.

3. **No Recording**: I will not photograph, video record, or make audio recordings of any area, equipment, process, or document without explicit written permission.

4. **Return of Materials**: I will return any documents, materials, or equipment provided to me during the visit before leaving the premises.

5. **Duration**: This obligation of confidentiality shall remain in effect indefinitely and shall survive the conclusion of my visit.

6. **Acknowledgement**: I understand that violation of this agreement may result in legal action.

**By signing below (or accepting digitally), I confirm that I have read, understood, and agree to the terms above.**`;

function ndaInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

const NUMBERED_LINE = /^\d+\.\s+/;
const BULLET_LINE = /^-\s+/;

const OL_STYLE = 'list-style-type:decimal;list-style-position:outside;padding-left:1.75rem;margin:0.5rem 0';
const UL_STYLE = 'list-style-type:disc;list-style-position:outside;padding-left:1.75rem;margin:0.5rem 0';

/** Simple markdown-to-HTML for NDA preview (headings, bold, lists, paragraphs). */
export function renderNdaMarkdown(md: string): string {
  const lines = md.split('\n');
  const parts: string[] = [];
  const paragraphBuf: string[] = [];
  const numberedItems: string[] = [];
  const bulletItems: string[] = [];

  const flushParagraph = () => {
    const text = paragraphBuf.join(' ').trim();
    if (text) {
      parts.push(`<p style="margin:0.4rem 0">${ndaInline(text)}</p>`);
    }
    paragraphBuf.length = 0;
  };

  const flushNumberedList = () => {
    if (!numberedItems.length) return;
    const items = numberedItems
      .map((item) => `<li style="margin-bottom:0.25rem;display:list-item">${ndaInline(item)}</li>`)
      .join('');
    parts.push(`<ol style="${OL_STYLE}">${items}</ol>`);
    numberedItems.length = 0;
  };

  const flushBulletList = () => {
    if (!bulletItems.length) return;
    const items = bulletItems
      .map((item) => `<li style="margin-bottom:0.25rem;display:list-item">${ndaInline(item)}</li>`)
      .join('');
    parts.push(`<ul style="${UL_STYLE}">${items}</ul>`);
    bulletItems.length = 0;
  };

  const flushListsAndParagraph = () => {
    flushParagraph();
    flushNumberedList();
    flushBulletList();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushBulletList();
      continue;
    }

    if (line.startsWith('## ')) {
      flushListsAndParagraph();
      parts.push(
        `<h2 style="font-size:1.1rem;font-weight:700;margin:0.75rem 0 0.4rem">${ndaInline(line.slice(3))}</h2>`,
      );
      continue;
    }

    if (line.startsWith('# ')) {
      flushListsAndParagraph();
      parts.push(
        `<h1 style="font-size:1.25rem;font-weight:700;margin:0.75rem 0 0.4rem">${ndaInline(line.slice(2))}</h1>`,
      );
      continue;
    }

    if (NUMBERED_LINE.test(line)) {
      flushParagraph();
      flushBulletList();
      numberedItems.push(line.replace(/^\d+\.\s*/, ''));
      continue;
    }

    if (BULLET_LINE.test(line)) {
      flushParagraph();
      flushNumberedList();
      bulletItems.push(line.replace(/^-\s*/, ''));
      continue;
    }

    flushNumberedList();
    flushBulletList();
    paragraphBuf.push(line);
  }

  flushListsAndParagraph();
  return parts.join('');
}

export function resolveNdaTemplateContent(
  template: string | null | undefined,
  companyName: string,
): string {
  const raw = (template?.trim() || DEFAULT_NDA_TEMPLATE);
  return raw.replace(/\[Company Name\]/g, companyName);
}

export type NoteBlock =
  | { type: 'heading'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string }

/** Drops inline markdown that would show as raw symbols: links keep their text, emphasis and code marks go. */
const plain = (text: string) =>
  text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__|`)/g, '')
    .trim()

/**
 * Turns a GitHub release description into headings, bullets and paragraphs — enough for the
 * notes people write by hand and for GitHub's generated "What's Changed" lists.
 */
export function parseReleaseNotes(body: string): NoteBlock[] {
  const blocks: NoteBlock[] = []
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    const bullet = line.match(/^[-*+]\s+(.*)$/)
    if (heading) blocks.push({ type: 'heading', text: plain(heading[1]) })
    else if (bullet) blocks.push({ type: 'bullet', text: plain(bullet[1]) })
    else blocks.push({ type: 'paragraph', text: plain(line) })
  }
  return blocks
}

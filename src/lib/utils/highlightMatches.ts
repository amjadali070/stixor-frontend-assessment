export interface TextSegment {
  text: string;
  match: boolean;
}

/**
 * Splits `text` into segments around every case-insensitive, non-overlapping
 * occurrence of `query`. Pure — display casing is preserved from `text`;
 * only the comparison is lowercased. An empty/whitespace-only query returns
 * the whole text as a single non-matching segment.
 */
export function splitOnMatch(text: string, query: string): TextSegment[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [{ text, match: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const segments: TextSegment[] = [];

  let cursor = 0;
  while (cursor <= text.length) {
    const index = lowerText.indexOf(lowerQuery, cursor);
    if (index === -1) {
      segments.push({ text: text.slice(cursor), match: false });
      break;
    }
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), match: false });
    }
    segments.push({
      text: text.slice(index, index + trimmedQuery.length),
      match: true,
    });
    cursor = index + trimmedQuery.length;
  }

  return segments.filter((segment) => segment.text.length > 0);
}

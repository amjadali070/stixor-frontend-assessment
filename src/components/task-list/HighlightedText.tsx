import { splitOnMatch } from "@/lib/utils/highlightMatches";

interface HighlightedTextProps {
  text: string;
  query: string;
}

/**
 * Wraps matched substrings in <mark>. Background-only styling (text keeps
 * inheriting its parent's color) verified at 14.33:1 (light) / 7.35:1
 * (dark) against the foreground color used by the title/customer.name
 * cells this renders into — see DECISIONS.md.
 */
export function HighlightedText({ text, query }: HighlightedTextProps) {
  const segments = splitOnMatch(text, query);

  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark
            key={index}
            className="rounded-sm bg-amber-200 text-inherit dark:bg-amber-300/30"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

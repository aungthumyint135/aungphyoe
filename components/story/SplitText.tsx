import { Fragment } from "react";

type SplitTextProps = {
  text: string;
  /** Split into characters (default) or whole words. */
  by?: "chars" | "words";
};

/**
 * Splits text into masked spans for `data-reveal="chars"` animations.
 * Screen readers get the plain sentence; the split spans are aria-hidden.
 * Server-renderable: no client JS.
 */
export function SplitText({ text, by = "chars" }: SplitTextProps) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, wi) => (
          <Fragment key={`${word}-${wi}`}>
            <span className="inline-block whitespace-nowrap">
              {by === "words" ? (
                <span data-char-mask>
                  <span data-char>{word}</span>
                </span>
              ) : (
                Array.from(word).map((char, ci) => (
                  <span data-char-mask key={ci}>
                    <span data-char>{char}</span>
                  </span>
                ))
              )}
            </span>
            {wi < words.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    </>
  );
}

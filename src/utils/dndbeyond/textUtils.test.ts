import { describe, it, expect } from "vitest";
import { htmlToPlainText, normalizeName } from "@/utils/dndbeyond/textUtils";

describe("htmlToPlainText", () => {
  it("returns an empty string for missing text", () => {
    expect(htmlToPlainText(null)).toBe("");
    expect(htmlToPlainText(undefined)).toBe("");
    expect(htmlToPlainText("")).toBe("");
  });

  it("turns paragraphs and line breaks into newlines", () => {
    expect(htmlToPlainText("<p>Hello</p><p>World</p>")).toBe("Hello\nWorld");
    expect(htmlToPlainText("Line one<br>Line two<br />Line three<BR/>End")).toBe("Line one\nLine two\nLine three\nEnd");
  });

  it("turns list items into dashed lines", () => {
    expect(htmlToPlainText("<ul><li>One</li><li>Two</li></ul>")).toBe("- One\n- Two");
  });

  it("strips other tags but keeps their text", () => {
    expect(htmlToPlainText('<p>You gain <strong>+1</strong> to <a href="#">AC</a>.</p>')).toBe("You gain +1 to AC.");
  });

  it("decodes the entities D&D Beyond uses", () => {
    expect(htmlToPlainText("Fish&nbsp;&amp;&nbsp;chips")).toBe("Fish & chips");
    expect(htmlToPlainText("a&mdash;b&ndash;c")).toBe("a—b–c");
    expect(htmlToPlainText("&ldquo;It&rsquo;s&rdquo; &lsquo;x&rsquo; &#39;y&#39; &quot;z&quot;")).toBe("“It’s” ‘x’ 'y' \"z\"");
  });

  it("normalises Windows line endings, trailing spaces and runs of blank lines", () => {
    expect(htmlToPlainText("<p>A</p>\r\n<p>B</p>")).toBe("A\n\nB");
    expect(htmlToPlainText("A   \nB")).toBe("A\nB");
    expect(htmlToPlainText("A\n\n\n\n\nB")).toBe("A\n\nB");
  });

  it("trims leading and trailing whitespace", () => {
    expect(htmlToPlainText("  <p> padded </p>  ")).toBe("padded");
  });
});

describe("normalizeName", () => {
  it("lowercases and drops apostrophes", () => {
    expect(normalizeName("Hunter’s Mark")).toBe("hunters mark");
    expect(normalizeName("Thieves' Tools")).toBe("thieves tools");
  });

  it("collapses punctuation and whitespace into single spaces", () => {
    expect(normalizeName("Half-Elf (Variant)")).toBe("half elf variant");
    expect(normalizeName("  Longsword,   +1 ")).toBe("longsword 1");
  });

  it("makes differently-formatted names compare equal", () => {
    expect(normalizeName("Path of the Totem Warrior")).toBe(normalizeName("path-of-the-totem-warrior"));
  });
});

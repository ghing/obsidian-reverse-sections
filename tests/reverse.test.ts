import { describe, it } from "node:test";

import {
  parseSections,
  renderSections,
  reverseSections,
  reverseNoteSections,
  Section,
} from "../reverse";
import { deepEqual, equal } from "node:assert";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as exp from "node:constants";

describe("reverseNoteSections", () => {
  it("should handle an empty string", () => {
    const noteText = "";
    const level = "h1";
    equal(reverseNoteSections(noteText, level), "");
  });

  it("should leave the text unchanged if there's no matching heading level", () => {
    const noteText = `# Sample heading

        This is a sample note.
        
        This is another paragraph.
        
        `;
    const level = "h2";
    equal(reverseNoteSections(noteText, level), noteText);
  });

  it("should reverse the order of sections with the specified heading level", () => {
    const noteText = `## Heading 1
        
        Paragraph 1.

        Paragraph 2.

        ## Heading 2

        Paragraph 3.

        ## Heading 3

        Paragraph 4.

        Paragraph 5.
        `
      .split("\n")
      .map((s) => s.replace(/^\s+/g, ""))
      .join("\n");

    const expected = `## Heading 3

        Paragraph 4.

        Paragraph 5.

        ## Heading 2

        Paragraph 3.

        ## Heading 1
        
        Paragraph 1.

        Paragraph 2.
        `
      .split("\n")
      .map((s) => s.replace(/^\s+/g, ""))
      .join("\n");

    equal(reverseNoteSections(noteText, "h2"), expected);
  });
});

describe("parseSections", () => {
  it("should return an array of strings when a document doesn't contain any headings", () => {
    const noteLines = [
      "This is a sample note.",
      "",
      "This is another paragraph.",
      "",
    ];
    const [parsed, length] = parseSections(noteLines);
    deepEqual(parsed, noteLines);
    equal(length, noteLines.length);
  });

  it("should handle a section that follows lines of text", () => {
    const noteLines = [
      "This is a sample note.",
      "",
      "This is another paragraph.",
      "",
      "## Heading 1",
      "",
      "Paragraph 1.",
      "",
      "Paragraph 2.",
      "",
    ];
    const [parsed] = parseSections(noteLines);
    equal(parsed.length, 5);

    deepEqual(parsed.slice(0, 3), noteLines.slice(0, 3));

    const section = parsed[4] as Section;
    equal(section.level, 2);
    deepEqual(section.content, noteLines.slice(4));
  });

  it("should handle a section that follows another section", () => {
    const noteLines = [
      "## Heading 1",
      "",
      "Paragraph 1.",
      "",
      "Paragraph 2.",
      "",
      "## Heading 2",
      "",
      "Paragraph 3.",
      "",
      "Paragraph 4.",
      "",
    ];

    const [parsed] = parseSections(noteLines);
    equal(parsed.length, 2);

    const section1 = parsed[0] as Section;
    equal(section1.level, 2);
    deepEqual(section1.content, noteLines.slice(0, 6));

    const section2 = parsed[1] as Section;
    equal(section2.level, 2);
    deepEqual(section2.content, noteLines.slice(6));
  });

  it("should handle nested sections", () => {
    const noteLines = [
      "# Heading 1",
      "",
      "Paragraph 1.",
      "",
      "Paragraph 2.",
      "",
      "## Heading 2",
      "",
      "Paragraph 3.",
      "",
      "Paragraph 4.",
      "",
    ];

    const [parsed] = parseSections(noteLines);
    equal(parsed.length, 1);

    const section1 = parsed[0] as Section;
    equal(section1.level, 1);
    equal(section1.content.length, 7);
    deepEqual(section1.content.slice(0, 6), noteLines.slice(0, 6));

    const section2 = section1.content[6] as Section;
    equal(section2.level, 2);
    equal(section2.content.length, 6);
    deepEqual(section2.content, noteLines.slice(6));
  });

  it("should ignore headings in a code block", () => {
    const noteLines = [
      "## Heading 1",
      "",
      "Paragraph 1.",
      "",
      "```",
      "# A comment, not a heading",
      "```",
      "",
      "## Heading 2",
      "",
      "Paragraph 2.",
      "",
    ];

    const [parsed] = parseSections(noteLines);

    equal(parsed.length, 2);
    const section1 = parsed[0] as Section;
    deepEqual(section1.content, noteLines.slice(0, 8));
    const section2 = parsed[1] as Section;
    deepEqual(section2.content, noteLines.slice(8));
  });
});

describe("reverseSections", () => {
  it("should leave the text unchanged if there aren't sections", () => {
    const parsed = [
      "This is a sample note.",
      "",
      "This is another paragraph.",
      "",
    ];

    const reversed = reverseSections(parsed, 1);

    deepEqual(reversed, parsed);
  });

  it("should leave the text unchanged if there aren't any sections with the specified level", () => {
    const parsed = [
      {
        level: 2,
        content: ["## Heading 1", "", "Paragraph 1.", "", "Paragraph 2.", ""],
      },
      {
        level: 2,
        content: ["## Heading 2", "", "Paragraph 3.", "", "Paragraph 4.", ""],
      },
    ];

    const reversed = reverseSections(parsed, 1);

    deepEqual(reversed, parsed);
  });

  it("should reverse the order of sections with the specified heading level", () => {
    const parsed = [
      {
        level: 2,
        content: ["## Heading 1", "", "Paragraph 1.", "", "Paragraph 2.", ""],
      },
      {
        level: 2,
        content: ["## Heading 2", "", "Paragraph 3.", "", "Paragraph 4.", ""],
      },
      {
        level: 2,
        content: ["## Heading 3", "", "Paragraph 5.", "", "Paragraph 6.", ""],
      },
    ];

    const expected = [
      {
        level: 2,
        content: ["## Heading 3", "", "Paragraph 5.", "", "Paragraph 6.", ""],
      },
      {
        level: 2,
        content: ["## Heading 2", "", "Paragraph 3.", "", "Paragraph 4.", ""],
      },
      {
        level: 2,
        content: ["## Heading 1", "", "Paragraph 1.", "", "Paragraph 2.", ""],
      },
    ];

    const reversed = reverseSections(parsed, 2);

    deepEqual(reversed, expected);
  });

  it("should leave lines outside of sections alone", () => {
    const parsed = [
      "This is a line outside of a section.",
      "",
      "This is another line outside of a section.",
      "",
      {
        level: 2,
        content: ["## Heading 1", "", "Paragraph 1.", "", "Paragraph 2.", ""],
      },
      {
        level: 2,
        content: ["## Heading 2", "", "Paragraph 3.", "", "Paragraph 4.", ""],
      },
      {
        level: 2,
        content: ["## Heading 3", "", "Paragraph 5.", "", "Paragraph 6.", ""],
      },
    ];

    const expected = [
      "This is a line outside of a section.",
      "",
      "This is another line outside of a section.",
      "",
      {
        level: 2,
        content: ["## Heading 3", "", "Paragraph 5.", "", "Paragraph 6.", ""],
      },
      {
        level: 2,
        content: ["## Heading 2", "", "Paragraph 3.", "", "Paragraph 4.", ""],
      },
      {
        level: 2,
        content: ["## Heading 1", "", "Paragraph 1.", "", "Paragraph 2.", ""],
      },
    ];

    const reversed = reverseSections(parsed, 2);

    deepEqual(reversed, expected);
  });
});

describe("renderSections", () => {
  it("should combine an array of strings into a single string", () => {
    const sections = [
      "This is a sample note.",
      "",
      "This is another paragraph.",
    ];

    const expected = "This is a sample note.\n\nThis is another paragraph.";

    equal(renderSections(sections), expected);
  });

  it("should combine lines in a section into a single string", () => {
    const sections = [
      {
        level: 2,
        content: ["## Heading 1", "", "Paragraph 1.", "", "Paragraph 2."],
      },
    ];

    const expected = "## Heading 1\n\nParagraph 1.\n\nParagraph 2.";

    equal(renderSections(sections), expected);
  });

  it("should handle multiple sections", () => {
    const sections = [
      {
        level: 2,
        content: ["## Heading 1", "", "Paragraph 1.", "", "Paragraph 2.", ""],
      },
      {
        level: 2,
        content: ["## Heading 2", "", "Paragraph 3.", "", "Paragraph 4.", ""],
      },
    ];

    const expected =
      "## Heading 1\n\nParagraph 1.\n\nParagraph 2.\n\n## Heading 2\n\nParagraph 3.\n\nParagraph 4.\n";

    equal(renderSections(sections), expected);
  });

  it("should handle nested sections", () => {
    const sections = [
      {
        level: 1,
        content: [
          "# Heading 1",
          "",
          "Paragraph 1.",
          "",
          "Paragraph 2.",
          "",
          {
            level: 2,
            content: ["## Heading 2", "", "Paragraph 3.", "", "Paragraph 4."],
          },
        ],
      },
    ];

    const expected =
      "# Heading 1\n\nParagraph 1.\n\nParagraph 2.\n\n## Heading 2\n\nParagraph 3.\n\nParagraph 4.";

    equal(renderSections(sections), expected);
  });
});

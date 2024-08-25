export const headingLevels = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
export type HeadingLevel = (typeof headingLevels)[number];

export function reverseNoteSections(
  noteText: string,
  level: HeadingLevel
): string {
  const lines = noteText.split("\n");
  const [parsed] = parseSections(lines);
  const levelNumber = parseInt(level[1]);
  const reversed = reverseSections(parsed, levelNumber);

  return renderSections(reversed);
}

export interface Section {
  level: number;
  content: Array<string | Section>;
}

export function parseSections(
  noteLines: Array<string>,
  level?: number
): [Array<string | Section>, number] {
  const parsed = [];

  let i = 0;
  let inCodeBlock = false;

  while (i < noteLines.length) {
    const line = noteLines[i];
    const match = line.match(/^(#{1,6})\s*(.*)/);
    if (match && !inCodeBlock) {
      const sectionLevel = match[1].length;

      if (level && sectionLevel <= level) {
        // We've reached the end of the current section
        return [parsed, i];
      }

      const initialContent: Array<string | Section> = [line];
      const section = { level: sectionLevel, content: initialContent };
      const [content, length] = parseSections(
        noteLines.slice(i + 1),
        sectionLevel
      );

      section.content = section.content.concat(content);
      parsed.push(section);

      i += length + 1;
    } else {
      const codeBlockStart = line.match(/^\s*```/);
      if (codeBlockStart && !inCodeBlock) {
        inCodeBlock = true;
      } else {
        const codeBlockEnd = line.match(/```\s*$/);
        if (codeBlockEnd) {
          inCodeBlock = false;
        }
      }
      parsed.push(line);
      i++;
    }
  }

  return [parsed, noteLines.length];
}

export function reverseSections(
  sections: Array<string | Section>,
  level: number
): Array<string | Section> {
  const saved = [];
  const toReverse = [];
  let reverseAt: number | undefined = undefined;

  for (let i = 0; i < sections.length; i++) {
    const sectionOrLine = sections[i] as Section;
    if (typeof sectionOrLine === "string") {
      saved.push(sectionOrLine);
      continue;
    }

    if (sectionOrLine.level === level) {
      if (typeof reverseAt === "undefined") {
        reverseAt = i;
      }
      toReverse.push(sectionOrLine);
    } else {
      saved.push(sectionOrLine);
    }
  }

  if (toReverse.length == 0) {
    return saved;
  }

  const before = saved.slice(0, reverseAt);
  const after = saved.slice(reverseAt);

  for (let i = toReverse.length - 1; i >= 0; i--) {
    before.push(toReverse[i]);
  }

  return before.concat(after);
}

export function renderSections(sections: Array<string | Section>): string {
  return sections
    .map((sectionOrLine) => {
      if (typeof sectionOrLine === "string") {
        return sectionOrLine;
      }

      return renderSections(sectionOrLine.content);
    })
    .join("\n");
}

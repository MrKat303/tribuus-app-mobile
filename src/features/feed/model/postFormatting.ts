export type PostTextSegment = {
  bold: boolean;
  text: string;
};

export function parsePostText(value: string): PostTextSegment[] {
  const segments: PostTextSegment[] = [];
  const pattern = /\*([^*\r\n]+)\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) segments.push({ bold: false, text: value.slice(cursor, match.index) });
    segments.push({ bold: true, text: match[1] });
    cursor = match.index + match[0].length;
  }

  if (cursor < value.length) segments.push({ bold: false, text: value.slice(cursor) });
  return segments.length > 0 ? segments : [{ bold: false, text: value }];
}

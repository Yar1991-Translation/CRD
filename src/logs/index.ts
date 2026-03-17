export type LogEntry = {
  id: string;
  date: string;
  title: string;
  summary: string;
  status: string;
  build: string;
  version: string;
  body: string;
};

type FrontMatter = Record<string, string>;

const markdownModules = import.meta.glob('./*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function parseFrontMatter(source: string) {
  if (!source.startsWith('---')) {
    return {
      meta: {} as FrontMatter,
      body: source.trim(),
    };
  }

  const lines = source.replace(/\r\n/g, '\n').split('\n');
  if (lines[0].trim() !== '---') {
    return {
      meta: {} as FrontMatter,
      body: source.trim(),
    };
  }

  const meta: FrontMatter = {};
  let index = 1;

  while (index < lines.length) {
    const line = lines[index].trim();
    index += 1;

    if (line === '---') {
      break;
    }

    if (!line) {
      continue;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    meta[key] = value;
  }

  return {
    meta,
    body: lines.slice(index).join('\n').trim(),
  };
}

function toLogEntry(path: string, raw: string): LogEntry {
  const match = path.match(/(\d{4}-\d{2}-\d{2})\.md$/);
  const date = match?.[1] ?? '1970-01-01';
  const { meta, body } = parseFrontMatter(raw);

  return {
    id: date,
    date,
    title: meta.title || date,
    summary: meta.summary || '',
    status: meta.status || '未知',
    build: meta.build || '未知',
    version: meta.version || date,
    body,
  };
}

export const changelogEntries = Object.entries(markdownModules)
  .filter(([path]) => /\/\d{4}-\d{2}-\d{2}\.md$/.test(path))
  .map(([path, raw]) => toLogEntry(path, raw))
  .sort((left, right) => right.date.localeCompare(left.date));

export const changelogSyntaxGuide = markdownModules['./SYNTAX.md'] ?? '';

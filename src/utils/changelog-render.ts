const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function applyInlineMarkdown(value: string) {
  const codeSegments: string[] = [];
  let output = escapeHtml(value);

  output = output.replace(/`([^`]+)`/g, (_, code: string) => {
    const placeholder = `@@CODE${codeSegments.length}@@`;
    codeSegments.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return output.replace(/@@CODE(\d+)@@/g, (_, index: string) => codeSegments[Number(index)] ?? '');
}

function startsHtmlBlock(line: string) {
  return /^<\/?[A-Za-z][\w:-]*/.test(line.trimStart());
}

function updateHtmlStack(line: string, stack: string[]) {
  const tagPattern = /<\/?([A-Za-z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/g;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(line)) !== null) {
    const raw = match[0];
    const tagName = match[1].toLowerCase();

    if (raw.startsWith('</')) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index] === tagName) {
          stack.splice(index, 1);
          break;
        }
      }
      continue;
    }

    if (raw.endsWith('/>') || voidTags.has(tagName)) {
      continue;
    }

    stack.push(tagName);
  }
}

function splitBlocks(source: string) {
  const normalized = source.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let inCodeFence = false;
  let inRawHtml = false;
  let htmlStack: string[] = [];

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (inCodeFence) {
      current.push(line);
      if (trimmed.startsWith('```')) {
        blocks.push(current.join('\n'));
        current = [];
        inCodeFence = false;
      }
      continue;
    }

    if (inRawHtml) {
      current.push(line);
      updateHtmlStack(line, htmlStack);

      if (htmlStack.length === 0) {
        blocks.push(current.join('\n'));
        current = [];
        inRawHtml = false;
      }
      continue;
    }

    if (trimmed.startsWith('```')) {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
        current = [];
      }

      current.push(line);
      inCodeFence = true;
      continue;
    }

    if (trimmed === '') {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
        current = [];
      }
      continue;
    }

    if (startsHtmlBlock(trimmed)) {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
        current = [];
      }

      current.push(line);
      htmlStack = [];
      updateHtmlStack(line, htmlStack);

      if (htmlStack.length === 0) {
        blocks.push(current.join('\n'));
        current = [];
      } else {
        inRawHtml = true;
      }
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    blocks.push(current.join('\n'));
  }

  return blocks;
}

function renderBlock(block: string) {
  const trimmed = block.trim();
  const lines = trimmed.split('\n');

  if (startsHtmlBlock(trimmed)) {
    return trimmed;
  }

  if (trimmed === '---') {
    return '<hr />';
  }

  if (trimmed.startsWith('```')) {
    const language = lines[0].slice(3).trim();
    const code = lines.slice(1, -1).join('\n');
    const languageAttr = language ? ` data-language="${escapeHtml(language)}"` : '';
    return `<pre class="log-code"><code${languageAttr}>${escapeHtml(code)}</code></pre>`;
  }

  if (/^#{1,6}\s/.test(lines[0]) && lines.length === 1) {
    const level = Math.min(lines[0].match(/^#+/)?.[0].length ?? 1, 6);
    const text = applyInlineMarkdown(lines[0].slice(level).trim());
    return `<h${level}>${text}</h${level}>`;
  }

  if (lines.every((line) => /^-\s+/.test(line))) {
    const items = lines
      .map((line) => `<li>${applyInlineMarkdown(line.replace(/^-\s+/, ''))}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    const items = lines
      .map((line) => `<li>${applyInlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  }

  if (lines.every((line) => /^>\s?/.test(line))) {
    const content = lines
      .map((line) => line.replace(/^>\s?/, ''))
      .map((line) => applyInlineMarkdown(line))
      .join('<br />');
    return `<blockquote><p>${content}</p></blockquote>`;
  }

  const paragraph = lines.map((line) => applyInlineMarkdown(line)).join(' ');
  return `<p>${paragraph}</p>`;
}

export function renderChangelogMarkdown(source: string) {
  return splitBlocks(source)
    .map((block) => renderBlock(block))
    .join('\n');
}

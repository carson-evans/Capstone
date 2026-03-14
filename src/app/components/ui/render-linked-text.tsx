import { Fragment, type ReactNode } from 'react';

type RenderLinkedTextOptions = {
  paragraphClassName?: string;
  linkClassName?: string;
};

const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;

function renderLineWithLinks(
  line: string,
  linkClassName: string,
  keyPrefix: string
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(LINK_PATTERN)) {
    const startIndex = match.index ?? 0;
    const fullMatch = match[0];
    const linkLabel = match[1] ?? match[3];
    const linkUrl = match[2] ?? match[3];

    if (startIndex > lastIndex) {
      nodes.push(line.slice(lastIndex, startIndex));
    }

    nodes.push(
      <a
        key={`${keyPrefix}-${startIndex}`}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {linkLabel}
      </a>
    );

    lastIndex = startIndex + fullMatch.length;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes;
}

export function renderLinkedText(
  content: string,
  {
    paragraphClassName = '',
    linkClassName = 'font-medium text-[#1e3a5f] underline underline-offset-4 hover:text-[#16304f] dark:text-sky-200 dark:hover:text-orange-200',
  }: RenderLinkedTextOptions = {}
): ReactNode[] {
  return content.split('\n\n').map((paragraph, paragraphIndex) => {
    const lines = paragraph.split('\n');

    return (
      <p key={`paragraph-${paragraphIndex}`} className={paragraphClassName}>
        {lines.map((line, lineIndex) => (
          <Fragment key={`line-${paragraphIndex}-${lineIndex}`}>
            {renderLineWithLinks(line, linkClassName, `${paragraphIndex}-${lineIndex}`)}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </Fragment>
        ))}
      </p>
    );
  });
}

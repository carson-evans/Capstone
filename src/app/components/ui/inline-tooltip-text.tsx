"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { InlineTextSegment, InlineTooltipDefinition, TooltipItemGroup } from '../../data/questionRichText';
import { Popover, PopoverAnchor, PopoverContent } from './popover';
import { cn } from './utils';

const TOOLTIP_TRIGGER_CLASS_NAME =
  'inline cursor-help rounded-sm bg-transparent p-0 text-left text-[#1e3a5f] underline decoration-[#1e3a5f] underline-offset-4 transition-colors hover:text-[#16304f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25 [font:inherit] dark:text-sky-300 dark:decoration-sky-300 dark:hover:text-sky-100 dark:focus-visible:ring-sky-300/35';

function isGroup(item: string | TooltipItemGroup): item is TooltipItemGroup {
  return typeof item === 'object' && 'groupLabel' in item;
}

function ExpandableGroup({ group }: { group: TooltipItemGroup }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="list-disc">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-left text-[#1e3a5f] underline decoration-[#1e3a5f] underline-offset-2 hover:text-[#16304f] dark:text-sky-300 dark:decoration-sky-300 dark:hover:text-sky-100"
      >
        {group.groupLabel}
        <span className="text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <ul className="mt-1 space-y-1 pl-4">
          {group.subItems.map((sub) => (
            <li key={sub} className="list-[circle]">
              {sub}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function TooltipBody({ tooltip }: { tooltip: InlineTooltipDefinition }) {
  const content = (
    <div className="space-y-3 text-left">
      {tooltip.title ? (
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tooltip.title}</p>
      ) : null}

      {tooltip.paragraphs?.map((paragraph, index) => (
        <p key={`paragraph-${index}`} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {paragraph}
        </p>
      ))}

      {tooltip.items?.length ? (
        <ul className="space-y-1.5 pl-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {tooltip.items.map((item, index) =>
            isGroup(item) ? (
              <ExpandableGroup key={item.groupLabel} group={item} />
            ) : (
              <li key={`${item}-${index}`} className="list-disc">
                {item}
              </li>
            )
          )}
        </ul>
      ) : null}

      {tooltip.note ? (
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{tooltip.note}</p>
      ) : null}
    </div>
  );

  if (!tooltip.scrollable) {
    return content;
  }

  return (
    <div className={cn('max-h-[min(18rem,calc(100dvh-9rem))] overflow-y-auto pr-3', tooltip.maxHeightClassName)}>
      {content}
    </div>
  );
}

function InlineInfoTooltip({
  text,
  tooltip,
  triggerClassName,
  trailingText,
}: {
  text: string;
  tooltip: InlineTooltipDefinition;
  triggerClassName?: string;
  trailingText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openTooltip = () => {
    clearCloseTimeout();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimeout();

    if (lockedOpen) {
      return;
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 120);
  };

  const closeTooltip = () => {
    clearCloseTimeout();
    setLockedOpen(false);
    setOpen(false);
  };

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setLockedOpen(false);
        }
      }}
    >
      <PopoverAnchor asChild>
        <span className="inline align-baseline">
          <button
            type="button"
            className={cn(TOOLTIP_TRIGGER_CLASS_NAME, triggerClassName)}
            onMouseEnter={openTooltip}
            onMouseLeave={scheduleClose}
            onFocus={openTooltip}
            onBlur={scheduleClose}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              clearCloseTimeout();
              setLockedOpen((previousValue) => {
                const nextValue = !previousValue;
                setOpen(nextValue);
                return nextValue;
              });
            }}
          >
            {text}
            {trailingText}
          </button>
        </span>
      </PopoverAnchor>
      <PopoverContent
        sideOffset={10}
        align="start"
        collisionPadding={16}
        className={cn(
          'w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.45)] dark:border-sky-200/30 dark:bg-[#1e3a5f] sm:w-96',
          tooltip.widthClassName,
        )}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleClose}
        onEscapeKeyDown={closeTooltip}
        onInteractOutside={closeTooltip}
      >
        <div className="p-4">
          <TooltipBody tooltip={tooltip} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function InlineTooltipText({
  segments,
  className,
}: {
  segments: InlineTextSegment[];
  className?: string;
}) {
  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <React.Fragment key={`text-${index}`}>{segment.text}</React.Fragment>;
        }

        return (
          <InlineInfoTooltip
            key={`tooltip-${segment.text}-${index}`}
            text={segment.text}
            tooltip={segment.tooltip}
            triggerClassName={segment.triggerClassName}
            trailingText={segment.trailingText}
          />
        );
      })}
    </span>
  );
}

export type TooltipItemGroup = {
  groupLabel: string;
  subItems: string[];
};

export type TooltipItem = string | TooltipItemGroup;

export type InlineTooltipDefinition = {
  title?: string;
  paragraphs?: string[];
  items?: TooltipItem[];
  note?: string;
  scrollable?: boolean;
  widthClassName?: string;
  maxHeightClassName?: string;
};

export type InlineTextSegment =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'tooltip';
      text: string;
      tooltip: InlineTooltipDefinition;
      triggerClassName?: string;
      trailingText?: string;
    };

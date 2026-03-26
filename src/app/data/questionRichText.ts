export type InlineTooltipDefinition = {
  title?: string;
  paragraphs?: string[];
  items?: string[];
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
    };

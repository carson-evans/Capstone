import type { CSSProperties, PropsWithChildren } from 'react';

import { cn } from '@/app/components/ui/utils';

const HERO_FADE_MASK_STYLE = {
  WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 80%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, #000 0%, #000 80%, transparent 100%)',
} satisfies CSSProperties;

type PageHeroCardProps = PropsWithChildren<{
  className?: string;
  contentClassName?: string;
  maskStyle?: CSSProperties;
}>;

export function PageHeroCard({
  children,
  className,
  contentClassName,
  maskStyle,
}: PageHeroCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-t-[2rem] border-x border-t border-white/70 bg-white/72 p-8 pb-20 shadow-[0_34px_80px_-60px_rgba(15,23,42,0.42)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/58',
        className
      )}
      style={maskStyle ?? HERO_FADE_MASK_STYLE}
    >
      <div className={cn('relative z-10', contentClassName)}>{children}</div>
    </div>
  );
}

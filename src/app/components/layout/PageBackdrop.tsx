export function PageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden print:hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,_rgba(191,219,254,0.62),_transparent_28%),radial-gradient(circle_at_88%_10%,_rgba(254,215,170,0.48),_transparent_24%),radial-gradient(circle_at_18%_52%,_rgba(219,234,254,0.42),_transparent_28%),radial-gradient(circle_at_84%_68%,_rgba(255,237,213,0.34),_transparent_24%),linear-gradient(180deg,_rgba(248,250,252,0.94)_0%,_rgba(255,255,255,0.95)_26%,_rgba(248,250,252,0.98)_100%)] dark:bg-[radial-gradient(circle_at_12%_14%,_rgba(56,189,248,0.12),_transparent_30%),radial-gradient(circle_at_88%_10%,_rgba(251,146,60,0.12),_transparent_24%),radial-gradient(circle_at_18%_52%,_rgba(125,211,252,0.08),_transparent_28%),radial-gradient(circle_at_84%_68%,_rgba(251,146,60,0.08),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,0.98)_28%,_rgba(15,23,42,0.96)_100%)]" />
      <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-[#bfdbfe]/45 blur-2xl dark:bg-sky-400/10 md:h-72 md:w-72 md:bg-[#bfdbfe]/60 md:blur-3xl md:dark:bg-sky-400/12" />
      <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#fed7aa]/42 blur-2xl dark:bg-orange-300/10 md:h-80 md:w-80 md:bg-[#fed7aa]/55 md:blur-3xl md:dark:bg-orange-300/12" />
      <div className="absolute left-[12%] top-[46%] h-52 w-52 rounded-full bg-[#dbeafe]/34 blur-2xl dark:bg-sky-300/8 md:left-[18%] md:top-[38%] md:h-64 md:w-64 md:bg-[#dbeafe]/45 md:blur-3xl md:dark:bg-sky-300/10" />
      <div className="absolute right-[6%] top-[62%] h-56 w-56 rounded-full bg-[#ffedd5]/28 blur-2xl dark:bg-orange-200/6 md:right-[10%] md:top-[54%] md:h-72 md:w-72 md:bg-[#ffedd5]/40 md:blur-3xl md:dark:bg-orange-200/8" />
      <div className="absolute left-[38%] top-[82%] h-44 w-44 rounded-full bg-[#dbeafe]/24 blur-2xl dark:bg-sky-300/5 md:hidden" />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/55 via-white/30 to-transparent dark:from-slate-950/72 dark:via-slate-950/20 dark:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white/40 via-white/12 to-transparent dark:from-slate-950/50 dark:via-slate-950/12 dark:to-transparent" />
    </div>
  );
}

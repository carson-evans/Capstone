export function PageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden print:hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,_rgba(191,219,254,0.62),_transparent_28%),radial-gradient(circle_at_88%_10%,_rgba(254,215,170,0.48),_transparent_24%),linear-gradient(180deg,_rgba(248,250,252,0.94)_0%,_rgba(255,255,255,0.95)_26%,_rgba(248,250,252,0.98)_100%)] dark:bg-[radial-gradient(circle_at_12%_14%,_rgba(56,189,248,0.12),_transparent_30%),radial-gradient(circle_at_88%_10%,_rgba(251,146,60,0.12),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,0.98)_28%,_rgba(15,23,42,0.96)_100%)]" />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#bfdbfe]/60 blur-3xl dark:bg-sky-400/12" />
      <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-[#fed7aa]/55 blur-3xl dark:bg-orange-300/12" />
      <div className="absolute left-[18%] top-[38%] h-64 w-64 rounded-full bg-[#dbeafe]/45 blur-3xl dark:bg-sky-300/10" />
      <div className="absolute right-[10%] top-[54%] h-72 w-72 rounded-full bg-[#ffedd5]/40 blur-3xl dark:bg-orange-200/8" />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/55 via-white/30 to-transparent dark:from-slate-950/72 dark:via-slate-950/20 dark:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/35 to-transparent dark:from-slate-950/42 dark:to-transparent" />
    </div>
  );
}

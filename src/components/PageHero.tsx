import LiquidBackdrop from "@/components/LiquidBackdrop";
import RiseText from "@/components/RiseText";

/** Header of the content pages (How it works, Features): the landing hero's backdrop with a smaller headline. */
export default function PageHero({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className="L-hero relative overflow-hidden">
      <LiquidBackdrop />
      <div className="relative z-[1] mx-auto max-w-5xl px-5 pb-20 pt-40 sm:pb-28 sm:pt-48">
        <h1 className="m-0 text-5xl font-normal leading-[0.95] tracking-tight text-[var(--hero-fg)] sm:text-7xl lg:text-8xl">
          <RiseText text={title} />
        </h1>
        {lead && <p className="fade-up mt-6 max-w-[46ch] text-lg text-[var(--hero-soft)]" style={{ animationDelay: "0.5s" }}>{lead}</p>}
      </div>
    </header>
  );
}

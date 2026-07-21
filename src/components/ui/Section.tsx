import Reveal from "./Reveal";

/**
 * The shared page-section scaffold. Every section of the page is the same
 * shape - a scroll-reveal wrapper plus a titled heading - so that shape lives
 * here once:
 *
 *   <Section id="about" title="About">…content…</Section>
 *
 * `id` is what the nav links jump to; `title` renders as the section heading;
 * Reveal fades the whole thing up the first time it's scrolled into view.
 *
 * The layout is responsive by CSS (globals.css): on phones the title stacks
 * above the content; on desktop (≥1200px) the title becomes a sticky left
 * rail beside the content - the site's distinct desktop look.
 */
export default function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal id={id}>
      <div className="section-layout">
        <h2 className="section-title">{title}</h2>
        <div className="section-body">{children}</div>
      </div>
    </Reveal>
  );
}

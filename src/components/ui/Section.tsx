import Reveal from "./Reveal";

/**
 * The shared page-section scaffold. Every section of the page is the same
 * shape — a scroll-reveal wrapper plus a titled heading — so that shape lives
 * here once:
 *
 *   <Section id="about" title="About">…content…</Section>
 *
 * `id` is what the nav links jump to; `title` renders as the section heading
 * with the fading rule (styled by .section-title in globals.css); Reveal fades
 * the whole thing up the first time it's scrolled into view.
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
      <h2 className="section-title">{title}</h2>
      {children}
    </Reveal>
  );
}

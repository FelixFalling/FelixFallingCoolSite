/**
 * The shared card - the box used by project (and, when re-enabled,
 * experience/education) entries. The look lives in the global .card class
 * (globals.css): a flat panel floating in the sea. This component owns the
 * markup so every card is the same element with the same semantics.
 *
 * `adrift` is what makes it float, and <Waterline /> is the sea it floats in -
 * always the LAST child, so it sits over the panel's background and under
 * nothing. Cards are siblings in a grid, so the nth-child rules in globals.css
 * de-sync their bob with no per-card markup.
 */
import Waterline from "./Waterline";

export default function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={className ? `card adrift ${className}` : "card adrift"}>
      {children}
      <Waterline />
    </article>
  );
}

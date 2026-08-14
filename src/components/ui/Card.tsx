/**
 * The shared card - the box used by project (and, when re-enabled,
 * experience/education) entries. The look lives in the global .card class
 * (globals.css), where it is a plank of salvaged ship timber; this component
 * owns the markup so every card is the same element with the same semantics.
 *
 * `adrift` is what makes it float. Cards are siblings in a grid, so the
 * nth-child rules in globals.css de-sync them with no per-card markup.
 */
export default function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={className ? `card adrift ${className}` : "card adrift"}>{children}</article>
  );
}

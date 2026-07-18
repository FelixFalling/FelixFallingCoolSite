/**
 * The shared card — the bordered, shadowed box used by project (and, when
 * re-enabled, experience/education) entries. The look lives in the global
 * .card class (globals.css); this component owns the markup so every card is
 * the same element with the same semantics.
 */
export default function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <article className={className ? `card ${className}` : "card"}>{children}</article>;
}

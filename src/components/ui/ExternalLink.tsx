/**
 * The shared external text link: opens in a new tab with the security rel
 * attributes, so no component ever hand-writes target/rel again. Pass a
 * className for the caller's own styling.
 */
export default function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener">
      {children}
    </a>
  );
}

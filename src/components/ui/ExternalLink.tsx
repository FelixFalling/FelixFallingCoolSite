/**
 * The shared external text link: opens in a new tab with the security rel
 * attributes, so no component ever hand-writes target/rel again. Pass a
 * className for the caller's own styling.
 */

/**
 * The `rel` every link that opens a new tab must carry. Exported because
 * Button.tsx and Slides.tsx open tabs too and must not drift from it - three
 * hand-written copies of a security attribute is three chances to forget one.
 *
 * WHAT EACH TOKEN DOES:
 *
 *   noopener   - the new tab gets no `window.opener` handle back to this page.
 *                Without it, the page you linked to can reach back and
 *                navigate the tab it came from (`window.opener.location = …`),
 *                which is how a link to a real site can leave a convincing
 *                fake in the tab behind you - "reverse tabnabbing". Modern
 *                browsers imply this for target="_blank", but it is stated
 *                anyway: the implicit behaviour is recent, and a rel that
 *                depends on the visitor's browser being new is not a control.
 *
 *   noreferrer - the destination is told nothing about where the click came
 *                from, not even the origin. It also implies noopener in the
 *                older engines that never learned the implicit rule, which is
 *                what makes the pair worth writing rather than either alone.
 *
 * Referrers are dropped rather than trimmed because this site is deliberately
 * pseudonymous (see the PRIVACY NOTE in data/resume.ts). Nothing here needs
 * outbound attribution, so the quiet option is free.
 */
export const EXTERNAL_REL = "noopener noreferrer";

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
    <a className={className} href={href} target="_blank" rel={EXTERNAL_REL}>
      {children}
    </a>
  );
}

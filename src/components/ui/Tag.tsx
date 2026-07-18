/**
 * The shared tag pill (e.g. a project's tech stack labels). Styled by the
 * global .tag class in globals.css.
 */
export default function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}

import styles from "./FunLink.module.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * A little floating link to the Curse of Ra clock page. The clock lives as a
 * standalone HTML file in /public/clockmaker.html, so we link straight to it
 * (prefixed with the GitHub Pages base path).
 */
export default function FunLink() {
  return (
    <a
      className={styles.link}
      href={`${BASE_PATH}/clockmaker.html`}
      title="A little something for fun"
    >
      🕑 Curse of Ra
    </a>
  );
}

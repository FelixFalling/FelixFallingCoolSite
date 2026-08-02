import Nav from "@/components/ui/Nav";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Games from "@/components/sections/Games";
import Skills from "@/components/sections/Skills";
import Activity from "@/components/sections/Activity";
import Contact from "@/components/sections/Contact";
import DeepSea from "@/components/scene/DeepSea";

/**
 * The home page. It's just an ordered list of the section components - read
 * top-to-bottom, this is the whole structure of the site. To reorder or hide
 * a section, move or delete a line here.
 *
 * PRIVACY: Experience and Education are hidden for now - this public site
 * stays pseudonymous (no employers, school, or other identifying details).
 * To bring a section back: re-add its import, its line below, its link in
 * ui/Nav.tsx, and fill in its data in data/resume.ts.
 */
export default function Home() {
  return (
    <>
      {/* First thing in the tab order: lets keyboard and screen-reader users
          jump past the nav to the content. Hidden until focused (globals.css). */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {/* The water everything below the hero sinks into. Sits behind the whole
          page (z-index: -1), so it goes first. */}
      <DeepSea />
      <Nav />
      <Hero />
      {/* tabIndex={-1}: makes <main> a valid focus target, so the skip link
          actually MOVES focus here rather than only scrolling the page - the
          next Tab then continues from the content, not from the nav. */}
      <main id="main" tabIndex={-1} className="container">
        <About />
        <Projects />
        <Games />
        <Skills />
        <Activity />
      </main>
      <Contact />
    </>
  );
}

import Nav from "@/components/ui/Nav";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import Contact from "@/components/sections/Contact";
import FunLink from "@/components/ui/FunLink";

/**
 * The home page. It's just an ordered list of the section components — read
 * top-to-bottom, this is the whole structure of the site. To reorder or hide
 * a section, move or delete a line here.
 *
 * PRIVACY: Experience and Education are hidden for now — this public site
 * stays pseudonymous (no employers, school, or other identifying details).
 * To bring a section back: re-add its import, its line below, its link in
 * ui/Nav.tsx, and fill in its data in data/resume.ts.
 */
export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <main className="container">
        <About />
        <Projects />
        <Skills />
      </main>
      <Contact />
      <FunLink />
    </>
  );
}

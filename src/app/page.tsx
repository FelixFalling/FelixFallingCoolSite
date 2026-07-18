import Nav from "@/components/ui/Nav";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import Education from "@/components/sections/Education";
import Skills from "@/components/sections/Skills";
import Contact from "@/components/sections/Contact";
import FunLink from "@/components/ui/FunLink";

/**
 * The home page. It's just an ordered list of the section components — read
 * top-to-bottom, this is the whole structure of the site. To reorder or hide
 * a section, move or delete a line here.
 */
export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <main className="container">
        <About />
        <Experience />
        <Projects />
        <Education />
        <Skills />
      </main>
      <Contact />
      <FunLink />
    </>
  );
}

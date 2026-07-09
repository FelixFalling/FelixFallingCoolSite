import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Education from "@/components/Education";
import Skills from "@/components/Skills";
import Contact from "@/components/Contact";
import FunLink from "@/components/FunLink";

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
